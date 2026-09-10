import type { GameResult } from "./types";

const A9_RESULTS_URL = process.env.A9_RESULTS_API_URL || "https://a9-satta.com/api/results.php";

type A9ApiGame = {
  game_name?: unknown;
  result_time?: unknown;
  result?: unknown;
  status?: unknown;
};

type A9ApiResponse = {
  success?: boolean;
  games?: A9ApiGame[];
};

function displayTime(value: unknown) {
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hour = Number(match[1]);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function displayResult(value: unknown, status: unknown) {
  if (String(status ?? "").toLowerCase() === "pending") return "XX";
  const result = String(value ?? "").trim();
  return result && result !== "--" ? result : "XX";
}

/** Fetch the five live results published by a9-satta.com. */
export async function getA9Results(): Promise<GameResult[]> {
  try {
    const response = await fetch(A9_RESULTS_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as A9ApiResponse;
    if (!data.success || !Array.isArray(data.games)) return [];

    return data.games
      .map((game) => ({
        name: String(game.game_name ?? "").trim(),
        time: displayTime(game.result_time),
        yesterday: "XX",
        today: displayResult(game.result, game.status),
      }))
      .filter((game) => game.name);
  } catch (error) {
    // The homepage remains available with its existing data if the external feed is down.
    console.error("[a9-results] unable to load result feed:", (error as Error).message);
    return [];
  }
}
