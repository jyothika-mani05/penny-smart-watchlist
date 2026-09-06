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
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation", sector: "Energy/Conglomerate" },

  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT" },

  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Banking" },

  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "ITC.NS", name: "ITC", sector: "FMCG" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG" },

  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },

  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },

  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Auto" },

  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer" },

  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma" },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma" },

  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals" },

  { symbol: "NTPC.NS", name: "NTPC", sector: "Power" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Power" },

  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financial Services" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financial Services" },

  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Cement" },
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
