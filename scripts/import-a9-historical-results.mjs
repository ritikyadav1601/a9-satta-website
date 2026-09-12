import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { MongoClient } from "mongodb";

const sources = [
  [169, "/Users/ritikyadav/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/9FD4046F-95F5-4CFE-92E8-623A396EA84F/results (1).ods"],
  [195, "/Users/ritikyadav/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/A6FE1E66-7FC9-4007-A9CC-3335B1A5B2E0/results (2).ods"],
  [196, "/Users/ritikyadav/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/85C8CD3A-02D7-427E-B5F8-84929FBDA69B/results (3).ods"],
  [197, "/Users/ritikyadav/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/7D27F28F-FC0D-4FFF-9525-8D1D37A742B1/results (4).ods"],
  [202, "/Users/ritikyadav/Library/Containers/net.whatsapp.WhatsApp/Data/tmp/documents/7E024527-A11A-49BC-998D-5068A7731B4C/results (5).ods"],
];

const games = [
  { sourceGameId: 169, name: "AGRA CITY", code: "AC", resultTime: "17:30:00" },
  { sourceGameId: 195, name: "PARAS CITY", code: "PC", resultTime: "12:50:00" },
  { sourceGameId: 196, name: "DELHI CITY", code: "DC", resultTime: "15:50:15" },
  { sourceGameId: 197, name: "VARINDAVAN CITY", code: "VC", resultTime: "22:40:00" },
  { sourceGameId: 202, name: "JAIPUR CITY", code: "JPC", resultTime: "19:30:00" },
];

function loadEnvironment() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

function decodeXml(value) {
  return value
    .replace(/<text:tab\/>/g, "\t")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseSource(sourceGameId, path) {
  const xml = execFileSync("unzip", ["-p", path, "content.xml"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const rows = [];
  for (const row of xml.matchAll(/<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
    const cells = [];
    for (const cell of row[1].matchAll(/<table:table-cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)) {
      const repeat = Number(cell[1].match(/table:number-columns-repeated="(\d+)"/)?.[1] || 1);
      const value = decodeXml(cell[2] || "").trim();
      cells.push(...Array(repeat).fill(value));
    }
    if (cells.length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(cells[2]) && /^\d{1,2}$/.test(cells[3])) {
      rows.push({ sourceGameId, sourceResultId: Number(cells[0]), resultDate: cells[2], result: cells[3].padStart(2, "0"), sourceFile: path });
    }
  }
  return rows;
}

const dryRun = process.argv.includes("--dry-run");
loadEnvironment();
const uri = process.env.EXTRA_GAMES_MONGO_URI?.trim();
if (!uri) throw new Error("EXTRA_GAMES_MONGO_URI is not configured.");

const records = sources.flatMap(([sourceGameId, path]) => parseSource(sourceGameId, path));
if (records.length !== 3106) throw new Error(`Expected 3106 source records, found ${records.length}.`);
const dailyRecords = Array.from(
  records.reduce((byDay, record) => {
    const key = `${record.sourceGameId}:${record.resultDate}`;
    const existing = byDay.get(key) || [];
    existing.push(record);
    byDay.set(key, existing);
    return byDay;
  }, new Map()).values(),
).map((entries) => {
  const ordered = [...entries].sort((left, right) => left.sourceResultId - right.sourceResultId);
  const selected = ordered.at(-1);
  return {
    ...selected,
    sourceEntries: ordered.map(({ sourceResultId, result }) => ({ sourceResultId, result })),
  };
});

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
try {
  await client.connect();
  const db = client.db(process.env.EXTRA_GAMES_MONGODB_DATABASE || "test");
  const gameCollection = db.collection("games");
  const resultCollection = db.collection("gameresults");
  const existingGames = await gameCollection.find({ $or: [{ name: { $in: games.map((game) => game.name) } }, { code: { $in: games.map((game) => game.code) } }] }).toArray();
  const now = new Date();
  const gameIds = new Map();

  for (const game of games) {
    const conflictingCode = existingGames.find((item) => item.code === game.code && item.name !== game.name);
    if (conflictingCode) throw new Error(`Game code ${game.code} is already used by ${conflictingCode.name}.`);
    const existing = existingGames.find((item) => item.name === game.name);
    if (existing) {
      gameIds.set(game.sourceGameId, existing._id);
      if (!dryRun) await gameCollection.updateOne({ _id: existing._id }, { $set: { code: game.code, resultTime: game.resultTime, isActive: true, a9GameId: game.sourceGameId, updatedAt: now } });
    } else if (!dryRun) {
      const inserted = await gameCollection.insertOne({ ...game, isActive: true, createdAt: now, updatedAt: now });
      gameIds.set(game.sourceGameId, inserted.insertedId);
    }
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, sourceRecords: records.length, dailyRecords: dailyRecords.length, games: games.map((game) => ({ name: game.name, resultTime: game.resultTime, existing: existingGames.some((item) => item.name === game.name) })) }, null, 2));
  } else {
    const writes = dailyRecords.map((record) => ({
      updateOne: {
        filter: { game: gameIds.get(record.sourceGameId), resultDate: record.resultDate },
        update: { $set: { ...record, game: gameIds.get(record.sourceGameId), updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    }));
    const imported = await resultCollection.bulkWrite(writes, { ordered: false });
    const verification = await resultCollection.countDocuments({ sourceGameId: { $in: games.map((game) => game.sourceGameId) } });
    console.log(JSON.stringify({ sourceRecords: records.length, dailyRecords: dailyRecords.length, gamesCreated: games.length - existingGames.filter((item) => games.some((game) => game.name === item.name)).length, matched: imported.matchedCount, modified: imported.modifiedCount, inserted: imported.upsertedCount, storedSourceRecords: verification }, null, 2));
  }
} finally {
  await client.close();
}
