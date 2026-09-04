import { NextRequest } from "next/server";
import { getExtraGameChart } from "@/lib/extra-games-mongodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!game) {
    return Response.json({ success: false, error: "game is required" }, { status: 400 });
  }

  try {
    const chart = await getExtraGameChart(game, month, year);
    if (!chart) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }
    return Response.json({ success: true, ...chart });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
