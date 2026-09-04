import { NextRequest } from "next/server";
import { getExtraMonthlyChart } from "@/lib/extra-games-mongodb";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";
import type { MonthlyChartData } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthName = searchParams.get("month") || "may";
  const year = searchParams.get("year") || "2026";
  const cacheKey = `chart:${monthName.toLowerCase()}:${year}`;

  const cached = memGet<MonthlyChartData>(cacheKey);
  if (cached) {
    return Response.json(
      { success: true, month: cached.month, year: cached.year, results: cached.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  const mongoData = await getExtraMonthlyChart(monthName, year);
  memSet(cacheKey, mongoData, 120);
  return Response.json(
    { success: true, month: mongoData.month, year: mongoData.year, results: mongoData.results },
    { headers: CHART_CACHE_HEADERS }
  );
}
