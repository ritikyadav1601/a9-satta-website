import fs from "node:fs";
import { MongoClient } from "mongodb";

const games = [
  { sourceGameId: 169, name: "AGRA CITY", revelationTime: "17:30" },
  { sourceGameId: 195, name: "PARAS CITY", revelationTime: "12:50" },
  { sourceGameId: 196, name: "DELHI CITY", revelationTime: "15:50" },
  { sourceGameId: 197, name: "VARINDAWAN CITY", revelationTime: "22:40" },
  { sourceGameId: 202, name: "JAIPUR CITY", revelationTime: "19:30" },
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

loadEnvironment();
const topUri = process.env.TOP_GAMES_MONGODB_URI?.trim();
const extraUri = process.env.EXTRA_GAMES_MONGO_URI?.trim();
if (!topUri || !extraUri) throw new Error("Both TOP_GAMES_MONGODB_URI and EXTRA_GAMES_MONGO_URI must be configured.");

const topClient = new MongoClient(topUri, { serverSelectionTimeoutMS: 10_000 });
const extraClient = new MongoClient(extraUri, { serverSelectionTimeoutMS: 10_000 });
try {
  await Promise.all([topClient.connect(), extraClient.connect()]);
  const top = topClient.db(process.env.TOP_GAMES_MONGODB_DATABASE || "test");
  const extra = extraClient.db(process.env.EXTRA_GAMES_MONGODB_DATABASE || "test");
  const cities = top.collection("cities");
  const results = top.collection("dailynumbers");
  const sourceRecords = await extra.collection("gameresults")
    .find({ sourceGameId: { $in: games.map((game) => game.sourceGameId) } })
    .toArray();
  if (sourceRecords.length !== 3076) throw new Error(`Expected 3076 imported daily records, found ${sourceRecords.length}.`);
  const sourceRowCount = sourceRecords.reduce((total, record) => total + (Array.isArray(record.sourceEntries) ? record.sourceEntries.length : 1), 0);
  if (sourceRowCount !== 3106) throw new Error(`Expected 3106 source rows, found ${sourceRowCount}.`);
  const now = new Date();
  const existingCities = await cities.find({ a9GameId: { $in: games.map((game) => game.sourceGameId) } }).toArray();
  const cityIds = new Map();

  for (const game of games) {
    const matchingName = await cities.findOne({ name: game.name });
    const existing = existingCities.find((city) => city.a9GameId === game.sourceGameId) || matchingName;
    const cityData = { name: game.name, a9GameId: game.sourceGameId, revelationTime: game.revelationTime, isActive: true, updatedAt: now };
    if (existing) {
      cityIds.set(game.sourceGameId, existing._id);
      await cities.updateOne({ _id: existing._id }, { $set: cityData });
    } else {
      const last = await cities.find({ revelationOrder: { $exists: true } }).sort({ revelationOrder: -1 }).limit(1).next();
      const inserted = await cities.insertOne({ ...cityData, revelationOrder: Number(last?.revelationOrder || 0) + 1, createdAt: now });
      cityIds.set(game.sourceGameId, inserted.insertedId);
    }
  }

  const writeResult = await results.bulkWrite(sourceRecords.map((record) => {
    const { _id, game, createdAt, updatedAt, ...sourceRecord } = record;
    const date = new Date(`${record.resultDate}T00:00:00.000Z`);
    return {
      updateOne: {
        filter: { city: cityIds.get(record.sourceGameId), date },
        update: { $set: { ...sourceRecord, number: Number(record.result), a9GameId: record.sourceGameId, city: cityIds.get(record.sourceGameId), date, revealedAt: now, updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    };
  }), { ordered: false });
  const stored = await results.countDocuments({ a9GameId: { $in: games.map((game) => game.sourceGameId) } });
  if (stored !== sourceRecords.length) throw new Error(`Top Games verification failed: expected ${sourceRecords.length}, found ${stored}.`);

  const extraResults = await extra.collection("gameresults").deleteMany({ sourceGameId: { $in: games.map((game) => game.sourceGameId) } });
  const extraGames = await extra.collection("games").deleteMany({ a9GameId: { $in: games.map((game) => game.sourceGameId) } });
  console.log(JSON.stringify({ sourceRows: sourceRowCount, dailyResults: sourceRecords.length, topGames: games.length, topMatched: writeResult.matchedCount, topInserted: writeResult.upsertedCount, extraResultsRemoved: extraResults.deletedCount, extraGamesRemoved: extraGames.deletedCount }, null, 2));
} finally {
  await Promise.all([topClient.close(), extraClient.close()]);
}
