import { syncA9ResultsToTopGames } from "@/lib/top-games-mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncA9ResultsToTopGames();
    return Response.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[a9-sync] failed:", (error as Error).message);
    return Response.json({ success: false, error: "Unable to sync A9 results" }, { status: 502 });
  }
}
