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
    { success: true, total: homepage.rest.length, results: homepage.rest },
    { headers: EDGE_CACHE_HEADERS }
  );
}
