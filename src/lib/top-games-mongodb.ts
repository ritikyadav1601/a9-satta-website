import { MongoClient, ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import type { SK24Game } from "./types";

const databaseName = process.env.TOP_GAMES_MONGODB_DATABASE || "test";

const topGameDefinitions = [
  { name: "SADAR BAZAR", time: "01:39 PM", aliases: ["sadar bazar"] },
  { name: "GWALIOR", time: "02:39 PM", aliases: ["gwalior"] },
  { name: "DELHI BAZAR", time: "03:00 PM", aliases: ["delhi bazar"] },
  { name: "DELHI MATKA", time: "03:39 PM", aliases: ["delhi matka"] },
  { name: "SHRI GANESH", time: "04:30 PM", aliases: ["shri ganesh"] },
  { name: "AGRA", time: "05:29 PM", aliases: ["agra"] },
  { name: "FARIDABAD", time: "06:00 PM", aliases: ["faridabad", "fridabad"] },
  { name: "ALWAR", time: "07:34 PM", aliases: ["alwar"] },
  { name: "GAZIABAD", time: "09:25 PM", aliases: ["gaziabad", "ghaziabad"] },
  { name: "DWARKA", time: "10:34 PM", aliases: ["dwarka"] },
  { name: "GALI", time: "11:25 PM", aliases: ["gali"] },
  { name: "DESAWAR", time: "05:00 AM", aliases: ["desawar", "desawer"] },
] as const;

type GameDocument = {
  _id: ObjectId;
  name?: string;
  isActive?: boolean;
};

type ResultDocument = {
  game?: ObjectId | string;
  resultDate?: string;
  result?: string | number;
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
    .collection<GameDocument>("games")
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
  const results = gameIds.length
    ? await database
        .collection<ResultDocument>("gameresults")
        .find({ game: { $in: gameIds }, resultDate: { $in: [yesterday, today] } })
        .sort({ updatedAt: 1 })
        .toArray()
    : [];

  const resultByGameAndDate = new Map(
    results.map((result) => [
      `${String(result.game)}:${result.resultDate}`,
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
      yesterday: cleanResult(previousResult?.result),
      today: cleanResult(currentResult?.result),
      updatedAt: currentResult?.updatedAt
        ? new Date(currentResult.updatedAt).toISOString()
        : null,
    };
  });
}
