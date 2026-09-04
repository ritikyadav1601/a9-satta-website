import { MongoClient, ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import type { ChartRow, GameChartData, HomepageData, MonthlyChartData, SK24Game } from "./types";

const databaseName = process.env.EXTRA_GAMES_MONGODB_DATABASE || "test";

type ExtraGame = {
  _id: ObjectId;
  name?: string;
  code?: string;
  resultTime?: string;
  showIndex?: number;
  isActive?: boolean;
};

type ExtraResult = {
  _id?: ObjectId;
  game?: ObjectId;
  resultDate?: string;
  result?: string | number;
  updatedAt?: Date;
};

declare global {
  // eslint-disable-next-line no-var
  var __extraGamesMongoClient: MongoClient | undefined;
}

function getClient() {
  const uri = process.env.EXTRA_GAMES_MONGO_URI?.trim();
  if (!uri) throw new Error("EXTRA_GAMES_MONGO_URI is not configured.");
  if (!global.__extraGamesMongoClient) global.__extraGamesMongoClient = new MongoClient(uri);
  return global.__extraGamesMongoClient;
}

async function getDatabase() {
  const client = getClient();
  await client.connect();
  return client.db(databaseName);
}

function displayTime(value?: string) {
  const [hourText = "0", minute = "00"] = String(value || "00:00").split(":");
  const hour = Number(hourText);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function validResult(value: unknown) {
  const result = String(value ?? "").trim();
  return result && result !== "--" && result.toUpperCase() !== "XX" ? result : "XX";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function activeGames() {
  return (await getDatabase()).collection<ExtraGame>("games")
    .find({ isActive: { $ne: false } })
    .sort({ showIndex: 1, resultTime: 1, name: 1 })
    .toArray();
}

async function resultsForDates(dates: string[]) {
  return (await getDatabase()).collection<ExtraResult>("gameresults")
    .find({ resultDate: { $in: dates } })
    .toArray();
}

export async function getExtraGames(): Promise<SK24Game[]> {
  const today = getISTDateString(0);
  const yesterday = getISTDateString(-1);
  const [games, results] = await Promise.all([activeGames(), resultsForDates([today, yesterday])]);
  const byGameAndDate = new Map(results.map((item) => [`${String(item.game)}:${item.resultDate}`, validResult(item.result)]));

  return games.map((game) => ({
    name: String(game.name || game.code || "Game"),
    time: displayTime(game.resultTime),
    yesterday: byGameAndDate.get(`${String(game._id)}:${yesterday}`) || "XX",
    today: byGameAndDate.get(`${String(game._id)}:${today}`) || "XX",
  }));
}

export async function getExtraHomepage(): Promise<HomepageData> {
  const games = await getExtraGames();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date()).split(":").map(Number);
  const nowMinutes = parts[0] * 60 + parts[1];
  const scheduledMinutes = (time: string) => {
    const match = time.match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (!match) return 0;
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(match[2]);
  };

  return {
    live: games.filter((game) => game.today === "XX" && scheduledMinutes(game.time) <= nowMinutes),
    next: games.filter((game) => game.today === "XX" && scheduledMinutes(game.time) > nowMinutes),
    rest: games.filter((game) => game.today !== "XX"),
    scrapedAt: Date.now(),
  };
}

const chartColumns = [
  ["dswr", ["DS", "DESAWAR"]], ["frbd", ["FB", "FARIDABAD"]],
  ["gzbd", ["GB", "GHAZIABAD"]], ["gali", ["GL", "GALI"]],
  ["srgn", ["SG", "SHRI GANESH", "SHREE GANESH"]], ["dlbz", ["DB", "DELHI BAZAR"]],
] as const;

export async function getExtraMonthlyChart(monthName: string, yearText: string): Promise<MonthlyChartData> {
  const monthIndex = new Date(`${monthName} 1, ${yearText}`).getMonth();
  const year = Number(yearText);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const [currentYear, currentMonth, currentDay] = getISTDateString(0).split("-").map(Number);
  const selectedMonthNumber = monthIndex + 1;
  const isFutureMonth =
    year > currentYear || (year === currentYear && selectedMonthNumber > currentMonth);
  const days = isFutureMonth
    ? 0
    : year === currentYear && selectedMonthNumber === currentMonth
      ? currentDay
      : daysInMonth;
  const start = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const end = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(Math.max(days, 1)).padStart(2, "0")}`;
  const db = await getDatabase();
  const games = await db.collection<ExtraGame>("games").find({}).toArray();
  const selected = new Map<string, ObjectId>();
  for (const [key, aliases] of chartColumns) {
    const game = games.find((item) => aliases.includes(String(item.code || "").toUpperCase() as never) || aliases.includes(String(item.name || "").toUpperCase() as never));
    if (game) selected.set(key, game._id);
  }
  const ids = [...selected.values()];
  const results = await db.collection<ExtraResult>("gameresults").find({ game: { $in: ids }, resultDate: { $gte: start, $lte: end } }).toArray();
  const values = new Map(results.map((item) => [`${String(item.game)}:${item.resultDate}`, validResult(item.result)]));
  const rows: ChartRow[] = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const row: ChartRow = { date: String(day).padStart(2, "0"), dswr: "XX", frbd: "XX", gzbd: "XX", gali: "XX", srgn: "XX", dlbz: "XX" };
    for (const [key, id] of selected) row[key as keyof Omit<ChartRow, "date">] = values.get(`${String(id)}:${date}`) || "XX";
    return row;
  });
  return { month: monthName, year: yearText, results: rows, scrapedAt: Date.now() };
}

export async function getExtraGameChart(slug: string, month?: string, yearText?: string): Promise<GameChartData | null> {
  const games = await activeGames();
  const game = games.find((item) => slugify(String(item.name || "")) === slugify(slug) || String(item.code || "").toLowerCase() === slug.toLowerCase());
  if (!game) return null;
  const now = new Date();
  const year = Number(yearText || now.getFullYear());
  const monthIndex = month ? new Date(`${month} 1, ${year}`).getMonth() : now.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const entries = await (await getDatabase()).collection<ExtraResult>("gameresults")
    .find({ game: game._id, resultDate: { $gte: `${prefix}-01`, $lte: `${prefix}-${String(days).padStart(2, "0")}` } }).toArray();
  const values = new Map(entries.map((item) => [item.resultDate, validResult(item.result)]));
  const monthLabel = new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "long" });
  return {
    gameName: String(game.name || game.code), chartTitle: `${game.name} - ${monthLabel} ${year}`,
    month: monthLabel, year: String(year), columns: ["Date", "Day", "Result"],
    results: Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${prefix}-${String(day).padStart(2, "0")}`;
      return { date: String(day).padStart(2, "0"), day: new Date(year, monthIndex, day).toLocaleString("en-US", { weekday: "long" }), result: values.get(date) || "XX" };
    }), scrapedAt: Date.now(),
  };
}

