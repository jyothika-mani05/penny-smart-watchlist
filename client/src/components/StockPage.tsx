import { useEffect, useState } from "react";
import { api } from "../api";
import type { CompanyProfile, HistoryResponse, Ownership } from "../types";
import { PriceChart } from "./PriceChart";
import { RobotIcon } from "./RobotIcon";

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
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [expandSummary, setExpandSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setProfile(null);
    setExpandSummary(false);
    api.getHistory(symbol, 30).then(setData).catch((err) => setError((err as Error).message));
    api.getProfile(symbol).then(setProfile).catch((err) => setError((err as Error).message));
  }, [symbol]);

  return (
    <div className="stock-page">
      <button className="back-link" onClick={onBack}>
        ← Back
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

          <div className="drawer-stat-grid stat-highlight-in">
            <div>
              <span className="stat-label">Day range</span>
              <span className="stat-value-sm">
                ₹{data.dayLow.toFixed(2)} – ₹{data.dayHigh.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="stat-label">30d range</span>
              <span className="stat-value-sm">
                ₹{data.periodLow.toFixed(2)} – ₹{data.periodHigh.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="stat-label">Volume vs normal</span>
              <span className="stat-value-sm">{data.volumeRatio.toFixed(1)}x</span>
            </div>
            <div>
              <span className="stat-label">Daily volatility (σ)</span>
              <span className="stat-value-sm">{data.sigma.toFixed(2)}%</span>
            </div>
            <div>
              <span className="stat-label">30d change</span>
              <span className={`stat-value-sm ${data.periodChangePct >= 0 ? "delta-up" : "delta-down"}`}>
                {data.periodChangePct >= 0 ? "+" : ""}
                {data.periodChangePct.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="stat-label">Since you checked</span>
              <span className={`stat-value-sm ${data.sinceCheckedChangePct >= 0 ? "delta-up" : "delta-down"}`}>
                {data.sinceCheckedChangePct >= 0 ? "+" : ""}
                {data.sinceCheckedChangePct.toFixed(2)}% ({Math.abs(data.sinceCheckedZ).toFixed(1)}σ)
              </span>
            </div>
          </div>

          <section className="page-section">
            <div className="drawer-chart-header">
              <h3>Last 30 sessions</h3>
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
                    <span className="official-link-label">{link.label} ↗</span>
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
