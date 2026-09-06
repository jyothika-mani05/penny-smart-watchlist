export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Watchlist {
  id: number;
  name: string;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  symbol: string;
  display_name: string | null;
  intent: string;
  added_at: string;
}

export type Materiality = "quiet" | "notable" | "significant";

export interface SparkPoint {
  date: string;
  close: number;
}

export interface ItemInsight {
  symbol: string;
  name: string;
  intent: string;
  price: number;
  todayChangePct: number;
  sinceCheckedChangePct: number;
  sinceCheckedZ: number;
  materiality: Materiality;
  idiosyncraticPct: number;
  volumeRatio: number;
  reason: string;
  seenAt: string;
  sparkline: SparkPoint[];
}

export interface PortfolioNarrative {
  summary: string;
  totalCount: number;
  significantCount: number;
  notableCount: number;
  downCount: number;
  upCount: number;
}

export interface DigestResponse {
  watchlistId: number;
  narrative: PortfolioNarrative;
  items: ItemInsight[];
}

export interface CompareItem {
  symbol: string;
  name: string;
  price: number;
  sinceCheckedChangePct: number;
  sinceCheckedZ: number;
  idiosyncraticPct: number;
  volumeRatio: number;
  materiality: Materiality;
  attentionScore: number;
}

export interface CompareResponse {
  watchlistId: number;
  items: CompareItem[];
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  sector: string;
}

export interface DayLogEntry {
  date: string;
  close: number;
  changePct: number;
  z: number;
  materiality: Materiality;
}

export interface HistoryResponse {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  todayChangePct: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  sigma: number;
  periodHigh: number;
  periodLow: number;
  periodChangePct: number;
  sinceCheckedChangePct: number;
  sinceCheckedZ: number;
  seenAt: string | null;
  materiality: Materiality;
  reason: string;
  idiosyncraticPct: number;
  marketTodayPct: number;
  log: DayLogEntry[];
}

export interface OfficialLink {
  label: string;
  url: string;
  description: string;
}

export interface Ownership {
  insidersPercentHeld: number | null;
  institutionsPercentHeld: number | null;
  institutionsCount: number | null;
  sharesOutstanding: number | null;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  industry: string | null;
  website: string | null;
  businessSummary: string | null;
  city: string | null;
  country: string | null;
  fullTimeEmployees: number | null;
  ownership: Ownership;
  officialLinks: OfficialLink[];
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface RemovedItem {
  id: number;
  symbol: string;
  name: string;
  intent: string | null;
  removedAt: string;
  priceAtRemoval: number;
  currentPrice: number | null;
  changePct: number | null;
}

export type Sensitivity = "sensitive" | "balanced" | "relaxed";

export interface UserSettings {
  sensitivity: Sensitivity;
}

export const INTENT_LABELS: Record<string, string> = {
  own: "Own it",
  watching_for_dip: "Watching for a dip",
  competitor_watch: "Competitor watch",
  watching: "Just watching",
};
