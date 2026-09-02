import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact SattaTodayResult.com",
  description: "Contact the SattaTodayResult.com team for website-related questions.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
