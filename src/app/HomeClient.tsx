"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiZap, FiBarChart2, FiCalendar, FiChevronDown } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useLanguage, t } from "@/context/LanguageContext";
import type { HomeData } from "@/lib/home-data";
import { getWhatsAppLink, normalizeWhatsAppNumber } from "@/lib/utils";

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
  updatedAt?: string | number | Date | null;
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
  { name: "PARAS CITY", time: "12:50 PM", today: "XX" },
  { name: "SADAR BAZAR", time: "01:30 PM", today: "XX" },
  { name: "GWALIOR", time: "02:30 PM", today: "XX" },
  { name: "DELHI BAZAR", time: "03:10 PM", today: "XX" },
  { name: "DELHI CITY", time: "03:50 PM", today: "XX" },
  { name: "SHREE GANESH", time: "04:30 PM", today: "XX" },
  { name: "AGRA CITY", time: "05:30 PM", today: "XX" },
  { name: "FARIDABAD", time: "06:06 PM", today: "XX" },
  { name: "JAIPUR CITY", time: "07:30 PM", today: "XX" },
  { name: "GAZIYABAD", time: "08:50 PM", today: "XX" },
  { name: "VARINDAWAN CITY", time: "10:40 PM", today: "XX" },
  { name: "GALI", time: "11:50 PM", today: "XX" },
  { name: "DESAWER", time: "05:00 AM", today: "XX" },
];
const SPOTLIGHT_GAME_NAMES = new Set([
  "paras city",
  "sadar bazar",
  "gwalior",
  "delhi bazar",
  "delhi city",
  "delhi matka",
  "shree ganesh",
  "shri ganesh",
  "agra city",
  "agra",
  "faridabad",
  "fridabad",
  "frbd",
  "jaipur city",
  "gaziyabad",
  "gaziabad",
  "ghaziabad",
  "gzbd",
  "varindavan city",
  "varindawan city",
  "vrindavan city",
  "gali",
  "desawer",
  "desawar",
  "dswr",
]);

function isDeclaredResult(value: string | undefined) {
  const normalized = value?.trim();
  return Boolean(
    normalized &&
    normalized !== "XX" &&
    normalized !== "--" &&
    normalized !== "__"
  );
}

function timeToMinutes(time = "") {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period) {
    hours %= 12;
    if (period === "PM") hours += 12;
  }
  return hours * 60 + minutes;
}

function currentIstMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
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
    topGames: mongoTopGames,
    blogs = [],
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
    "paras city", "sadar bazar", "gwalior", "delhi bazar",
    "delhi city", "shree ganesh", "agra city", "faridabad",
    "jaipur city", "gaziyabad", "varindawan city", "gali", "desawer",
  ];
  // Alternate name mappings for 3rd section
  const section3Aliases: Record<string, string[]> = {
    "faridabad": ["fridabad", "frbd"],
    "gaziyabad": ["gaziabad", "ghaziabad", "gzbd"],
    "delhi bazar": ["delhibazar", "dlbz"],
    "delhi city": [],
    "shree ganesh": ["shri ganesh", "shriganesh", "srgn"],
    "agra city": [],
    "jaipur city": [],
    "varindawan city": ["varindavan city", "vrindavan city"],
    "gali": ["purani gali"],
    "desawer": ["desawar", "deshawer", "dswr"],
  };
  const fallbackSection3Games: SK24Game[] = section3GameNames.map(name => {
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
  const section3Games = mongoTopGames.length === SPOTLIGHT_SCHEDULE.length
    ? mongoTopGames
    : fallbackSection3Games;

  // Match the reference site's spotlight logic: choose the next still-pending
  // game by IST schedule, and choose the most recently saved declared result.
  const gamesByTime = [...section3Games].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
  );
  const nowIst = currentIstMinutes();
  const nextPending =
    gamesByTime.find(
      (game) => timeToMinutes(game.time) > nowIst && !isDeclaredResult(game.today),
    ) || gamesByTime.find((game) => !isDeclaredResult(game.today));
  const recentCandidates = section3Games.filter((game) =>
    isDeclaredResult(game.today),
  );
  const declaredResult =
    [...recentCandidates].sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
    )[0] ||
    gamesByTime.filter(
      (game) => timeToMinutes(game.time) <= nowIst && isDeclaredResult(game.today),
    ).at(-1) ||
    null;
  const firstScheduledGame = gamesByTime[0] || null;
  const upcomingResult = nextPending
    ? { ...nextPending, today: "XX" }
    : firstScheduledGame
      ? { ...firstScheduledGame, today: "XX" }
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
    <div ref={containerRef} className="bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200 text-slate-900 text-center py-7 md:py-12 px-3 md:px-4 border-b-4 border-brand-ink">
       
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
        Satta King Today Result and Daily Record Chart
        </h1>
      
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
          <ResultSpotlightCard
            label={t("आने वाला रिजल्ट", "Upcoming Result", lang)}
            game={upcomingResult}
            emptyText={t("अगला गेम जल्द दिखेगा", "Next game will appear soon", lang)}
            tone="upcoming"
          />
          <ResultSpotlightCard
            label={t("घोषित रिजल्ट", "Declared Result", lang)}
            game={declaredResult}
            emptyText={t("पहले घोषित रिजल्ट का इंतज़ार", "Waiting for the first declared result", lang)}
            tone="recent"
          />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/70 border border-slate-900/20 rounded-full px-4 py-2 text-xs font-bold text-slate-800 shadow-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-live-pulse" />
          {t("अंतिम अपडेट", "Last Updated", lang)}: {updatedAt}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-brand-50 border-b border-brand-200 py-1.5 px-2 md:px-4">
        <p className="text-center text-[11px] md:text-xs text-gray-500 max-w-4xl mx-auto">
          <span className="font-bold text-red-500">{t("अस्वीकरण", "DISCLAIMER", lang)}:</span>{" "}
          {t(
            "SattaTodayResult.com एक स्वतंत्र सूचनात्मक वेबसाइट है। हम जुआ या सट्टेबाजी को बढ़ावा नहीं देते।",
            "SattaTodayResult.com is an independent informational website. We do not promote gambling or betting.",
            lang
          )}{" "}
          <Link href="/disclaimer" className="text-brand-700 hover:underline font-bold">
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
              title={t("रियल-टाइम सट्टा रिजल्ट लाइव डैशबोर्ड", "Real-Time Satta Result Live Dashboard", lang)}
              subtitle={t("सदर बाज़ार, ग्वालियर, दिल्ली बाज़ार और अन्य", "Sadar Bazar, Gwalior, Delhi Bazar & more", lang)}
              icon={<FiBarChart2 size={18} />}
              headerBg="bg-brand-500"
              accentColor="text-brand-700"
              games={section3Games}
              isLive
              lang={lang}
            />

            {/* ─── 2ND SECTION: Monthly Chart ─── */}
            <MonthlyChartSection
              initialRows={monthlyChart}
              initialMonth={monthlyChartMeta.month}
              initialYear={monthlyChartMeta.year}
              declaredGames={mongoTopGames}
              lang={lang}
            />

                {/* ─── 3TH SECTION: WhatsApp / Khaiwal ─── */}
                <WhatsAppContactSection lang={lang} khaiwal={khaiwal} />

           

         

        

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

       

        {/* CTA */}
       

        {/* SEO */}
        <LiveSattaSeoContent />

        {/* Latest MongoDB blogs */}
        {blogs.length > 0 && (
          <section className="rounded-3xl border border-brand-200 bg-white p-4 shadow-sm md:p-7">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Latest articles</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">Satta King Blog</h2>
              </div>
              <Link href="/blog" className="shrink-0 text-sm font-black text-brand-700 hover:text-brand-900">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  {post.image && (
                    <img src={post.image} alt={post.title} className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(post.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="mt-2 line-clamp-2 font-black leading-snug text-slate-950 group-hover:text-brand-700">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {post.metaDescription}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


function ResultSpotlightCard({
  label,
  game,
  emptyText,
  tone,
}: {
  label: string;
  game: ResultSpotlight | GameResult | SK24Game | null;
  emptyText: string;
  tone: "upcoming" | "recent";
}) {
  const isRecent = tone === "recent";
  return (
    <div
      className="rounded-2xl border-2 border-brand-ink bg-white/90 p-4 shadow-[4px_4px_0_var(--brand-ink)]"
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
            <p className="truncate text-base font-black uppercase text-slate-900">{game.name}</p>
          </div>
          <div className={`font-mono text-3xl font-black ${isRecent ? "text-emerald-700" : "text-slate-900"}`}>
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
      

      {/* Table */}
      <div className="overflow-x-auto border-2 border-brand-ink rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-100 text-slate-900">
              <th className="border border-brand-ink px-3 py-3 text-left">
                Game
              </th>

              <th className="border border-brand-ink px-3 py-2 text-center">
                <div>Yesterday</div>
                
              </th>

              <th className="border border-brand-ink px-3 py-2 text-center">
                <div>Today</div>
               
              </th>
            </tr>
          </thead>

          <tbody>
            {games.map((game, i) => {
              const slug = game.name
                .toLowerCase()
                .replace(/\s+/g, "-");

              const hasResult = isDeclaredResult(game.today);

              return (
                <tr
                  key={game.name + i}
                  className="bg-slate-100 hover:bg-brand-50 transition"
                >
                  {/* Game Name */}
                  <td className="border border-brand-ink px-1 py-2 bg-brand-50 text-center">
                    <div className="font-black uppercase text-sm md:text-base leading-none">
                      {game.name}
                    </div>
                    <div className="text-[10px] text-slate-900 leading-none mt-1">{game.time}</div>
                    <Link
                      href={`/chart/${slug}`}
                      className="inline-block text-[10px] font-bold text-brand-700 hover:text-brand-900 leading-none mt-0.5"
                    >
                      Chart →
                    </Link>
                  </td>

                  {/* Yesterday */}
                  <td className="border border-brand-ink px-3 py-1.5 text-center">
                    <span className="font-mono font-black text-2xl md:text-3xl text-gray-800">
                      {game.yesterday || "XX"}
                    </span>
                  </td>

                  {/* Today */}
                  <td className="border border-brand-ink px-3 py-1.5 text-center">
                    {hasResult ? (
                      <span className="font-mono font-black text-2xl md:text-3xl text-green-600">
                        {game.today}
                      </span>
                    ) : isLive ? (
                      <Image
                        src="/wait.gif"
                        alt="Waiting for result"
                        width={150}
                        height={150}
                        unoptimized
                        className="mx-auto h-10 w-10 object-contain md:h-12 md:w-12"
                      />
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
        <div className="p-2.5 rounded-xl bg-brand-100 text-slate-900 border border-brand-ink shrink-0 shadow-md">
          <FiBarChart2 size={18} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            {t("मंथली चार्ट", "Monthly Charts", lang)}
          </h2>
          <p className="text-xs text-gray-400">
            {t("सट्टा टुडे रिजल्ट चार्ट रिकॉर्ड", "Satta Today Result chart records", lang)}
          </p>
        </div>
      </div>
      {tables.map((table, idx) => (
        <div key={idx} className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-brand-100 text-slate-900 text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {table.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-brand-ink text-brand-100 text-xs md:text-sm uppercase">
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
  const phone = String(khaiwal?.whatsapp || "918295877030");
  const name = String(khaiwal?.name || "KHAIWAL");
  const whatsappPhone = normalizeWhatsAppNumber(phone);

  const games = [
    { name: t("पारस सिटी", "Paras City", lang), time: "12:50 PM" },
    { name: t("सदर बाजार", "Sadar Bazar", lang), time: "1:20 PM" },
    { name: t("ग्वालियर", "Gwalior", lang), time: "2:15 PM" },
    { name: t("दिल्ली बाजार", "Delhi Bazar", lang), time: "2:55 PM" },
    { name: t("दिल्ली सिटी", "Delhi City", lang), time: "3:40 PM" },
    { name: t("श्री गणेश", "Shri Ganesh", lang), time: "4:20 PM" },
    { name: t("आगरा सिटी", "Agra City", lang), time: "5:20 PM" },
    { name: t("फरीदाबाद", "Faridabad", lang), time: "5:55 PM" },
    { name: t("जयपुर सिटी", "Jaipur City", lang), time: "7:20 PM" },
    { name: t("गाज़ियाबाद", "Ghaziabad", lang), time: "9:30 PM" },
    { name: t("वृन्दावन सिटी", "Vrindavan City", lang), time: "10:40 PM" },
    { name: t("गली", "Gali", lang), time: "11:30 PM" },
    { name: t("दिसावर", "Disawar", lang), time: "1:30 AM" },
  ];

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="relative overflow-hidden rounded-3xl border-4 border-dashed border-red-500 bg-gradient-to-b from-brand-300 via-brand-50 to-white shadow-xl">

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
          <div className="bg-white/60 backdrop-blur rounded-2xl border-2 border-brand-500 p-4">

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
          <div className="bg-white border-2 border-brand-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Jodi Rate
            </p>
            <p className="text-2xl font-black text-brand-700">
              10-960
            </p>
          </div>

          <div className="bg-white border-2 border-brand-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Haruf Rate
            </p>
            <p className="text-2xl font-black text-brand-700">
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
            className="inline-block text-3xl md:text-4xl font-black text-brand-700 border-b-4 border-brand-500"
          >
            +{whatsappPhone}
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
            href={getWhatsAppLink(phone, "Satta Today Result")}
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
  { key: "dlbz" as const, name: "Delhi Bazar", resultName: "DELHI BAZAR" },
  { key: "srgn" as const, name: "Shri Ganesh", resultName: "SHREE GANESH" },
  { key: "frbd" as const, name: "Faridabad", resultName: "FARIDABAD" },
  { key: "gzbd" as const, name: "Gaziabad", resultName: "GAZIYABAD" },
  { key: "gali" as const, name: "Gali", resultName: "GALI" },
  { key: "dswr" as const, name: "Disawar", resultName: "DESAWER" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MonthlyChartSection({
  initialRows,
  initialMonth,
  initialYear,
  declaredGames,
  lang,
}: {
  initialRows: ChartRow[];
  initialMonth: string;
  initialYear: string;
  declaredGames: SK24Game[];
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
  const istDateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  const declaredByName = new Map(
    declaredGames.map((game) => [game.name.toUpperCase(), game.today]),
  );
  const chartValue = (row: ChartRow, game: (typeof CHART_GAMES)[number]) => {
    const isToday =
      selectedYear === istDateParts.year &&
      selectedMonth.toLowerCase() === String(istDateParts.month).toLowerCase() &&
      Number(row.date) === Number(istDateParts.day);

    if (!isToday) return row[game.key] || "XX";
    const declaredValue = declaredByName.get(game.resultName);
    return isDeclaredResult(declaredValue) ? declaredValue : "XX";
  };

  return (
    <section id="monthly-records" className="sa scroll-mt-24 opacity-0 translate-y-8">
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
          <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 appearance-none cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <FiBarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 pointer-events-none" />
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 appearance-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {chartLoading && (
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Chart Table */}
      {chartLoading ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-brand-100 text-slate-900 text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t("लोड हो रहा है...", "Loading...", lang)}</p>
          </div>
        </div>
      ) : rows.length > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-brand-100 text-slate-900 text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-brand-ink text-brand-100 text-[10px] md:text-xs uppercase">
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
                        {chartValue(row, g)}
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

function SuppliedHomeSeoContent() {
  return (
    <>
      <section className="space-y-3">
        <p>Welcome to <strong>SattaTodayResult.com</strong>, where you can find the latest Satta result information in a simple and easy-to-read format.</p>
        <p>This website is designed for users looking for Satta Today Result, Satta King Today Result, daily result updates, charts and previous records.</p>
        <p>Current and historical information will be organized into separate pages so you can find the result you need without searching through unnecessary content.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Check Latest Satta King Result Online</h2>
        <p>The Satta King Today Result section is made for users who want to check the latest available result information.</p>
        <p>The result pages will be updated with the relevant date and market information. Always check the result date before treating an entry as the latest update.</p>
        <p>For other result categories, you can explore the relevant pages from the main navigation.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Real Time Satta Result Today Updates</h2>
        <p>Looking for the Satta Result Today? This website brings current result information together in a clean and simple format.</p>
        <p>Each important result category will have its own page. This helps users find specific information quickly and also keeps the website structure clear.</p>
        <p>The focus is on useful result information, readable charts and properly organized previous records.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Complete Satta King Charts and Records</h2>
        <p>A Satta King Chart can contain previous result records arranged by date, month or year.</p>
        <p>Instead of placing a very large amount of historical information on one page, separate chart pages can be created for different periods.</p>
        <p>This makes old records easier to find and gives every chart page a clear purpose.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Historical Satta King Old Result Archive</h2>
        <p>Looking for an old Satta King result? Historical records can be organized through monthly and yearly chart pages.</p>
        <p>For example, users can find a particular month and then check the available dates from that chart.</p>
        <p>Old records should always show the correct date so that previous information is not confused with the current result.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Historical Satta King Old Result Archive</h2>
        <p>Daily result pages are useful when users want to check current information without going through a long archive.</p>
        <p>The website can create separate pages for major result categories and keep each page focused on its own search intent.</p>
        <p>This approach also makes navigation easier for users who visit the website from Google.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Popular Satta King Result Markets</h2>
        <p>As the website grows, dedicated pages can be created for popular result searches such as:</p>
        <ul className="grid list-disc gap-2 pl-5 sm:grid-cols-2">
          <li>Gali Result</li><li>Disawar Result</li><li>Faridabad Result</li><li>Ghaziabad Result</li><li>Delhi Bazar Result</li><li>Other relevant market result pages</li>
        </ul>
        <p>Each page should have unique content, its own title, proper headings and relevant chart information.</p>
        <p>Do not create multiple pages with the same paragraph and only change the market name. That would make the pages look templated.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Yearly and Monthly Satta Record Charts</h2>
        <p>The Satta King Record Chart section can contain historical result information in an organized format.</p>
        <p>Monthly records can be separated from yearly records so users can reach older information quickly.</p>
        <p>For example:</p>
        <div className="rounded-xl bg-brand-50 p-4 font-bold text-gray-900">Satta King Chart → 2026 → September 2026 → Daily Records</div>
        <p>This creates a clean hierarchy for both users and search engines.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Why Choose SattaTodayResult Website</h2>
        <p>SattaTodayResult.com is being built around a simple idea: make result information easy to find.</p>
        <p>The website structure will focus on:</p>
        <ul className="grid list-disc gap-2 pl-5 sm:grid-cols-2">
          <li>Current result information</li><li>Historical chart records</li><li>Monthly result pages</li><li>Yearly record pages</li><li>Market-specific pages</li><li>Simple navigation</li><li>Mobile-friendly pages</li><li>Clear internal linking</li>
        </ul>
        <p>The goal should be to provide useful information instead of repeating the same keywords across every section.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">How to Find Any Satta Result Online</h2>
        <p>Finding a result should be simple.</p>
        <p>Start from the homepage and select the relevant result category. Open the required chart or daily result page and check the date shown with the available information.</p>
        <p>For older information, use the relevant monthly or yearly chart page.</p>
        <p>Always verify the date before using any result record as current information.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div><h3 className="font-black text-gray-900">What is Satta Today Result?</h3><p>Satta Today Result refers to the latest available result information for the current date.</p></div>
          <div><h3 className="font-black text-gray-900">Where can I check Satta King Today Result?</h3><p>You can check the latest available Satta King result from the relevant result page on SattaTodayResult.com.</p></div>
          <div><h3 className="font-black text-gray-900">What is a Satta King Chart?</h3><p>A Satta King Chart is a record of previous results arranged by date, month or year.</p></div>
          <div><h3 className="font-black text-gray-900">Can I check old Satta King results?</h3><p>Yes. Available historical results can be organized through dedicated monthly and yearly chart pages.</p></div>
          <div><h3 className="font-black text-gray-900">Can I check Satta Result Today on mobile?</h3><p>Yes. The website should be designed with a mobile-friendly layout so result and chart pages are easy to browse on smaller screens.</p></div>
          <div><h3 className="font-black text-gray-900">Which result pages will be available?</h3><p>The website can gradually add dedicated pages for relevant searches such as Gali, Disawar, Faridabad, Ghaziabad and Delhi Bazar results.</p></div>
        </div>
      </section>
    </>
  );
}

function LiveSattaSeoContent() {
  return (
    <article className="sa opacity-0 translate-y-8 space-y-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700 md:p-8">
      <SuppliedHomeSeoContent />
    </article>
  );
}
