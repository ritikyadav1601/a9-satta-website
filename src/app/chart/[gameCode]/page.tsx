"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

interface ChartRow {
  date: string;
  day: string;
  result: string;
}

// `date` may be a plain day number ("26") or a full date string
// (e.g. "2026-06-01"). Always show the day-of-month, never the year.
function getDayOfMonth(date: string): string {
  const trimmed = (date || "").trim();
  if (/^\d{1,2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return String(parsed.getDate());
  return trimmed.slice(-2);
}

export default function GameChartPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = use(params);
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  const [rows, setRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState("");
  const [displayYear, setDisplayYear] = useState("");
  const [resultTime, setResultTime] = useState("");

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth()));

  // Custom games use a separate API
  const customGameKeys = ["kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city"];
  const isCustomGame = customGameKeys.includes(gameCode);

  const fetchChart = async (date: Date) => {
    setLoading(true);
    const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const m = monthNames[date.getMonth()];
    const y = String(date.getFullYear());

    try {
      let url: string;
      if (isCustomGame) {
        url = `/api/custom-games/chart?game=${gameCode}&month=${date.getMonth() + 1}&year=${y}`;
      } else {
        url = `/api/game-chart?slug=${gameCode}&month=${m}&year=${y}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRows(data.results || []);
        setDisplayMonth(data.month || m.charAt(0).toUpperCase() + m.slice(1));
        setDisplayYear(data.year || y);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart(currentDate);
  }, [gameCode, currentDate]);

  useEffect(() => {
    const findTime = async () => {
      try {
        const endpoints = ["/api/live-results", "/api/next-results", "/api/rest-results"];
        for (const url of endpoints) {
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            const found = data.results?.find(
              (g: { name: string }) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
            );
            if (found) {
              setResultTime(found.time);
              return;
            }
          }
        }
        const sk24Res = await fetch("/api/sattaking24");
        const sk24Data = await sk24Res.json();
        if (sk24Data.success) {
          const found = sk24Data.games?.find(
            (g: { name: string }) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
          );
          if (found) setResultTime(found.time);
        }
      } catch { /* ignore */ }
    };
    findTime();
  }, [gameCode]);

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir));
  };

  const isCurrentMonth =
    currentDate.getFullYear() === now.getFullYear() &&
    currentDate.getMonth() === now.getMonth();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-3">
            <FiCalendar size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chart Record</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {gameName}
          </h1>
          {resultTime && (
            <p className="text-gray-400 text-sm mt-1">Result Time: {resultTime}</p>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 mb-5">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm"
          >
            <FiChevronLeft size={18} />
          </button>
          <div className="text-base md:text-lg font-black text-gray-900">
            {displayMonth || "..."} {displayYear}
          </div>
          <button
            onClick={() => navigateMonth(1)}
            disabled={isCurrentMonth}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Chart Cards */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-10 w-14 rounded-xl" />
              </div>
            ))}
          </div>
        ) : rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((row, i) => {
              const hasResult = row.result && row.result !== "XX";
              return (
                <div
                  key={row.date + i}
                  className={`flex items-center gap-3 rounded-xl p-3 md:p-4 border transition-colors ${
                    hasResult
                      ? "bg-white border-gray-200 hover:border-gray-300"
                      : "bg-gray-50/50 border-gray-100"
                  }`}
                >
                  {/* Date */}
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="font-black text-gray-800 text-lg md:text-xl">
                      {getDayOfMonth(row.date)}
                    </span>
                  </div>

                  {/* Day + Time */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm md:text-base">{row.day || "--"}</p>
                    {resultTime && (
                      <p className="text-[11px] text-gray-400 font-medium">{resultTime}</p>
                    )}
                  </div>

                  {/* Result */}
                  <div className={`min-w-[56px] py-2 px-3 rounded-xl text-center font-mono font-black text-xl md:text-2xl ${
                    hasResult
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-300"
                  }`}>
                    {row.result || "XX"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiCalendar size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No chart data available</p>
            <p className="text-gray-400 text-sm mt-1">
              {displayMonth} {displayYear} data not found for {gameName}
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 text-sm font-bold transition-colors"
          >
            <FiChevronLeft size={16} />
            Back to All Results
          </Link>
        </div>
      </div>
    </div>
  );
}