export async function getExtraResultsForDate(date: string) {
  const [games, results] = await Promise.all([activeGames(), resultsForDates([date])]);
  const names = new Map(games.map((game) => [String(game._id), slugify(String(game.name || game.code || ""))]));
  return Object.fromEntries(results.map((item) => [names.get(String(item.game)) || String(item.game), validResult(item.result)]));
}

export async function listExtraResults(month?: number, year?: number) {
  const db = await getDatabase();
  const games = await db.collection<ExtraGame>("games").find({}).toArray();
  const names = new Map(games.map((game) => [String(game._id), slugify(String(game.name || game.code || ""))]));
  const query = month && year ? { resultDate: { $gte: `${year}-${String(month).padStart(2, "0")}-01`, $lte: `${year}-${String(month).padStart(2, "0")}-31` } } : {};
  const results = await db.collection<ExtraResult>("gameresults").find(query).sort({ resultDate: -1 }).toArray();
  return results.map((item) => ({ date: String(item.resultDate), game: names.get(String(item.game)) || String(item.game), value: validResult(item.result) }));
}

export async function saveExtraResult(date: string, gameSlug: string, value: string) {
  const db = await getDatabase();
  const games = await db.collection<ExtraGame>("games").find({}).toArray();
  const game = games.find((item) => slugify(String(item.name || "")) === slugify(gameSlug) || String(item.code || "").toLowerCase() === gameSlug.toLowerCase());
  if (!game) throw new Error(`Game not found in EXTRA_GAMES_MONGO_URI: ${gameSlug}`);
  await db.collection<ExtraResult>("gameresults").updateOne(
    { game: game._id, resultDate: date },
    { $set: { result: String(value).trim(), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
}

export async function deleteExtraResult(date: string, gameSlug: string) {
  const db = await getDatabase();
  const games = await db.collection<ExtraGame>("games").find({}).toArray();
  const game = games.find((item) => slugify(String(item.name || "")) === slugify(gameSlug) || String(item.code || "").toLowerCase() === gameSlug.toLowerCase());
  if (!game) return;
  await db.collection<ExtraResult>("gameresults").deleteOne({ game: game._id, resultDate: date });
}
