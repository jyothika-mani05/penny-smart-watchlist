export interface SymbolInfo {
  symbol: string;
  name: string;
  sector: string;
}

// Fixed universe of well-known NSE stocks for the demo, grouped by sector so
// peer-relative comparisons ("is this move market-wide or stock-specific") have
// something real to compare against.
export const UNIVERSE: SymbolInfo[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy/Conglomerate" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "ITC.NS", name: "ITC", sector: "FMCG" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer" },
];

export const MARKET_INDEX = { symbol: "^NSEI", name: "Nifty 50" };

export const SYMBOL_MAP = new Map(UNIVERSE.map((s) => [s.symbol, s]));

export function peersOf(symbol: string): string[] {
  const info = SYMBOL_MAP.get(symbol);
  if (!info) return [];
  return UNIVERSE.filter((s) => s.sector === info.sector && s.symbol !== symbol).map(
    (s) => s.symbol
  );
}
