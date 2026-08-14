import { NextResponse } from "next/server";
import { getSK24GamesFromFirestore } from "@/lib/firebase-cache";
import { memGet, memSet, EDGE_CACHE_HEADERS } from "@/lib/api-helpers";
import type { SK24GamesData } from "@/lib/types";

export async function GET() {
  try {
    const cached = memGet<SK24GamesData>("sk24-games");
    if (cached) {
      return NextResponse.json(
        { success: true, games: cached.games },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    const firebaseData = await getSK24GamesFromFirestore();
    if (firebaseData) {
      memSet("sk24-games", firebaseData, 30);
      return NextResponse.json(
        { success: true, games: firebaseData.games },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Data not available" },
      { status: 503 }
    );
  } catch (err) {
    console.error("SK24 error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
