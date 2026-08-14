import { getHomeData } from "@/lib/home-data";

// Do not cache this endpoint: the client polls it for newly published results.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await getHomeData();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
