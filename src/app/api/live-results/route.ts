import { getHomepageData, EDGE_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET() {
  const homepage = await getHomepageData();
  if (!homepage) {
    return Response.json(
      { success: false, error: "Data not available" },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }
  return Response.json(
    { success: true, total: homepage.live.length, results: homepage.live },
    { headers: EDGE_CACHE_HEADERS }
  );
}
