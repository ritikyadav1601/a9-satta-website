import { getExtraHomepage, getExtraMonthlyChart } from "./extra-games-mongodb";
import { getKhaiwalSettings } from "./khaiwal-mongodb";
import { getTopGamesFromMongoDB } from "./top-games-mongodb";
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

// Fetch homepage games and results from the extra-games MongoDB database.
export async function getHomeData(): Promise<HomeData> {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = now.getFullYear().toString();
  // Use IST so results roll over at midnight IST, not midnight UTC.
  const [homepage, chart, khaiwal, topGames, blogs] = await Promise.all([
    getExtraHomepage(),
    getExtraMonthlyChart(monthName, year),
    getKhaiwalSettings().catch(() => null),
    getTopGamesFromMongoDB().catch((error) => {
      console.error("[home-data] top games MongoDB read failed:", (error as Error).message);
      return [];
    }),
    getMongoBlogSummaries().catch(() => []),
  ]);

  return {
    liveResults: homepage?.live || [],
    nextResults: homepage?.next || [],
    restResults: homepage?.rest || [],
    sk24Games: [],
    sk24Charts: [],
    monthlyChart: chart?.results || [],
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
