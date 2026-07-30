"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiZap, FiBarChart2, FiCalendar, FiChevronDown } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useLanguage, t } from "@/context/LanguageContext";
import type { HomeData } from "@/lib/home-data";

// ─── Types ───

interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

interface SK24Game {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

interface SK24ChartTable {
  title: string;
  headers: string[];
  rows: string[][];
}

interface ChartRow {
  date: string;
  dswr: string;
  frbd: string;
  gzbd: string;
  gali: string;
  srgn: string;
  dlbz: string;
}

interface ResultSpotlight {
  name: string;
  time: string;
  today: string;
  updatedAt?: number;
}

const SPOTLIGHT_SCHEDULE: ResultSpotlight[] = [
  { name: "SADAR BAZAR", time: "01:39 PM", today: "XX" },
  { name: "GWALIOR", time: "02:39 PM", today: "XX" },
  { name: "DELHI BAZAR", time: "03:00 PM", today: "XX" },
  { name: "DELHI MATKA", time: "03:39 PM", today: "XX" },
  { name: "SHRI GANESH", time: "04:30 PM", today: "XX" },
  { name: "AGRA", time: "05:29 PM", today: "XX" },
  { name: "FARIDABAD", time: "06:00 PM", today: "XX" },
  { name: "ALWAR", time: "07:34 PM", today: "XX" },
  { name: "GAZIABAD", time: "09:25 PM", today: "XX" },
  { name: "DWARKA", time: "10:34 PM", today: "XX" },
  { name: "GALI", time: "11:25 PM", today: "XX" },
  { name: "DESAWAR", time: "05:00 AM", today: "XX" },
];
const SPOTLIGHT_GAME_NAMES = new Set([
  "sadar bazar",
  "gwalior",
  "delhi bazar",
  "delhi matka",
  "shri ganesh",
  "agra",
  "faridabad",
  "fridabad",
  "frbd",
  "alwar",
  "gaziabad",
  "ghaziabad",
  "gzbd",
  "dwarka",
  "gali",
  "desawar",
  "desawer",
  "dswr",
]);

function isDeclaredResult(value: string | undefined) {
  return Boolean(value && value !== "XX" && value !== "--");
}

function resultKey(game: GameResult | SK24Game) {
  return game.name.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSpotlightGame(game: GameResult | SK24Game) {
  return SPOTLIGHT_GAME_NAMES.has(resultKey(game));
}

function allHomepageGames(data: HomeData): (GameResult | SK24Game)[] {
  return [...data.liveResults, ...data.nextResults, ...data.restResults, ...data.sk24Games]
    .filter(isSpotlightGame);
}

// ─── Scroll Animation ───

function useScrollAnimation(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    const el = ref.current;
    if (el) el.querySelectorAll(".sa").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// ─── Skeleton ───

function CardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="skeleton h-4 w-28 mb-1.5" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-8 w-12" />
          <div className="skeleton h-8 w-12" />
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───

export default function HomeClient({ initialData }: { initialData: HomeData }) {
  // Server data makes the first paint fast; this state is refreshed every 10s.
  const [homeData, setHomeData] = useState<HomeData>(initialData);
  const dataRef = useRef<HomeData>(initialData);
  const [resultsUpdatedAt, setResultsUpdatedAt] = useState(() => Date.now());
  const loading = false;
  const {
    liveResults,
    nextResults,
    restResults,
    sk24Games,
    sk24Charts,
    monthlyChart,
    monthlyChartMeta,
    customGames,
    customGamesYesterday,
    khaiwal,
  } = homeData;

  useEffect(() => {
    setHomeData(initialData);
    dataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    let inFlight = false;

    const refreshResults = async () => {
      // Avoid overlapping reads if Firestore takes longer than the interval.
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const response = await fetch("/api/home-data", { cache: "no-store" });
        if (response.ok) {
          const nextData = (await response.json()) as HomeData;
          const previousResults = new Map(
            allHomepageGames(dataRef.current).map((game) => [resultKey(game), game.today])
          );
          const changedResult = allHomepageGames(nextData).find((game) => {
            const previous = previousResults.get(resultKey(game));
            return isDeclaredResult(game.today) && previous !== undefined && previous !== game.today;
          });

          if (changedResult) {
            setResultsUpdatedAt(Date.now());
          }

          dataRef.current = nextData;
          setHomeData(nextData);
        }
      } catch {
        // Keep the most recently displayed result if a refresh request fails.
      } finally {
        inFlight = false;
      }
    };

    const interval = window.setInterval(refreshResults, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  const containerRef = useScrollAnimation([loading]);
  const { lang } = useLanguage();

  const updatedAt = format(new Date(resultsUpdatedAt), "dd MMMM yyyy, hh:mm a") + " IST";

  // Games to hide from all sections
  const hiddenGames = new Set([
    "gaziabad night",
    "punjab laxmi",
    "new sahibabad",
    "super max",
    "brij rani",
    "verra king",
    "mahalaxmi bazar",
  ]);
  const isHidden = (name: string) => hiddenGames.has(name.toLowerCase().trim());

  // Seeded random for stable results per day
  const seedRand = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * 100);
  };
  // IST date so the seeded fallback rolls over at midnight IST (same as results)
  const daySeed = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replace(/-/g, "");
  const ds = parseInt(daySeed, 10);

  // ─── 1ST SECTION: Fixed 9 games ───
  const topGameDefs = [
    { name: "KOHLAPUR", time: "1:30 PM", seedOffset: 1, customKey: "kohlapur", aliases: [] as string[] },
    { name: "MANIPUR", time: "2:30 PM", seedOffset: 3, customKey: "manipur", aliases: [] },
    { name: "UP BAZAR", time: "3:30 PM", seedOffset: 5, customKey: "up-bazar", aliases: ["upbazar"] },
    { name: "PALWAL CITY", time: "4:30 PM", seedOffset: 7, customKey: "palwal-city", aliases: [] },
    { name: "FRIDABAD", time: "5:45 PM", seedOffset: 11, customKey: "", aliases: ["faridabad", "frbd"] },
    { name: "MATHURA CITY", time: "6:50 PM", seedOffset: 9, customKey: "mathura-city", aliases: [] },
    { name: "GAZIABAD", time: "9:20 PM", seedOffset: 13, customKey: "", aliases: ["ghaziabad", "gzbd"] },
    { name: "GALI", time: "11:20 PM", seedOffset: 15, customKey: "", aliases: [] },
    { name: "DISAWAR", time: "1:30 AM", seedOffset: 17, customKey: "", aliases: ["desawar", "desawer", "dswr"] },
  ];

  const allApiGames = [...liveResults, ...nextResults, ...restResults, ...sk24Games];
  const topGames: SK24Game[] = topGameDefs.map(def => {
    const norm = def.name.toLowerCase().replace(/\s+/g, "");
    const allNames = [norm, ...def.aliases];
    // Match scraped data (by name or aliases) for fallback values
    const existing = allApiGames.find(g => {
      const gn = g.name.toLowerCase().replace(/\s+/g, "");
      return allNames.some(n => n === gn);
    });
    // Yesterday column: prefer the admin value saved for yesterday's date
    // (so today's declared result rolls into the Yesterday column at midnight IST),
    // then fall back to scraped data, then a stable seeded value.
    const seedFallback = String(seedRand(ds + def.seedOffset)).padStart(2, "0");
    const yesterdayVal =
      (def.customKey && customGamesYesterday[def.customKey]) ||
      existing?.yesterday ||
      seedFallback;

    // Admin custom value (Firebase) takes priority when set for today
    if (def.customKey && customGames[def.customKey]) {
      return {
        name: def.name,
        time: def.time,
        yesterday: yesterdayVal,
        today: customGames[def.customKey],
      };
    }
    if (existing) {
      return { name: def.name, time: def.time, yesterday: yesterdayVal, today: existing.today };
    }
    // No data available - show XX
    return {
      name: def.name,
      time: def.time,
      yesterday: yesterdayVal,
      today: "XX",
    };
  });

  // ─── 3RD SECTION: Specific games ───
  const section3GameNames = [
    "sadar bazar", "gwalior", "delhi bazar", "delhi matka",
    "shri ganesh", "agra", "faridabad", "alwar",
    "gaziabad", "dwarka", "gali" ,"desawar",
  ];
  // Alternate name mappings for 3rd section
  const section3Aliases: Record<string, string[]> = {
    "faridabad": ["fridabad", "frbd"],
    "gaziabad": ["ghaziabad", "gzbd"],
    "delhi bazar": ["delhibazar", "dlbz"],
    "shri ganesh": ["shriganesh", "srgn"],
  };
  const section3Games: SK24Game[] = section3GameNames.map(name => {
    const norm = name.toLowerCase().replace(/\s+/g, "");
    const aliases = section3Aliases[name.toLowerCase()] || [];
    const allNames = [norm, ...aliases];
    const existing = allApiGames.find(g => {
      const gn = g.name.toLowerCase().replace(/\s+/g, "");
      return allNames.some(n => n === gn);
    });
    if (existing) {
      const scheduledTime =
        SPOTLIGHT_SCHEDULE.find((game) => resultKey(game as SK24Game) === name)?.time || "";
      const time = existing.time || scheduledTime;
      return {
        name: name.toUpperCase(),
        time,
        yesterday: existing.yesterday,
        // The live boxes follow actual published values, never the wall clock.
        today: existing.today,
      };
    }
    const scheduledTime =
      SPOTLIGHT_SCHEDULE.find((game) => resultKey(game as SK24Game) === name)?.time || "";
    return { name: name.toUpperCase(), time: scheduledTime, yesterday: "XX", today: "XX" };
  });

  // Follow the current declaration run and stop at its first pending value.
  // Desawar may already contain its early-morning result, so a declared value
  // after an earlier XX must not jump the cards to the next day's Sadar.
  const firstPendingIndex = section3Games.findIndex((game) => !isDeclaredResult(game.today));
  const upcomingResult =
    firstPendingIndex >= 0
      ? section3Games[firstPendingIndex]
      : { ...section3Games[0], today: "XX" };
  const recentResult =
    firstPendingIndex > 0
      ? section3Games[firstPendingIndex - 1]
      : firstPendingIndex === 0 && isDeclaredResult(section3Games.at(-1)?.today)
        ? section3Games.at(-1) || null
        : firstPendingIndex === -1
          ? section3Games.at(-1) || null
          : null;

  // Filter remaining games: exclude top 9 games and 3rd section games from other sections
  const allFixedNames = new Set<string>();
  topGameDefs.forEach(g => {
    allFixedNames.add(g.name.toLowerCase().replace(/\s+/g, ""));
    g.aliases.forEach(a => allFixedNames.add(a));
  });
  section3GameNames.forEach(n => {
    allFixedNames.add(n.toLowerCase().replace(/\s+/g, ""));
    const aliases = section3Aliases[n.toLowerCase()] || [];
    aliases.forEach(a => allFixedNames.add(a));
  });
  const isInFixedList = (name: string) => {
    const n = name.toLowerCase().replace(/\s+/g, "");
    return allFixedNames.has(n);
  };
  const filteredLive = liveResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));
  const filteredNext = nextResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));
  const filteredRest = restResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));

  return (
    <div ref={containerRef} className="bg-[#fffdf2]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 text-black text-center py-7 md:py-12 px-3 md:px-4 border-b-4 border-black">
        <div className="inline-block mb-3 px-4 py-1.5 rounded-full bg-black border border-black shadow-md">
          <span className="text-yellow-100 text-xs md:text-sm font-bold tracking-wider uppercase">
            {t("लाइव रिजल्ट डैशबोर्ड", "Live Results Dashboard", lang)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
          Satta Online Result {format(new Date(), "yyyy")}
          <br className="md:hidden" />
          <span className="inline-block rounded-lg bg-black px-2 text-yellow-100"> {t("लाइव रिजल्ट", "Live Results", lang)}</span>
        </h1>
        <p className="text-neutral-800 font-medium text-sm md:text-base max-w-2xl mx-auto">
          {t(
            "सबसे तेज़ A7 सट्टा रिजल्ट अपडेट। गली, देसावर, गाज़ियाबाद, फरीदाबाद और 100+ गेम्स।",
            "Fastest A7 Satta result updates. Gali, Desawar, Ghaziabad, Faridabad & 100+ games.",
            lang
          )}
        </p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
          <ResultSpotlightCard
            label={t("आने वाला रिजल्ट", "Upcoming Result", lang)}
            game={upcomingResult}
            emptyText={t("अगला गेम जल्द दिखेगा", "Next game will appear soon", lang)}
            tone="upcoming"
            lang={lang}
          />
          <ResultSpotlightCard
            label={t("हाल ही में अपडेट हुआ", "Recently Updated", lang)}
            game={recentResult}
            emptyText={t("आज के पहले रिजल्ट का इंतज़ार", "Waiting for today's first result", lang)}
            tone="recent"
            lang={lang}
          />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/70 border border-black/20 rounded-full px-4 py-2 text-xs font-bold text-neutral-800 shadow-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-live-pulse" />
          {t("अंतिम अपडेट", "Last Updated", lang)}: {updatedAt}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-100 border-b border-yellow-300 py-1.5 px-2 md:px-4">
        <p className="text-center text-[11px] md:text-xs text-gray-500 max-w-4xl mx-auto">
          <span className="font-bold text-red-500">{t("अस्वीकरण", "DISCLAIMER", lang)}:</span>{" "}
          {t(
            "SattaOnlineResult.com एक स्वतंत्र सूचनात्मक वेबसाइट है। हम जुआ या सट्टेबाजी को बढ़ावा नहीं देते।",
            "SattaOnlineResult.com is an independent informational website. We do not promote gambling or betting.",
            lang
          )}{" "}
          <Link href="/disclaimer" className="text-yellow-700 hover:underline font-bold">
            {t("पूरा अस्वीकरण पढ़ें", "Read Full Disclaimer", lang)}
          </Link>
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-2 sm:px-3 md:px-6 py-5 md:py-8 space-y-8 md:space-y-10">

        {loading ? (
          <div className="space-y-10">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* ─── 1ST SECTION: Top 9 Games ─── */}
            <GameCardSection
              title={t("अन्य गेम रिजल्ट", "Other Game Results", lang)}
              subtitle={t("सदर बाज़ार, ग्वालियर, दिल्ली बाज़ार और अन्य", "Sadar Bazar, Gwalior, Delhi Bazar & more", lang)}
              icon={<FiBarChart2 size={18} />}
              headerBg="bg-yellow-400"
              accentColor="text-yellow-700"
              games={section3Games}
              isLive
              lang={lang}
            />

            {/* ─── 2ND SECTION: Monthly Chart ─── */}
            <MonthlyChartSection
              initialRows={monthlyChart}
              initialMonth={monthlyChartMeta.month}
              initialYear={monthlyChartMeta.year}
              lang={lang}
            />

                {/* ─── 3TH SECTION: WhatsApp / Khaiwal ─── */}
                <WhatsAppContactSection lang={lang} khaiwal={khaiwal} />

            {/* ─── 4RD SECTION: Specific Games ─── */}
           <GameCardSection
              title={t("आज के A7 सट्टा रिजल्ट", "Today A7 Satta Results", lang)}
              subtitle={t("इंटरनेट पर सबसे तेज़ A7 सट्टा रिजल्ट", "Fastest A7 Satta result on internet", lang)}
              icon={<FiZap size={18} />}
              headerBg="bg-yellow-400"
              accentColor="text-yellow-700"
              games={topGames}
              isLive
              lang={lang}
            />

        

            {/* SK24 Charts */}
            {sk24Charts.length > 0 && (
              <SK24ChartsSection tables={sk24Charts} lang={lang} />
            )}

            {/* LIVE (remaining) */}
            {filteredLive.length > 0 && (
              <GameCardSection
                title={t("लाइव रिजल्ट", "LIVE Results", lang)}
                subtitle={t("अभी जारी हो रहे गेम्स", "Games currently being declared", lang)}
                icon={<FiZap size={18} />}
                headerBg="bg-red-600"
                accentColor="text-red-600"
                games={filteredLive}
                isLive
                lang={lang}
              />
            )}

            {/* UPCOMING (remaining) */}
            {filteredNext.length > 0 && (
              <GameCardSection
                title={t("आने वाले रिजल्ट", "Upcoming Results", lang)}
                subtitle={t("ये गेम्स जल्द जारी होंगे", "These games will be declared soon", lang)}
                icon={<FiClock size={18} />}
                headerBg="bg-amber-600"
                accentColor="text-amber-600"
                games={filteredNext}
                lang={lang}
              />
            )}

            {/* DECLARED (remaining) */}
            {filteredRest.length > 0 && (
              <GameCardSection
                title={t("घोषित रिजल्ट", "Declared Results", lang)}
                subtitle={t("आज के पूरे हुए गेम रिजल्ट", "Today's completed game results", lang)}
                icon={<FiTrendingUp size={18} />}
                headerBg="bg-emerald-600"
                accentColor="text-emerald-600"
                games={filteredRest}
                lang={lang}
              />
            )}
          </>
        )}

        {/* Welcome */}
        <div className="sa opacity-0 translate-y-8 bg-yellow-50 rounded-2xl border-2 border-yellow-300 p-5 md:p-8 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            {t(
              <>
                <strong className="text-gray-900">SattaOnlineResult.com</strong> में आपका स्वागत है - लाइव <strong className="text-gray-900">A7 सट्टा रिजल्ट</strong> ट्रैक करने का सबसे अच्छा प्लेटफॉर्म। हमारा सिस्टम रिजल्ट घोषित होते ही तुरंत अपडेट करता है।
              </> as unknown as string,
              <>
                Welcome to <strong className="text-gray-900">SattaOnlineResult.com</strong> - the ultimate platform for tracking live <strong className="text-gray-900">A7 Satta results</strong>. Our infrastructure delivers results the exact moment they are declared.
              </> as unknown as string,
              lang
            )}
          </p>
          <p>
            {t(
              "100% सटीक दैनिक अपडेट, ऐतिहासिक चार्ट और 100+ राष्ट्रीय व क्षेत्रीय बाजारों की जानकारी, पूरी तरह मुफ्त पाएं।",
              "Get 100% accurate daily updates, historical charts, and insights for over 100+ national and regional markets, completely free.",
              lang
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="sa opacity-0 translate-y-8 bg-yellow-200 border-2 border-black rounded-2xl p-5 md:p-6 text-center shadow-[5px_5px_0_#171717]">
          <p className="text-lg md:text-xl font-black text-black">
            {t("अपना गेम यहाँ एडवरटाइज़ करें", "ADVERTISE YOUR GAME HERE", lang)}
          </p>
          <p className="text-sm text-neutral-800 mt-1">
            {t("SattaOnlineResult.com पर अपने गेम को फीचर करने के लिए संपर्क करें", "Contact us to feature your game on SattaOnlineResult.com", lang)}
          </p>
        </div>

        {/* SEO */}
        <SeoContent />
      </div>
    </div>
  );
}


