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
  const today = getISTDateString(0);
  const yesterday = getISTDateString(-1);
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
      cleanResult(result.result),
    ]),
  );

  return selectedGames.map(({ definition, game }) => ({
    name: definition.name,
    time: definition.time,
    yesterday: game
      ? resultByGameAndDate.get(`${String(game._id)}:${yesterday}`) || "XX"
      : "XX",
    today: game
      ? resultByGameAndDate.get(`${String(game._id)}:${today}`) || "XX"
      : "XX",
  }));
}
