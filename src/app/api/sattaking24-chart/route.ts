import { NextResponse } from "next/server";
import { getSK24ChartsFromFirestore } from "@/lib/firebase-cache";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";
import type { SK24ChartsData } from "@/lib/types";

export async function GET() {
  try {
    const cached = memGet<SK24ChartsData>("sk24-charts");
    if (cached) {
      return NextResponse.json(
        { success: true, tables: cached.tables },
        { headers: CHART_CACHE_HEADERS }
      );
    }

    const firebaseData = await getSK24ChartsFromFirestore();
    if (firebaseData) {
      memSet("sk24-charts", firebaseData, 300);
      return NextResponse.json(
        { success: true, tables: firebaseData.tables },
        { headers: CHART_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Chart data not available" },
      { status: 503 }
    );
  } catch (err) {
    console.error("SK24 chart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