function ResultSpotlightCard({
  label,
  game,
  emptyText,
  tone,
  lang,
}: {
  label: string;
  game: ResultSpotlight | GameResult | SK24Game | null;
  emptyText: string;
  tone: "upcoming" | "recent";
  lang: "hi" | "en";
}) {
  const isRecent = tone === "recent";
  return (
    <div
      className="rounded-2xl border-2 border-black bg-white/90 p-4 shadow-[4px_4px_0_#171717]"
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${isRecent ? "bg-emerald-400 animate-live-pulse" : "bg-amber-400"}`} />
        <p className={`text-[11px] font-black uppercase tracking-widest ${isRecent ? "text-emerald-700" : "text-neutral-800"}`}>
          {label}
        </p>
      </div>
      {game ? (
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-black uppercase text-black">{game.name}</p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-600">
              {game.time || t("समय जल्द आएगा", "Time to be announced", lang)}
            </p>
          </div>
          <div className={`font-mono text-3xl font-black ${isRecent ? "text-emerald-700" : "text-black"}`}>
            {isRecent ? game.today : "XX"}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-neutral-700">{emptyText}</p>
      )}
    </div>
  );
}

// Ordinal suffix for a day number, e.g. 1 -> "st", 27 -> "th".
function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// IST day label like "Sat. 27th". offsetDays shifts by whole days (-1 = yesterday).
function istDayLabel(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setUTCDate(d.getUTCDate() + offsetDays);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
  }).formatToParts(d);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
  return `${weekday}. ${day}${ordinalSuffix(day)}`;
}

function GameCardSection({
  title,
  subtitle,
  icon,
  headerBg,
  accentColor,
  games,
  isLive,
  lang,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  accentColor: string;
  games: (GameResult | SK24Game)[];
  isLive?: boolean;
  lang: "hi" | "en";
}) {
  return (
    <section className="opacity-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
            {title}
            {isLive && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-live-pulse" />
            )}
          </h2>

          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`ml-auto px-3 py-1 rounded-full text-xs font-bold bg-gray-100 border border-gray-300 ${accentColor}`}
        >
          {games.length} Games
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-black rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-yellow-200 text-black">
              <th className="border border-black px-3 py-3 text-left">
                Game
              </th>

              <th className="border border-black px-3 py-2 text-center">
                <div>Yesterday</div>
                <div className="text-[11px] md:text-xs font-semibold text-green-600 mt-0.5">
                  {istDayLabel(-1)}
                </div>
              </th>

              <th className="border border-black px-3 py-2 text-center">
                <div>Today</div>
                <div className="text-[11px] md:text-xs font-semibold text-green-600 mt-0.5">
                  {istDayLabel(0)}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {games.map((game, i) => {
              const slug = game.name
                .toLowerCase()
                .replace(/\s+/g, "-");

              const hasResult =
                game.today &&
                game.today !== "XX" &&
                game.today !== "--";

              return (
                <tr
                  key={game.name + i}
                  className="bg-gray-100 hover:bg-yellow-50 transition"
                >
                  {/* Game Name */}
                  <td className="border border-black px-1 py-2 bg-yellow-100 text-center">
                    <div className="font-black uppercase text-sm md:text-base leading-none">
                      {game.name}
                    </div>
                    <div className="text-[10px] text-black leading-none mt-1">{game.time}</div>
                    <Link
                      href={`/chart/${slug}`}
                      className="inline-block text-[10px] font-bold text-yellow-700 hover:text-yellow-900 leading-none mt-0.5"
                    >
                      Chart →
                    </Link>
                  </td>

                  {/* Yesterday */}
                  <td className="border border-black px-3 py-1.5 text-center">
                    <span className="font-mono font-black text-2xl md:text-3xl text-gray-800">
                      {game.yesterday || "XX"}
                    </span>
                  </td>

                  {/* Today */}
                  <td className="border border-black px-3 py-1.5 text-center">
                    {hasResult ? (
                      <span className="font-mono font-black text-2xl md:text-3xl text-green-600">
                        {game.today}
                      </span>
                    ) : isLive ? (
                      <span className="font-bold text-red-500 text-sm md:text-base">
                        XX
                      </span>
                    ) : (
                      <span className="font-mono font-black text-2xl md:text-3xl text-gray-400">
                        XX
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
// ─── SK24 Charts Section ───

function SK24ChartsSection({ tables, lang }: { tables: SK24ChartTable[]; lang: "hi" | "en" }) {
  return (
    <div className="sa opacity-0 translate-y-8 space-y-6">
      <div className="flex items-center gap-2.5 md:gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-yellow-200 text-black border border-black shrink-0 shadow-md">
          <FiBarChart2 size={18} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            {t("मंथली चार्ट", "Monthly Charts", lang)}
          </h2>
          <p className="text-xs text-gray-400">
            {t("A7 सट्टा चार्ट रिकॉर्ड", "A7 Satta chart records", lang)}
          </p>
        </div>
      </div>
      {tables.map((table, idx) => (
        <div key={idx} className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-yellow-200 text-black text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {table.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-black text-yellow-100 text-xs md:text-sm uppercase">
                  {table.headers.map((h, hi) => (
                    <th key={hi} className="py-2 px-1 md:px-3 font-semibold border border-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className={`text-center ${ri % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-1.5 px-1 md:px-3 font-mono font-bold border border-gray-200 ${ci === 0 ? "text-red-500" : "text-gray-800"
                          }`}
                      >
                        {cell || "XX"}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, table.headers.length - row.length) }).map((_, fi) => (
                      <td key={`fill-${fi}`} className="py-1.5 px-1 md:px-3 font-mono font-bold border border-gray-200 text-gray-400">
                        XX
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}


function WhatsAppContactSection({ lang, khaiwal }: any) {
  const phone = khaiwal?.whatsapp || "918708328760";
  const name = khaiwal?.name || "Arun bhai Khaiwal";
  const whatsappPhone = String(phone).replace(/\D/g, "");

  const games = [
    { name: t("सदर बाजार", "Sadar Bazar", lang), time: "1:20 PM" },
    { name: t("ग्वालियर", "Gwalior", lang), time: "2:20 PM" },
    { name: t("दिल्ली बाजार", "Delhi Bazar", lang), time: "3:00 PM" },
    { name: t("दिल्ली मटका", "Delhi Matka", lang), time: "3:20 PM" },
    { name: t("श्री गणेश", "Shri Ganesh", lang), time: "4:20 PM" },
    { name: t("आगरा", "Agra", lang), time: "5:20 PM" },
    { name: t("फरीदाबाद", "Faridabad", lang), time: "5:50 PM" },
    { name: t("अलवर", "Alwar", lang), time: "7:20 PM" },
    { name: t("गाज़ियाबाद", "Ghaziabad", lang), time: "8:50 PM" },
    { name: t("द्वारका", "Dwarka", lang), time: "10:15 PM" },
    { name: t("गली", "Gali", lang), time: "11:20 PM" },
    { name: t("दिसावर", "Disawar", lang), time: "2:00 AM" },
  ];

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="relative overflow-hidden rounded-3xl border-4 border-dashed border-red-500 bg-gradient-to-b from-yellow-300 via-yellow-100 to-white shadow-xl">

        {/* Top Header */}
        <div className="text-center px-4 pt-6 pb-3">
          <p className="text-lg md:text-xl font-black text-gray-900">
            ⭐ Direct Company No.1 Khaiwal ⭐
          </p>

          <h2 className="mt-3 text-2xl md:text-4xl font-black text-neutral-950">

            {name}
          </h2>
        </div>

        {/* Timing List */}
        <div className="max-w-xl mx-auto px-4 pb-5">
          <div className="bg-white/60 backdrop-blur rounded-2xl border-2 border-yellow-500 p-4">

            {games.map((game) => (
              <div
                key={game.name}
                className="flex items-center justify-between py-2 border-b border-dashed border-gray-400 last:border-0"
              >
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <span className="text-xl">⏰</span>
                  <span>{game.name}</span>
                </div>

                <span className="font-black text-neutral-950">
                  {game.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-3 px-4 max-w-md mx-auto">
          <div className="bg-white border-2 border-yellow-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Jodi Rate
            </p>
            <p className="text-2xl font-black text-yellow-700">
              10-960
            </p>
          </div>

          <div className="bg-white border-2 border-yellow-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Haruf Rate
            </p>
            <p className="text-2xl font-black text-yellow-700">
              100-960
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="text-center px-4 py-5">
          <p className="font-bold text-gray-700 text-sm">
            PAYTM • PHONEPE • GOOGLE PAY • BANK TRANSFER
          </p>

          <p className="mt-2 text-sm font-semibold text-red-600">
            PhonePe, GooglePay & Paytm Scanner Available
          </p>
        </div>

        {/* Phone */}
        <div className="text-center px-4">
          <a
            href={`tel:+${whatsappPhone}`}
            className="inline-block text-3xl md:text-4xl font-black text-yellow-700 border-b-4 border-yellow-500"
          >
            +{phone}
          </a>
        </div>

        {/* Footer Text */}
        <div className="text-center px-4 pt-5">
          <p className="font-black text-xl md:text-2xl text-neutral-950">
            😊😊{name} 😊😊
          </p>

          <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
            Game play karne ke liye niche link par click kare
          </p>
        </div>

        {/* WhatsApp Button */}
        <div className="px-4 pb-8 pt-5 flex justify-center">
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent("A7 SATTA")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-lg hover:scale-105 transition-all"
          >
            <FaWhatsapp className="text-4xl" />

            <div className="text-left">
              <div className="text-xl leading-none">
                WhatsApp
              </div>
              <div className="text-sm opacity-90">
                Click To Chat
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Monthly Chart Section ───

const CHART_GAMES = [
  { key: "dlbz" as const, name: "Delhi Bazar" },
  { key: "srgn" as const, name: "Shri Ganesh" },
  { key: "frbd" as const, name: "Faridabad" },
  { key: "gzbd" as const, name: "Gaziabad" },
  { key: "gali" as const, name: "Gali" },
  { key: "dswr" as const, name: "Disawar" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MonthlyChartSection({
  initialRows,
  initialMonth,
  initialYear,
  lang,
}: {
  initialRows: ChartRow[];
  initialMonth: string;
  initialYear: string;
  lang: "hi" | "en";
}) {
  const now = new Date();
  const currentMonthName = initialMonth || now.toLocaleString("en-US", { month: "long" });
  const currentYear = initialYear || String(now.getFullYear());

  const [rows, setRows] = useState<ChartRow[]>(initialRows);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartLoading, setChartLoading] = useState(false);

  const years = Array.from({ length: 12 }, (_, i) => String(now.getFullYear() - i));

  const fetchChart = async (m: string, y: string) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/monthly-chart?month=${m.toLowerCase()}&year=${y}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.results || []);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    fetchChart(m, selectedYear);
  };

  const handleYearChange = (y: string) => {
    setSelectedYear(y);
    fetchChart(selectedMonth, y);
  };

  const displayMonth = selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);
  const title = lang === "hi"
    ? `${displayMonth} ${selectedYear} मंथली चार्ट`
    : `${displayMonth} ${selectedYear} Monthly Chart`;

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="flex items-center gap-2.5 md:gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            {lang === "hi" ? "मंथली चार्ट" : "Monthly Chart"} {selectedYear}
          </h2>
          <p className="text-xs text-gray-400">Delhi Bazar, Shri Ganesh, Faridabad, Gaziabad, Gali, Disawar</p>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <FiBarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {chartLoading && (
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Chart Table */}
      {chartLoading ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-yellow-200 text-black text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t("लोड हो रहा है...", "Loading...", lang)}</p>
          </div>
        </div>
      ) : rows.length > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-yellow-200 text-black text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-black text-yellow-100 text-[10px] md:text-xs uppercase">
                  <th className="py-2 px-1.5 md:px-3 font-semibold border border-gray-300">
                    {t("तारीख", "Date", lang)}
                  </th>
                  {CHART_GAMES.map((g) => (
                    <th key={g.key} className="py-2 px-1.5 md:px-3 font-semibold border border-gray-300">
                      {g.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={`text-center ${ri % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="py-1.5 px-1.5 md:px-3 font-bold text-red-500 border border-gray-200 text-xs md:text-sm whitespace-nowrap">
                      {row.date}
                    </td>
                    {CHART_GAMES.map((g) => (
                      <td
                        key={g.key}
                        className="py-1.5 px-1.5 md:px-3 font-mono font-bold border border-gray-200 text-gray-800"
                      >
                        {row[g.key] || "XX"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 py-12 text-center">
          <FiBarChart2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t("कोई डेटा उपलब्ध नहीं", "No data available", lang)}</p>
          <p className="text-gray-400 text-sm mt-1">{displayMonth} {selectedYear}</p>
        </div>
      )}
    </section>
  );
}

// ─── SEO Content ───

function SeoContent() {
  return (
    <div className="sa opacity-0 translate-y-8 bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-8 space-y-4 text-sm text-gray-600 leading-relaxed">
      <h2 className="text-xl md:text-2xl font-black text-gray-900">
        Satta Online Result – Fast & Accurate Satta King Result, Live Chart & Record
      </h2>

      <h3 className="text-lg font-bold text-gray-900">Welcome</h3>

      <p>
        Welcome to SattaOnlineResult.com, your trusted destination for the latest
        Satta King Result, Satta Online Result, Gali Result, Desawar Result,
        Faridabad Result, and Ghaziabad Result updates. Our website is designed
        to provide fast, accurate, and easy-to-read result information along with
        historical charts and records in one place.
      </p>

      <p>
        If you're searching for today's Satta King Result, Satta Chart, Satta
        Record, Disawar Result Today, or old result history,
        SattaOnlineResult.com offers a clean and organized experience. Every
        section is updated regularly so visitors can quickly access the latest
        available information without unnecessary distractions.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Why Choose SattaOnlineResult.com?
      </h3>

      <p>
        At SattaOnlineResult.com, we focus on providing reliable result
        information in a simple format. Visitors can easily check the latest
        Satta King Result, browse previous records, and explore historical charts
        without confusion.
      </p>

      <p>
        Our website is regularly maintained to keep information well-organized
        and easy to access. Whether you're looking for today's update or older
        result history, everything is arranged for a smooth browsing experience.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Today's Satta King Result & Live Updates
      </h3>

      <p>
        Finding the latest Satta King Result Today should be quick and simple.
        That's why our homepage highlights the most searched result sections so
        visitors can reach the information they need without searching multiple
        websites.
      </p>

      <p>
        We continuously update available result information, including Gali
        Result Today, Desawar Result Today, Faridabad Result Today, Ghaziabad
        Result Today, and other popular market results in an easy-to-read format.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Satta Chart & Old Record
      </h3>

      <p>
        Our Satta Chart section helps visitors access previous records in a
        structured and organized manner. Date-wise charts make it easier to
        review historical result information whenever required.
      </p>

      <p>
        From Gali Chart and Desawar Chart to Faridabad Chart, Ghaziabad Chart,
        and old result records, every archive is arranged for convenient browsing
        and quick access.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Popular Satta King Markets
      </h3>

      <p>
        SattaOnlineResult.com provides organized updates for several well-known
        markets that users frequently search online. Popular result sections are
        displayed clearly, making navigation simple and convenient.
      </p>

      <p>
        Visitors can quickly explore Gali Result, Desawar Result, Faridabad
        Result, Ghaziabad Result, Delhi Result, related charts, and historical
        records from one trusted platform.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Reliable Information & Regular Updates
      </h3>

      <p>
        We understand the importance of timely information. Our team works to
        keep result pages updated while maintaining a clean layout that makes
        browsing simple for every visitor.
      </p>

      <p>
        The website is built with a focus on clarity, consistency, and easy
        navigation so users can find Satta Online Result, charts, and records
        without unnecessary complexity.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        A Trusted Source for Satta Online Result
      </h3>

      <p>
        Our goal is to provide a dependable platform where visitors can easily
        access Satta King Results, historical charts, and organized records. We
        continuously improve the website to ensure a better browsing experience
        for every user.
      </p>

      <p>
        SattaOnlineResult.com values transparency, accuracy, and simplicity. By
        keeping information well-structured and regularly updated, we aim to
        become a trusted destination for users looking for Satta Online Result
        information.
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        Frequently Asked Questions (FAQs)
      </h3>

      <div className="space-y-3">
        <div>
          <h4 className="font-bold text-gray-900">
            What is SattaOnlineResult.com?
          </h4>
          <p>
            SattaOnlineResult.com is an informational website that provides the
            latest Satta King Results, charts, old records, and historical result
            information in an organized format.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900">
            How often are Satta King Results updated?
          </h4>
          <p>
            Result information is updated regularly whenever the latest publicly
            available updates become available.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900">
            Can I check old Satta charts on this website?
          </h4>
          <p>
            Yes. Visitors can browse historical charts, previous records, and
            archived result information through dedicated chart sections.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900">
            Which Satta King markets are available?
          </h4>
          <p>
            The website includes information related to popular markets such as
            Gali, Desawar, Faridabad, Ghaziabad, Delhi, and other commonly
            searched result sections.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900">
            Is SattaOnlineResult.com a trusted source?
          </h4>
          <p>
            Our focus is on presenting organized, easy-to-read, and regularly
            updated informational content to help visitors access result
            information conveniently.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900">Disclaimer</h3>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
        <strong>Important:</strong> SattaOnlineResult.com is an informational
        website only. We do not organize, operate, promote, or encourage
        betting, gambling, or wagering activities. The information is published
        solely for informational purposes. Users are responsible for complying
        with applicable laws in their jurisdiction.
      </div>
    </div>
  );
}
