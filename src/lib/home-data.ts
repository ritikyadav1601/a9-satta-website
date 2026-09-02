import {
  getHomepageFromFirestore,
  getMonthlyChartFromFirestore,
  getSK24GamesFromFirestore,
  getSK24ChartsFromFirestore,
} from "./firebase-cache";
import { getAdminDb } from "./firebase-admin";
import { getISTDateString } from "./utils";
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

const CUSTOM_COLLECTION = "custom_games";

// Read today's custom game values + khaiwal directly from Firestore (server-side).
async function getCustomGamesForDate(date: string) {
  try {
    const snap = await getAdminDb().collection(CUSTOM_COLLECTION).doc(date).get();
    if (!snap.exists) return { games: {} as Record<string, string>, khaiwal: null };
    const d = snap.data() || {};
    return {
      games: {
        kohlapur: d.kohlapur || "",
        manipur: d.manipur || "",
        "up-bazar": d["up-bazar"] || "",
        "palwal-city": d["palwal-city"] || "",
        "mathura-city": d["mathura-city"] || "",
      } as Record<string, string>,
      khaiwal: d.khaiwal || null,
    };
  } catch (err) {
    console.error("[home-data] custom games read failed:", (err as Error).message);
    return { games: {} as Record<string, string>, khaiwal: null };
  }
}

// Fetch everything the homepage needs, in parallel, from Firestore (no scraping).
export async function getHomeData(): Promise<HomeData> {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = now.getFullYear().toString();
  // Use IST so results roll over at midnight IST, not midnight UTC.
  const today = getISTDateString(0);
  const yesterday = getISTDateString(-1);

  const [homepage, sk24, sk24chart, chart, custom, customPrev, khaiwal, topGames, blogs] = await Promise.all([
    getHomepageFromFirestore(),
    getSK24GamesFromFirestore(),
    getSK24ChartsFromFirestore(),
    getMonthlyChartFromFirestore(monthName, year),
    getCustomGamesForDate(today),
    getCustomGamesForDate(yesterday),
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
    sk24Games: sk24?.games || [],
    sk24Charts: sk24chart?.tables || [],
    monthlyChart: chart?.results || [],
    monthlyChartMeta: {
      month: chart?.month || monthName,
      year: chart?.year || year,
    },
    customGames: custom.games || {},
    customGamesYesterday: customPrev.games || {},
    khaiwal: khaiwal || custom.khaiwal || null,
    topGames,
    blogs,
  };
}
