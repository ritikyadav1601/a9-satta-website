import type { MetadataRoute } from "next";
import {
  getHomepageFromFirestore,
  getSK24GamesFromFirestore,
} from "@/lib/firebase-cache";
import { BLOG_POSTS } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site";

// Refresh the sitemap at most every hour.
export const revalidate = 3600;

// Convert a game name into the same slug used by /chart/[gameCode] links.
function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

// Games that always exist on the homepage, regardless of what Firestore returns.
const FIXED_GAME_NAMES = [
  // Top 9
  "KOHLAPUR", "MANIPUR", "UP BAZAR", "PALWAL CITY", "FRIDABAD",
  "MATHURA CITY", "GAZIABAD", "GALI", "DISAWAR",
  // 3rd section
  "sadar bazar", "gwalior", "delhi bazar", "delhi matka", "shri ganesh",
  "agra", "faridabad", "alwar", "dwarka",
  // Custom games
  "kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ─── Static pages ───
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ─── Blog posts ───
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // ─── Chart pages (one per game) ───
  // Pull live game names from Firestore, then merge with the fixed lists so the
  // sitemap is complete even if the cache is momentarily empty.
  const slugs = new Set<string>();
  FIXED_GAME_NAMES.forEach((n) => slugs.add(toSlug(n)));

  try {
    const [homepage, sk24] = await Promise.all([
      getHomepageFromFirestore(),
      getSK24GamesFromFirestore(),
    ]);

    [
      ...(homepage?.live || []),
      ...(homepage?.next || []),
      ...(homepage?.rest || []),
      ...(sk24?.games || []),
    ].forEach((g) => {
      if (g?.name) slugs.add(toSlug(g.name));
    });
  } catch {
    // Fall back to the fixed list only.
  }

  const chartRoutes: MetadataRoute.Sitemap = Array.from(slugs)
    .filter(Boolean)
    .map((slug) => ({
      url: `${SITE_URL}/chart/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [...staticRoutes, ...blogRoutes, ...chartRoutes];
}
