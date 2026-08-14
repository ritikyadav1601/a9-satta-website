import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

// Per-game SEO metadata for chart pages, keyed by URL slug (gameCode).
const CHART_META: Record<string, { title: string; description: string }> = {
  "new-gali": {
    title: "New Gali Satta King Chart",
    description:
      "Check the latest New Gali Satta King chart, daily results, old record, and complete chart history on A7 Satta.",
  },
  "delhi-evening": {
    title: "Delhi Evening Satta King Chart",
    description:
      "View Delhi Evening Satta King chart with today's result, old records, and complete historical data.",
  },
  "choti-gali": {
    title: "Choti Gali Satta King Chart",
    description:
      "Find Choti Gali Satta King chart, live results, old charts, and historical records updated daily.",
  },
  "🎀-show-your-game-here-🎀": {
    title: "Show Your Game Here Chart",
    description:
      "Explore the Show Your Game Here chart with updated records and daily results on A7 Satta.",
  },
  desawer: {
    title: "Desawer Satta King Chart",
    description:
      "Check Desawer Satta King chart, daily results, old charts, and complete record history.",
  },
  "shiv-dham": {
    title: "Shiv Dham Satta King Chart",
    description:
      "View Shiv Dham Satta King chart with today's results, historical records, and daily updates.",
  },
  "pushkar-bazar": {
    title: "Pushkar Bazar Satta King Chart",
    description:
      "Get the latest Pushkar Bazar Satta King chart, old records, and daily result updates.",
  },
  "delhi-metro": {
    title: "Delhi Metro Satta King Chart",
    description:
      "Delhi Metro Satta King chart with today's result, old charts, and complete historical records.",
  },
  "shri-sayam": {
    title: "Shri Sayam Satta King Chart",
    description:
      "Check Shri Sayam Satta King chart, historical records, and today's updated results.",
  },
  kolmbia: {
    title: "Kolmbia Satta King Chart",
    description:
      "View Kolmbia Satta King chart with daily results, old charts, and complete chart history.",
  },
  "makka-madina": {
    title: "Makka Madina Satta King Chart",
    description:
      "Find Makka Madina Satta King chart, latest results, old records, and complete history.",
  },
  "kalka-night": {
    title: "Kalka Night Satta King Chart",
    description:
      "Kalka Night Satta King chart featuring today's result, old records, and chart history.",
  },
  "shirdi-dham": {
    title: "Shirdi Dham Satta King Chart",
    description:
      "View Shirdi Dham Satta King chart with updated results, historical charts, and daily records.",
  },
  "delhi-darbar": {
    title: "Delhi Darbar Satta King Chart",
    description:
      "Delhi Darbar Satta King chart with latest results, old records, and complete chart history.",
  },
  kaliyar: {
    title: "Kaliyar Satta King Chart",
    description:
      "Check Kaliyar Satta King chart, daily results, historical records, and old charts.",
  },
  "new-ganga": {
    title: "New Ganga Satta King Chart",
    description:
      "New Ganga Satta King chart with today's results, old records, and complete history.",
  },
  fatehabad: {
    title: "Fatehabad Satta King Chart",
    description:
      "View Fatehabad Satta King chart, daily results, old records, and updated chart history.",
  },
  "shakti-peeth": {
    title: "Shakti Peeth Satta King Chart",
    description:
      "Find Shakti Peeth Satta King chart, latest results, historical charts, and daily updates.",
  },
  "mandi-bazar": {
    title: "Mandi Bazar Satta King Chart",
    description:
      "Mandi Bazar Satta King chart with today's result, old records, and complete history.",
  },
  "ghaziabad-king": {
    title: "Ghaziabad King Satta King Chart",
    description:
      "Check Ghaziabad King Satta King chart, historical records, and today's updated results.",
  },
  "mathura-city": {
    title: "Mathura Satta King Chart",
    description:
      "View Mathura Satta King chart with daily results, old charts, and complete record history.",
  },
};

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}): Promise<Metadata> {
  const { gameCode } = await params;
  const meta = CHART_META[gameCode];

  const name = titleCase(gameCode);
  const title = meta?.title ?? `${name} Satta King Chart`;
  const description =
    meta?.description ??
    `Check the ${name} Satta King chart, daily results, old records, and complete chart history on A7 Satta.`;

  const url = `${SITE_URL}/chart/${encodeURIComponent(gameCode)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
    },
  };
}

export default function ChartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
