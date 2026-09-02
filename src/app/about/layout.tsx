import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SattaTodayResult.com",
  description: "Learn about SattaTodayResult.com and our informational result, chart, and historical record pages.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
