import { NextResponse } from "next/server";
import { getExtraGames } from "@/lib/extra-games-mongodb";
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

    const games = await getExtraGames();
    const mongoData = { games, scrapedAt: Date.now() };
    memSet("sk24-games", mongoData, 30);
    return NextResponse.json({ success: true, games }, { headers: EDGE_CACHE_HEADERS });
  } catch (err) {
    console.error("SK24 error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
