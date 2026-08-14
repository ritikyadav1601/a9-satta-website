import type {
  HomepageData,
  MonthlyChartData,
  GameChartData,
  SK24GamesData,
  SK24ChartsData,
} from "./types";

import { getAdminDb } from "./firebase-admin";

const COLLECTION = "scraped_cache";

// ─── Homepage Data ───

export async function getHomepageFromFirestore(): Promise<HomepageData | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc("homepage").get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      live: d?.live || [],
      next: d?.next || [],
      rest: d?.rest || [],
      scrapedAt: d?.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read homepage:", (err as Error).message);
    return null;
  }
}

// ─── Monthly Chart Data ───

export async function getMonthlyChartFromFirestore(
  month: string,
  year: string
): Promise<MonthlyChartData | null> {
  try {
    const docId = `chart_${month.toLowerCase()}_${year}`;
    const snap = await getAdminDb().collection(COLLECTION).doc(docId).get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      month: d?.month,
      year: d?.year,
      results: d?.results || [],
      scrapedAt: d?.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read chart:", (err as Error).message);
    return null;
  }
}

// ─── Game Chart Data ───

export async function getGameChartFromFirestore(
  slug: string,
  month: string | undefined,
  year: string | undefined
): Promise<GameChartData | null> {
  try {
    const docId = `game_${slug}_${(month || "current").toLowerCase()}_${year || "current"}`;
    const snap = await getAdminDb().collection(COLLECTION).doc(docId).get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      gameName: d?.gameName,
      chartTitle: d?.chartTitle,
      month: d?.month,
      year: d?.year,
      columns: d?.columns || [],
      results: d?.results || [],
      scrapedAt: d?.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read game chart:", (err as Error).message);
    return null;
  }
}

// ─── SK24 Games Data ───

export async function getSK24GamesFromFirestore(): Promise<SK24GamesData | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc("sk24_games").get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      games: d?.games || [],
      scrapedAt: d?.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read SK24 games:", (err as Error).message);
    return null;
  }
}

// ─── SK24 Charts Data ───

export async function getSK24ChartsFromFirestore(): Promise<SK24ChartsData | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc("sk24_charts").get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      tables: d?.tables || [],
      scrapedAt: d?.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read SK24 charts:", (err as Error).message);
    return null;
  }
}
