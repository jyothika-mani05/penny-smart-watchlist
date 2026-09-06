import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { api } from "../api";
import type { CompanyProfile, HistoryResponse, Ownership } from "../types";
import { PriceChart } from "./PriceChart";
import { RobotIcon } from "./RobotIcon";
import { InfoTooltip } from "./InfoTooltip";
import { formatExactTime, formatRelativeTime } from "../utils/time";

const TIMEFRAMES = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
] as const;

type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

function OwnershipCard({ ownership }: { ownership: Ownership }) {
  const insiders = ownership.insidersPercentHeld ?? 0;
  const institutions = ownership.institutionsPercentHeld ?? 0;
  const other = Math.max(0, 1 - insiders - institutions);
  const hasData = ownership.insidersPercentHeld != null || ownership.institutionsPercentHeld != null;

  if (!hasData) {
    return <p className="empty-state-inline">Ownership breakdown isn't available for this stock.</p>;
  }

  return (
    <div className="company-card">
      <div className="ownership-bar">
        <div className="ownership-seg ownership-insiders" style={{ width: `${insiders * 100}%` }} />
        <div className="ownership-seg ownership-institutions" style={{ width: `${institutions * 100}%` }} />
        <div className="ownership-seg ownership-other" style={{ width: `${other * 100}%` }} />
      </div>
      <div className="ownership-legend">
        <span>
          <i className="legend-dot legend-insiders" /> Promoters/Insiders {(insiders * 100).toFixed(1)}%
        </span>
        <span>
          <i className="legend-dot legend-institutions" /> Institutions {(institutions * 100).toFixed(1)}%
        </span>
        <span>
          <i className="legend-dot legend-other" /> Public & others {(other * 100).toFixed(1)}%
        </span>
      </div>
      <div className="company-meta-row" style={{ marginTop: 12 }}>
        {ownership.institutionsCount != null && (
          <span className="intent-tag">{ownership.institutionsCount} institutional holders</span>
        )}
        {ownership.sharesOutstanding != null && (
          <span className="intent-tag">
            {(ownership.sharesOutstanding / 1e7).toFixed(1)} crore shares outstanding
          </span>
        )}
      </div>
    </div>
  );
}

