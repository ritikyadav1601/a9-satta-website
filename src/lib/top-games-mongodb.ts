import { MongoClient, ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import type { SK24Game } from "./types";

const databaseName = process.env.TOP_GAMES_MONGODB_DATABASE || "test";

const topGameDefinitions = [
  { name: "PARAS CITY", time: "12:50 PM", aliases: ["paras city"] },
  { name: "SADAR BAZAR", time: "01:30 PM", aliases: ["sadar bazar"] },
  { name: "GWALIOR", time: "02:30 PM", aliases: ["gwalior"] },
  { name: "DELHI BAZAR", time: "03:10 PM", aliases: ["delhi bazar"] },
  { name: "DELHI CITY", time: "03:50 PM", aliases: ["delhi city", "delhi matka"] },
  { name: "SHREE GANESH", time: "04:30 PM", aliases: ["shree ganesh", "shri ganesh"] },
  { name: "AGRA CITY", time: "05:30 PM", aliases: ["agra city", "agra"] },
  { name: "FARIDABAD", time: "06:06 PM", aliases: ["faridabad", "fridabad"] },
  { name: "JAIPUR CITY", time: "07:30 PM", aliases: ["jaipur city", "alwar"] },
  { name: "GAZIYABAD", time: "08:50 PM", aliases: ["gaziyabad", "gaziabad", "ghaziabad"] },
  { name: "VARINDAVAN CITY", time: "10:40 PM", aliases: ["varindavan city", "vrindavan city", "dwarka"] },
  { name: "GALI", time: "11:50 PM", aliases: ["gali"] },
  { name: "DESAWER", time: "05:00 AM", aliases: ["desawer", "desawar", "dswr"] },
] as const;

type GameDocument = {
  _id: ObjectId;
  name?: string;
  isActive?: boolean;
};

type ResultDocument = {
  city?: ObjectId | string;
  date?: Date | string;
  number?: string | number;
  updatedAt?: Date | string | number;
};

declare global {
  var topGamesMongoClientPromise: Promise<MongoClient> | undefined;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanResult(value: unknown) {
  const result = String(value ?? "").trim();
  return /^\d{1,2}$/.test(result) ? result.padStart(2, "0") : "XX";
}

function currentIstMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

async function getDatabase() {
  const uri = process.env.TOP_GAMES_MONGODB_URI?.trim();
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured.");
  global.topGamesMongoClientPromise ||= new MongoClient(uri).connect();
  return (await global.topGamesMongoClientPromise).db(databaseName);
}

export async function getTopGamesFromMongoDB(): Promise<SK24Game[]> {
  const database = await getDatabase();
  const games = await database
    .collection<GameDocument>("cities")
    .find({ isActive: { $ne: false } })
    .toArray();

  const gamesByName = new Map(games.map((game) => [normalizeName(String(game.name || "")), game]));
  const selectedGames = topGameDefinitions.map((definition) => ({
    definition,
    game: definition.aliases
      .map(normalizeName)
      .map((alias) => gamesByName.get(alias))
      .find(Boolean),
  }));
  const gameIds = selectedGames.flatMap(({ game }) => (game ? [game._id] : []));
  // Match the source site's result board: the previous day's board remains
  // active until 03:00 IST so late-night/early-morning games stay together.
  const boardOffset = currentIstMinutes() < 180 ? -1 : 0;
  const today = getISTDateString(boardOffset);
  const yesterday = getISTDateString(boardOffset - 1);
  const resultDates = [yesterday, today].map(
    (date) => new Date(`${date}T00:00:00.000Z`),
  );
  const results = gameIds.length
    ? await database
        .collection<ResultDocument>("dailynumbers")
        .find({ city: { $in: gameIds }, date: { $in: resultDates } })
        .sort({ updatedAt: 1 })
        .toArray()
    : [];

  const resultByGameAndDate = new Map(
    results.map((result) => [
      `${String(result.city)}:${new Date(result.date || 0).toISOString().slice(0, 10)}`,
      result,
    ]),
  );

  return selectedGames.map(({ definition, game }) => {
    const previousResult = game
      ? resultByGameAndDate.get(`${String(game._id)}:${yesterday}`)
      : undefined;
    const currentResult = game
      ? resultByGameAndDate.get(`${String(game._id)}:${today}`)
      : undefined;

    return {
      name: definition.name,
      time: definition.time,
      yesterday: cleanResult(previousResult?.number),
      today: cleanResult(currentResult?.number),
      updatedAt: currentResult?.updatedAt
        ? new Date(currentResult.updatedAt).toISOString()
        : null,
    };
  });
}
