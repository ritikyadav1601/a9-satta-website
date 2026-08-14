import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Results must be read afresh when a visitor reloads the homepage.
// Live updates after the initial render are handled by HomeClient.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getIndiaDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export async function generateMetadata(): Promise<Metadata> {
  const date = getIndiaDate();
  const title = `Live Satta King ${date} – Live Result, Gali & Desawar Updates`;
  const description = `View Live Satta King updates for ${date}. Track real-time satta result records, daily market charts, and verified schedules for Gali, Desawar, Faridabad, and Ghaziabad.`;

  return {
    // Absolute prevents the root title template from appending the site name.
    title: { absolute: title },
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
    },
  };
}

export default async function HomePage() {
  const initialData = await getHomeData();
  const date = getIndiaDate();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: "Real-time Satta King live results, market schedules, and 2026 historical record charts.",
        inLanguage: "en-IN",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Live Satta King?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Live Satta King refers to real-time reporting of daily numerical outcomes published by independent local market organizers. Live-SattaKing.com collects and organizes these public figures for informational tracking.",
            },
          },
          {
            "@type": "Question",
            name: "When are Gali and Desawar updates announced?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Desawar is typically published around 05:00 AM IST, while Gali is generally declared around 11:30 PM IST. Timelines can vary.",
            },
          },
          {
            "@type": "Question",
            name: "How do I check past records on the live chart?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Select a market's Chart link or use the monthly chart on the homepage to review preserved daily outcomes.",
            },
          },
          {
            "@type": "Question",
            name: "What does an awaiting or pending status mean?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Awaiting Update means a verified figure has not yet been made publicly available. The status changes automatically after the result is released.",
            },
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `Live Satta King ${date} – Real-Time Results & Daily Market Records`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        description: "View Live Satta King updates with real-time satta result records, daily market charts, and verified schedules for Gali, Desawar, Faridabad, and Ghaziabad.",
        inLanguage: "en-IN",
      },
    ],
  };

  return (
    <>
      <HomeClient initialData={initialData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
