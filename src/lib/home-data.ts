import { getExtraHomepage, getExtraMonthlyChart } from "./extra-games-mongodb";
import { getA9Results } from "./a9-results";
import { getKhaiwalSettings } from "./khaiwal-mongodb";
import { addA9TopGameMonthlyResults, getTopGamesFromMongoDB } from "./top-games-mongodb";
import { getMongoBlogSummaries, type MongoBlogSummary } from "./blog-mongodb";
import type {
  GameResult,
  ChartRow,
  SK24Game,
  SK24ChartTable,
} from "./types";

export interface HomeData {
  liveResults: GameResult[];
  nextResults: GameResult[];
  restResults: GameResult[];
  a9Games: GameResult[];
  sk24Games: SK24Game[];
  sk24Charts: SK24ChartTable[];
  monthlyChart: ChartRow[];
  monthlyChartMeta: { month: string; year: string };
  customGames: Record<string, string>;
  customGamesYesterday: Record<string, string>;
  khaiwal: { siteName: string; name: string; whatsapp: string } | null;
  topGames: SK24Game[];
  blogs: MongoBlogSummary[];
}

let homeDataCache: { value: HomeData; expiresAt: number } | null = null;
let homeDataPending: Promise<HomeData> | null = null;

// Fetch homepage games and results from the extra-games MongoDB database.
async function loadHomeData(): Promise<HomeData> {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = now.getFullYear().toString();
  // Use IST so results roll over at midnight IST, not midnight UTC.
  const [homepage, chart, a9Games, khaiwal, topGames, blogs] = await Promise.all([
    getExtraHomepage().catch((error) => {
      console.error("[home-data] extra games MongoDB read failed:", (error as Error).message);
      return null;
    }),
    getExtraMonthlyChart(monthName, year).catch((error) => {
      console.error("[home-data] monthly chart MongoDB read failed:", (error as Error).message);
      return null;
    }),
    getA9Results(),
    getKhaiwalSettings().catch(() => null),
    getTopGamesFromMongoDB().catch((error) => {
      console.error("[home-data] top games MongoDB read failed:", (error as Error).message);
      return [];
    }),
    getMongoBlogSummaries().catch(() => []),
  ]);

  const monthlyChart = chart
    ? await addA9TopGameMonthlyResults(chart.results, monthName, year).catch((error) => {
      console.error("[home-data] top games monthly read failed:", (error as Error).message);
      return chart.results;
    })
    : [];

  return {
    liveResults: homepage?.live || [],
    nextResults: homepage?.next || [],
    restResults: homepage?.rest || [],
    a9Games,
    sk24Games: [],
    sk24Charts: [],
    monthlyChart,
    monthlyChartMeta: {
      month: chart?.month || monthName,
      year: chart?.year || year,
    },
    customGames: {},
    customGamesYesterday: {},
    khaiwal: khaiwal || null,
    topGames,
    blogs,
  };
}

export async function getHomeData(): Promise<HomeData> {
  if (homeDataCache && homeDataCache.expiresAt > Date.now()) return homeDataCache.value;
  if (homeDataPending) return homeDataPending;
  homeDataPending = loadHomeData()
    .then((value) => {
      homeDataCache = { value, expiresAt: Date.now() + 10_000 };
      return value;
    })
    .finally(() => {
      homeDataPending = null;
    });
  return homeDataPending;
}
