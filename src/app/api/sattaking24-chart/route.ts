import { NextResponse } from "next/server";
import { CHART_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET() {
  try {
    return NextResponse.json({ success: true, tables: [] }, { headers: CHART_CACHE_HEADERS });
  } catch (err) {
    console.error("SK24 chart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
