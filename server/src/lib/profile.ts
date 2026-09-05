import type { DatabaseSync } from "node:sqlite";
import YahooFinance from "yahoo-finance2";
import { SYMBOL_MAP } from "./symbols.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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
  officialLinks: { label: string; url: string; description: string }[];
}

interface ProfileRow {
  symbol: string;
  website: string | null;
  industry: string | null;
  business_summary: string | null;
  city: string | null;
  country: string | null;
  full_time_employees: number | null;
  insiders_pct: number | null;
  institutions_pct: number | null;
  institutions_count: number | null;
  shares_outstanding: number | null;
  fetched_at: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // company profile data barely changes day to day

function buildOfficialLinks(symbol: string, website: string | null) {
  const code = symbol.replace(".NS", "");
  const links = [
    {
      label: "NSE — Company quote & filings",
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${code}`,
      description: "Official exchange page: live quote, corporate actions, and filings index.",
    },
    {
      label: "NSE — Corporate announcements",
      url: `https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=${code}`,
      description: "Regulatory disclosures and announcements filed with the exchange.",
    },
    {
      label: "NSE — Annual reports",
      url: `https://www.nseindia.com/companies-listing/corporate-filings-annual-reports?symbol=${code}`,
      description: "Annual reports filed by the company, as published by NSE.",
    },
  ];
  if (website) {
    links.unshift({
      label: "Company website",
      url: website,
      description: "The company's own investor relations and official information.",
    });
  }
  return links;
}

function rowToProfile(symbol: string, name: string, sector: string, row: ProfileRow): CompanyProfile {
  return {
    symbol,
    name,
    sector,
    industry: row.industry,
    website: row.website,
    businessSummary: row.business_summary,
    city: row.city,
    country: row.country,
    fullTimeEmployees: row.full_time_employees,
    ownership: {
      insidersPercentHeld: row.insiders_pct,
      institutionsPercentHeld: row.institutions_pct,
      institutionsCount: row.institutions_count,
      sharesOutstanding: row.shares_outstanding,
    },
    officialLinks: buildOfficialLinks(symbol, row.website),
  };
}

export async function getCompanyProfile(
  db: DatabaseSync,
  symbol: string
): Promise<CompanyProfile | null> {
  const info = SYMBOL_MAP.get(symbol);
  if (!info) return null;

  const cached = db
    .prepare(`SELECT * FROM company_profiles WHERE symbol = ?`)
    .get(symbol) as unknown as ProfileRow | undefined;

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;

  if (isFresh && cached) {
    return rowToProfile(symbol, info.name, info.sector, cached);
  }

  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["assetProfile", "majorHoldersBreakdown", "defaultKeyStatistics"],
    });
    const p = result.assetProfile;
    const holders = result.majorHoldersBreakdown;
    const stats = result.defaultKeyStatistics;

    const row: Omit<ProfileRow, "fetched_at"> = {
      symbol,
      website: p?.website ?? null,
      industry: p?.industry ?? null,
      business_summary: p?.longBusinessSummary ?? null,
      city: p?.city ?? null,
      country: p?.country ?? null,
      full_time_employees: p?.fullTimeEmployees ?? null,
      insiders_pct: holders?.insidersPercentHeld ?? null,
      institutions_pct: holders?.institutionsPercentHeld ?? null,
      institutions_count: holders?.institutionsCount ?? null,
      shares_outstanding: stats?.sharesOutstanding ?? null,
    };

    db.prepare(
      `INSERT INTO company_profiles
        (symbol, website, industry, business_summary, city, country, full_time_employees,
         insiders_pct, institutions_pct, institutions_count, shares_outstanding, fetched_at)
       VALUES (@symbol, @website, @industry, @business_summary, @city, @country, @full_time_employees,
               @insiders_pct, @institutions_pct, @institutions_count, @shares_outstanding, datetime('now'))
       ON CONFLICT(symbol) DO UPDATE SET
        website = excluded.website,
        industry = excluded.industry,
        business_summary = excluded.business_summary,
        city = excluded.city,
        country = excluded.country,
        full_time_employees = excluded.full_time_employees,
        insiders_pct = excluded.insiders_pct,
        institutions_pct = excluded.institutions_pct,
        institutions_count = excluded.institutions_count,
        shares_outstanding = excluded.shares_outstanding,
        fetched_at = excluded.fetched_at`
    ).run(row);

    return rowToProfile(symbol, info.name, info.sector, { ...row, fetched_at: "" });
  } catch (err) {
    if (cached) return rowToProfile(symbol, info.name, info.sector, cached);
    return rowToProfile(symbol, info.name, info.sector, {
      symbol,
      website: null,
      industry: null,
      business_summary: null,
      city: null,
      country: null,
      full_time_employees: null,
      insiders_pct: null,
      institutions_pct: null,
      institutions_count: null,
      shares_outstanding: null,
      fetched_at: "",
    });
  }
}
