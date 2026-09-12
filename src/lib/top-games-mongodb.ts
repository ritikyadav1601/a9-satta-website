import { MongoClient, ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import type { ChartRow, GameChartData, SK24Game } from "./types";

const databaseName = process.env.TOP_GAMES_MONGODB_DATABASE || "test";

export const topGameDefinitions = [
  { name: "PARAS CITY", time: "12:50 PM", aliases: ["paras city"] },
  { name: "SADAR BAZAR", time: "01:30 PM", aliases: ["sadar bazar"] },
  { name: "GWALIOR", time: "02:30 PM", aliases: ["gwalior"] },
  { name: "DELHI BAZAR", time: "03:10 PM", aliases: ["delhi bazar"] },
  { name: "DELHI CITY", time: "03:50 PM", aliases: ["delhi city"] },
  { name: "SHREE GANESH", time: "04:30 PM", aliases: ["shree ganesh", "shri ganesh"] },
  { name: "AGRA CITY", time: "05:30 PM", aliases: ["agra city"] },
  { name: "FARIDABAD", time: "06:06 PM", aliases: ["faridabad", "fridabad"] },
  { name: "JAIPUR CITY", time: "07:30 PM", aliases: ["jaipur city"] },
  { name: "GAZIYABAD", time: "08:50 PM", aliases: ["gaziyabad", "gaziabad", "ghaziabad"] },
  { name: "VARINDAWAN CITY", time: "10:40 PM", aliases: ["varindawan city", "varindavan city", "vrindavan city"] },
  { name: "GALI", time: "11:50 PM", aliases: ["gali", "purani gali"] },
  { name: "DESAWER", time: "05:00 AM", aliases: ["desawer", "desawar", "deshawer", "dswr"] },
] as const;

const a9MonthlyColumns = new Map<number, keyof Pick<ChartRow, "paras-city" | "delhi-city" | "agra-city" | "jaipur-city" | "varindavan-city">>([
  [195, "paras-city"],
  [196, "delhi-city"],
  [169, "agra-city"],
  [202, "jaipur-city"],
  [197, "varindavan-city"],
]);

type GameDocument = {
  _id?: ObjectId;
  name?: string;
  a9GameId?: number;
  isActive?: boolean;
  revelationTime?: string;
  revelationOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type ResultDocument = {
  city?: ObjectId | string;
  date?: Date | string;
  number?: string | number;
  updatedAt?: Date | string | number;
  sourceResultId?: number;
};

type A9ApiGame = {
  game_id?: unknown;
  result_date?: unknown;
  result?: unknown;
  status?: unknown;
};

type A9ApiResponse = { success?: boolean; games?: A9ApiGame[] };

const a9ResultsUrl = process.env.A9_RESULTS_API_URL || "https://a9-satta.com/api/results.php";

export type TopGameAdminRow = {
  name: string;
  time: string;
  cityId: string | null;
  value: string;
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

function scheduledResultTime(date: string, time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  const minute = Number(match[2]);
  const [year, month, day] = date.split("-").map(Number);

  // Convert the game's IST wall-clock time to its UTC instant.
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - 330 * 60_000);
}

function resultDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function findDefinition(name: string) {
  const normalized = normalizeName(name);
  return topGameDefinitions.find(
    (definition) =>
      normalizeName(definition.name) === normalized ||
      definition.aliases.some((alias) => normalizeName(alias) === normalized),
  );
}

async function findCityForDefinition(
  database: Awaited<ReturnType<typeof getTopGamesDatabase>>,
  definition: (typeof topGameDefinitions)[number],
) {
  const cities = await database
    .collection<GameDocument>("cities")
    .find({ isActive: { $ne: false } })
    .toArray();
  const aliases = new Set(definition.aliases.map(normalizeName));
  return cities.find((city) => aliases.has(normalizeName(String(city.name || ""))));
}

export async function getTopGameAdminRows(date: string): Promise<TopGameAdminRow[]> {
  const database = await getTopGamesDatabase();
  const cities = await database
    .collection<GameDocument>("cities")
    .find({ isActive: { $ne: false } })
    .toArray();
  const citiesByName = new Map(
    cities.map((city) => [normalizeName(String(city.name || "")), city]),
  );
  const selected = topGameDefinitions.map((definition) => ({
    definition,
    city: definition.aliases
      .map(normalizeName)
      .map((alias) => citiesByName.get(alias))
      .find(Boolean),
  }));
  const cityIds = selected.flatMap(({ city }) => (city ? [city._id] : []));
  const results = cityIds.length
    ? await database
        .collection<ResultDocument>("dailynumbers")
        .find({ city: { $in: cityIds }, date: resultDate(date) })
        .sort({ updatedAt: 1 })
        .toArray()
    : [];
  const resultByCity = new Map(results.map((result) => [String(result.city), result]));

  return selected.map(({ definition, city }) => ({
    name: definition.name,
    time: definition.time,
    cityId: city ? String(city._id) : null,
    value: city ? cleanResult(resultByCity.get(String(city._id))?.number) : "XX",
  }));
}

export async function saveTopGameResult(name: string, date: string, value: string) {
  const definition = findDefinition(name);
  if (!definition) throw new Error("This game is not in the top-games list.");
  if (!/^\d{1,2}$/.test(value.trim())) throw new Error("Result must be a number from 00 to 99.");

  const database = await getTopGamesDatabase();
  let city = await findCityForDefinition(database, definition);
  if (!city) {
    const timeMatch = definition.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let hour = Number(timeMatch?.[1] || 0) % 12;
    if (timeMatch?.[3].toUpperCase() === "PM") hour += 12;
    const revelationTime = `${String(hour).padStart(2, "0")}:${timeMatch?.[2] || "00"}`;
    const lastOrderedCity = await database
      .collection<GameDocument>("cities")
      .find({ revelationOrder: { $exists: true } })
      .sort({ revelationOrder: -1 })
      .limit(1)
      .next();
    const revelationOrder = Number(lastOrderedCity?.revelationOrder || 0) + 1;
    const inserted = await database.collection<GameDocument>("cities").insertOne({
      name: definition.name,
      isActive: true,
      revelationTime,
      revelationOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    city = { _id: inserted.insertedId, name: definition.name, isActive: true };
  }

  const now = new Date();
  const number = Number(value.trim());
  await database.collection("dailynumbers").updateOne(
    { city: city._id, date: resultDate(date) },
    {
      $set: { number, revealedAt: now, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return { name: definition.name, date, value: String(number).padStart(2, "0") };
}

function isDeclaredResult(result: ResultDocument | undefined, date: string, time: string) {
  if (!result?.updatedAt) return false;
  const scheduledAt = scheduledResultTime(date, time);
  if (!scheduledAt) return false;
  return new Date(result.updatedAt).getTime() >= scheduledAt.getTime();
}

export async function getTopGamesDatabase() {
  const uri = process.env.TOP_GAMES_MONGODB_URI?.trim();
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured.");
  global.topGamesMongoClientPromise ||= new MongoClient(uri).connect();
  return (await global.topGamesMongoClientPromise).db(databaseName);
}

export async function getTopGamesFromMongoDB(): Promise<SK24Game[]> {
  const database = await getTopGamesDatabase();
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
  // Roll the Today/Yesterday columns over at midnight IST. The source database
  // may prefill today's rows with yesterday's number, so declaration is checked
  // separately against each game's scheduled time below.
  const today = getISTDateString(0);
  const yesterday = getISTDateString(-1);
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
    const declaredCurrentResult = isDeclaredResult(currentResult, today, definition.time)
      ? currentResult
      : undefined;

    return {
      name: definition.name,
      time: definition.time,
      yesterday: cleanResult(previousResult?.number),
      today: cleanResult(declaredCurrentResult?.number),
      updatedAt: declaredCurrentResult?.updatedAt
        ? new Date(declaredCurrentResult.updatedAt).toISOString()
        : null,
    };
  });
}

/** Add the five A9 historical result columns stored in the Top Games database. */
export async function addA9TopGameMonthlyResults(rows: ChartRow[], monthName: string, yearText: string): Promise<ChartRow[]> {
  if (!rows.length) return rows;
  const monthIndex = new Date(`${monthName} 1, ${yearText}`).getMonth();
  const year = Number(yearText);
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return rows;
  const database = await getTopGamesDatabase();
  const sourceIds = [...a9MonthlyColumns.keys()];
  const cities = await database.collection<GameDocument>("cities")
    .find({ a9GameId: { $in: sourceIds } }, { projection: { _id: 1, a9GameId: 1 } })
    .toArray();
  const columnByCity = new Map(
    cities.flatMap((city) => {
      const column = a9MonthlyColumns.get(Number(city.a9GameId));
      return city._id && column ? [[String(city._id), column] as const] : [];
    }),
  );
  if (!columnByCity.size) return rows;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const results = await database.collection<ResultDocument>("dailynumbers")
    .find({ city: { $in: cities.map((city) => city._id) }, date: { $gte: start, $lt: end } })
    .sort({ sourceResultId: 1 })
    .toArray();
  const values = new Map<string, string>();
  for (const result of results) {
    const column = columnByCity.get(String(result.city));
    const date = new Date(result.date || 0).toISOString().slice(0, 10);
    if (column && date) values.set(`${date}:${column}`, cleanResult(result.number));
  }
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return rows.map((row) => {
    const date = `${prefix}-${String(row.date).padStart(2, "0")}`;
    const copy = { ...row };
    for (const column of a9MonthlyColumns.values()) copy[column] = values.get(`${date}:${column}`) || "XX";
    return copy;
  });
}

export async function getA9TopGameChart(slug: string, monthName?: string, yearText?: string): Promise<GameChartData | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  const city = await (await getTopGamesDatabase()).collection<GameDocument>("cities").findOne({
    a9GameId: { $in: [...a9MonthlyColumns.keys()] },
    name: { $regex: `^${normalizedSlug.replace(/-/g, " ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  if (!city?._id || !city.name) return null;
  const now = new Date();
  const year = Number(yearText || now.getFullYear());
  const monthIndex = monthName ? new Date(`${monthName} 1, ${year}`).getMonth() : now.getMonth();
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const values = new Map<string, string>();
  const entries = await (await getTopGamesDatabase()).collection<ResultDocument>("dailynumbers")
    .find({ city: city._id, date: { $gte: start, $lt: end } })
    .sort({ sourceResultId: 1 })
    .toArray();
  for (const entry of entries) values.set(new Date(entry.date || 0).toISOString().slice(0, 10), cleanResult(entry.number));
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const month = new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "long" });
  return {
    gameName: city.name,
    chartTitle: `${city.name} - ${month} ${year}`,
    month,
    year: String(year),
    columns: ["Date", "Day", "Result"],
    results: Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { date: String(day).padStart(2, "0"), day: new Date(year, monthIndex, day).toLocaleString("en-US", { weekday: "long" }), result: values.get(date) || "XX" };
    }),
    scrapedAt: Date.now(),
  };
}

/** Fetch published A9 results and persist them in Top Games MongoDB. */
export async function syncA9ResultsToTopGames() {
  const response = await fetch(a9ResultsUrl, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`A9 results API returned HTTP ${response.status}.`);
  const payload = await response.json() as A9ApiResponse;
  if (!payload.success || !Array.isArray(payload.games)) throw new Error("A9 results API returned an invalid payload.");

  const published = payload.games.flatMap((game) => {
    const gameId = Number(game.game_id);
    const result = String(game.result ?? "").trim();
    const date = String(game.result_date ?? "").trim();
    const pending = String(game.status ?? "").toLowerCase() === "pending";
    return a9MonthlyColumns.has(gameId) && !pending && /^\d{1,2}$/.test(result) && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? [{ gameId, result: Number(result), date }]
      : [];
  });
  if (!published.length) return { received: payload.games.length, saved: 0 };

  const database = await getTopGamesDatabase();
  const cities = await database.collection<GameDocument>("cities")
    .find({ a9GameId: { $in: published.map((item) => item.gameId) } })
    .toArray();
  const cityIds = new Map(cities.map((city) => [Number(city.a9GameId), city._id]));
  const now = new Date();
  const writes = published.flatMap((item) => {
    const city = cityIds.get(item.gameId);
    if (!city) return [];
    const date = new Date(`${item.date}T00:00:00.000Z`);
    return [{
      updateOne: {
        filter: { city, date },
        update: {
          $set: { number: item.result, a9GameId: item.gameId, city, date, revealedAt: now, updatedAt: now, a9LiveSyncAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }];
  });
  if (!writes.length) throw new Error("No matching A9 games exist in Top Games MongoDB.");
  const saved = await database.collection("dailynumbers").bulkWrite(writes, { ordered: false });
  return { received: payload.games.length, published: published.length, saved: saved.upsertedCount + saved.modifiedCount + saved.matchedCount };
}
