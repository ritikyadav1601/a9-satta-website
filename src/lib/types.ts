export interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

export interface ChartRow {
  date: string;
  dswr: string;
  frbd: string;
  gzbd: string;
  gali: string;
  srgn: string;
  dlbz: string;
}

export interface MonthlyChartData {
  month: string;
  year: string;
  results: ChartRow[];
  scrapedAt: number;
}

export interface HomepageData {
  live: GameResult[];
  next: GameResult[];
  rest: GameResult[];
  scrapedAt: number;
}

export interface GameChartData {
  gameName: string;
  chartTitle: string;
  month: string;
  year: string;
  columns: string[];
  results: { date: string; day: string; result: string }[];
  scrapedAt: number;
}

export interface SK24Game {
  name: string;
  time: string;
  yesterday: string;
  today: string;
  updatedAt?: string | number | Date | null;
}

export interface SK24GamesData {
  games: SK24Game[];
  scrapedAt: number;
}

export interface SK24ChartTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface SK24ChartsData {
  tables: SK24ChartTable[];
  scrapedAt: number;
}
