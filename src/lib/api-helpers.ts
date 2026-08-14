import { getHomepageFromFirestore } from "./firebase-cache";
import type { HomepageData } from "./types";

// ─── Simple In-Memory Cache ───

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

export function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function memSet<T>(key: string, data: T, ttlSeconds: number): void {
  memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── Get Homepage Data (Firebase-only, no scraping) ───

export async function getHomepageData(): Promise<HomepageData | null> {
  const cached = memGet<HomepageData>("homepage");
  if (cached) return cached;

  const firebaseData = await getHomepageFromFirestore();
  if (firebaseData) {
    memSet("homepage", firebaseData, 10);
    return firebaseData;
  }

  return null;
}

// ─── Cache Headers ───

export const EDGE_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
  "CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
  "Vercel-CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
} as const;

export const CHART_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;
