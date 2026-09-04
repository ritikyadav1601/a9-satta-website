import { NextRequest } from "next/server";
import { scrapeGameChart, scrapeSK24GameChart } from "@/lib/scraper";
import { getExtraGameChart } from "@/lib/extra-games-mongodb";
import type { GameChartData } from "@/lib/types";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";

// Homepage uses Hinglish display spellings, but the database
// store charts under canonical slugs. Normalize before any lookup so the
// "Chart →" links for these games resolve correctly.
const SLUG_ALIASES: Record<string, string> = {
  fridabad: "faridabad",
  frbd: "faridabad",
  gaziabad: "ghaziabad",
  gzbd: "ghaziabad",
  disawar: "desawar",
  desawer: "desawar",
  dswr: "desawar",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!rawSlug) {
    return Response.json({ success: false, error: "slug is required" }, { status: 400 });
  }

  const slug = SLUG_ALIASES[rawSlug.toLowerCase()] || rawSlug.toLowerCase();

  const cacheKey = `game:${slug}:${month || "current"}:${year || "current"}`;

  // 1. In-memory cache
  const cached = memGet<GameChartData>(cacheKey);
  if (cached) {
    return Response.json({ success: true, ...cached }, { headers: CHART_CACHE_HEADERS });
  }

  // 2. Extra-games MongoDB
  const mongoData = await getExtraGameChart(slug, month, year);
  if (mongoData) {
    memSet(cacheKey, mongoData, 300);
    return Response.json({ success: true, ...mongoData }, { headers: CHART_CACHE_HEADERS });
  }

  // 3. Scrape fallback (for games not present in MongoDB)
  try {
    let result = await scrapeGameChart(slug, month, year);
    if (!result) {
      result = await scrapeSK24GameChart(slug, month, year);
    }
    if (!result) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }

    const chartData: GameChartData = { ...result, scrapedAt: Date.now() };
    memSet(cacheKey, chartData, 300);

    return Response.json({ success: true, ...result }, { headers: CHART_CACHE_HEADERS });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