export function StockPage({ symbol, onBack }: { symbol: string; onBack: () => void }) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("1M");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [expandSummary, setExpandSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = TIMEFRAMES.find((t) => t.key === timeframe)!.days;

  useEffect(() => {
    setProfile(null);
    setExpandSummary(false);
    api.getProfile(symbol).then(setProfile).catch((err) => setError((err as Error).message));
  }, [symbol]);

  // Only reset to the loading state when we've actually navigated to a
  // different stock. Switching timeframes on the *same* stock keeps the
  // previous chart on screen until the new one arrives instead of collapsing
  // the page to a bare "Loading..." and back — that height flicker was
  // snapping the scroll position back to the top on every 1W/1M/3M click.
  useEffect(() => {
    setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    api
      .getHistory(symbol, days)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, days]);

  const marketWide = data ? Math.abs(data.idiosyncraticPct) < Math.abs(data.sinceCheckedChangePct) * 0.4 : false;

  return (
    <div className="stock-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} weight="bold" aria-hidden="true" /> Back to Digest
      </button>

      {error && <p className="error-text">{error}</p>}

      {!data ? (
        <p className="empty-state">Loading...</p>
      ) : (
        <>
          <div className="stock-page-header">
            <p className="watchlist-crumb">{data.sector}</p>
            <h1>{data.name}</h1>
            <span className="item-symbol">{data.symbol.replace(".NS", "")}</span>
          </div>

          <div className="drawer-price-row stat-highlight-in">
            <span className="price price-lg">₹{data.price.toFixed(2)}</span>
            <span className={`delta ${data.todayChangePct >= 0 ? "delta-up" : "delta-down"}`}>
              {data.todayChangePct >= 0 ? "▲" : "▼"} {Math.abs(data.todayChangePct).toFixed(2)}% today
            </span>
            {data.todayChangePct >= 0 && <RobotIcon state="happy" size={22} badge />}
          </div>

          <section className="page-section">
            <div className="drawer-chart-header">
              <div className="timeframe-toggle">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.key}
                    className={timeframe === t.key ? "active" : ""}
                    onClick={() => setTimeframe(t.key)}
                  >
                    {t.key}
                  </button>
                ))}
              </div>
              <button className="link-btn" onClick={() => setShowLog((s) => !s)}>
                {showLog ? "Show chart" : "Show day-by-day log"}
              </button>
            </div>

            {showLog ? (
              <div className="day-log">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Close</th>
                      <th>Change</th>
                      <th>σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.log.map((d) => (
                      <tr key={d.date} className={`log-row-${d.materiality}`}>
                        <td>{d.date}</td>
                        <td>₹{d.close.toFixed(2)}</td>
                        <td className={d.changePct >= 0 ? "delta-up" : "delta-down"}>
                          {d.changePct >= 0 ? "▲" : "▼"} {Math.abs(d.changePct).toFixed(2)}%
                        </td>
                        <td>{Math.abs(d.z).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <PriceChart log={data.log} />
            )}
          </section>

          <section className="page-section">
            <h3 className="why-flagged-heading">Why Penny flagged this</h3>

            <div className="why-flagged-headline">
              <span className={`why-flagged-sigma ${data.materiality}`}>
                {Math.abs(data.sinceCheckedZ).toFixed(1)}σ
              </span>
              <span>above its normal movement since you last checked</span>
              <InfoTooltip text="This stock moved this many standard deviations more than its typical daily move — a statistical measure of how unusual the size of the move is for this specific stock." />
            </div>

            <div className="why-flagged-grid">
              <div>
                <span className="stat-label">Volume</span>
                <span className="stat-value-sm">{data.volumeRatio.toFixed(1)}× normal</span>
              </div>
              <div>
                <span className="stat-label">Market (Nifty)</span>
                <span className={`stat-value-sm ${data.marketTodayPct >= 0 ? "delta-up" : "delta-down"}`}>
                  {data.marketTodayPct >= 0 ? "+" : ""}
                  {data.marketTodayPct.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="stat-label">{data.symbol.replace(".NS", "")}</span>
                <span className={`stat-value-sm ${data.sinceCheckedChangePct >= 0 ? "delta-up" : "delta-down"}`}>
                  {data.sinceCheckedChangePct >= 0 ? "+" : ""}
                  {data.sinceCheckedChangePct.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="stat-label">Last checked</span>
                <span className="stat-value-sm" title={data.seenAt ? formatExactTime(data.seenAt) : undefined}>
                  {data.seenAt ? formatRelativeTime(data.seenAt) : "—"}
                </span>
              </div>
            </div>

            <div className={`market-context-tag ${marketWide ? "market-wide" : "stock-specific"}`}>
              {marketWide ? "Mostly market-wide" : "Stock-specific move"}
            </div>

            <div className="penny-explanation">
              <RobotIcon state={data.materiality === "quiet" ? "awake" : "concerned"} size={26} badge />
              <p>{data.reason}</p>
            </div>

            <div className="drawer-stat-grid">
              <div>
                <span className="stat-label">Day range</span>
                <span className="stat-value-sm">
                  ₹{data.dayLow.toFixed(2)} – ₹{data.dayHigh.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="stat-label">{timeframe} range</span>
                <span className="stat-value-sm">
                  ₹{data.periodLow.toFixed(2)} – ₹{data.periodHigh.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="stat-label">{timeframe} change</span>
                <span className={`stat-value-sm ${data.periodChangePct >= 0 ? "delta-up" : "delta-down"}`}>
                  {data.periodChangePct >= 0 ? "+" : ""}
                  {data.periodChangePct.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="stat-label">Daily volatility (σ)</span>
                <span className="stat-value-sm">{data.sigma.toFixed(2)}%</span>
              </div>
            </div>
          </section>

          <section className="page-section">
            <h3>About the company</h3>
            {!profile ? (
              <p className="empty-state">Loading company info...</p>
            ) : (
              <div className="company-card">
                <div className="company-meta-row">
                  {profile.industry && <span className="intent-tag">{profile.industry}</span>}
                  {profile.city && profile.country && (
                    <span className="intent-tag">
                      {profile.city}, {profile.country}
                    </span>
                  )}
                  {profile.fullTimeEmployees && (
                    <span className="intent-tag">
                      {profile.fullTimeEmployees.toLocaleString()} employees
                    </span>
                  )}
                </div>

                {profile.businessSummary ? (
                  <p className="business-summary">
                    {expandSummary || profile.businessSummary.length <= 320
                      ? profile.businessSummary
                      : `${profile.businessSummary.slice(0, 320)}…`}
                    {profile.businessSummary.length > 320 && (
                      <button className="link-btn" onClick={() => setExpandSummary((s) => !s)}>
                        {expandSummary ? " Show less" : " Read more"}
                      </button>
                    )}
                  </p>
                ) : (
                  <p className="empty-state-inline">No business summary available for this company.</p>
                )}
              </div>
            )}
          </section>

          <section className="page-section">
            <h3>Who else holds this stock</h3>
            <p className="compare-note">
              Disclosed ownership structure, not a performance or popularity stat — there's
              no reliable public data on how many individual investors are in profit on any
              stock, so we don't show one.
            </p>
            {profile && (
              <OwnershipCard ownership={profile.ownership} />
            )}
          </section>

          <section className="page-section">
            <h3>Legal & regulatory documents</h3>
            <p className="compare-note">
              These link to official sources — the exchange and the company itself — rather
              than data hosted by this app, so filings and disclosures are always current.
            </p>
            {profile && (
              <div className="official-links">
                {profile.officialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="official-link-card"
                  >
                    <span className="official-link-label">
                      {link.label} <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                    </span>
                    <span className="official-link-desc">{link.description}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
