import { NextRequest } from "next/server";
import { getMonthlyChartFromFirestore } from "@/lib/firebase-cache";
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

  const firebaseData = await getMonthlyChartFromFirestore(monthName, year);
  if (firebaseData) {
    memSet(cacheKey, firebaseData, 120);
    return Response.json(
      { success: true, month: firebaseData.month, year: firebaseData.year, results: firebaseData.results },
      { headers: CHART_CACHE_HEADERS }
    );
  }

  return Response.json(
    { success: false, error: "Chart data not available" },
    { status: 404 }
  );
}
