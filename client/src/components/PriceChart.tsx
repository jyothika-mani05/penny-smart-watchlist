import { useMemo, useState } from "react";
import type { DayLogEntry } from "../types";

const WIDTH = 660;
const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 56 };

function formatDate(raw: string): string {
  const clean = raw.replace(" (live)", "");
  const d = new Date(clean);
  if (Number.isNaN(d.getTime())) return clean;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function PriceChart({ log }: { log: DayLogEntry[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // log arrives most-recent-first; chart reads left-to-right chronologically.
  const chrono = useMemo(() => [...log].reverse(), [log]);

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const closes = chrono.map((d) => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const pad = (max - min) * 0.08 || max * 0.02;
  const yMin = min - pad;
  const yMax = max + pad;

  const x = (i: number) => (chrono.length <= 1 ? 0 : (i / (chrono.length - 1)) * plotW);
  const y = (v: number) => plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const points = chrono.map((d, i) => [x(i), y(d.close)] as const);
  const linePath = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.[0].toFixed(1)},${plotH} L0,${plotH} Z`;

  const trendUp = chrono.length > 1 && chrono[chrono.length - 1].close >= chrono[0].close;
  const lineColor = trendUp ? "var(--green)" : "var(--red)";

  const tickEvery = Math.max(1, Math.ceil(chrono.length / 7));
  const hovered = hoverIdx != null ? chrono[hoverIdx] : null;

  return (
    <div className="price-chart">
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Price history chart"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* gridlines + y labels */}
          {[0, 0.5, 1].map((t) => {
            const value = yMax - t * (yMax - yMin);
            return (
              <g key={t}>
                <line x1={0} x2={plotW} y1={t * plotH} y2={t * plotH} stroke="var(--border)" strokeDasharray="3 4" />
                <text x={-8} y={t * plotH} textAnchor="end" dominantBaseline="middle" className="chart-axis-label">
                  {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#areaFill)" />
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} />

          {/* materiality markers */}
          {chrono.map((d, i) =>
            d.materiality !== "quiet" ? (
              <circle
                key={d.date}
                cx={x(i)}
                cy={y(d.close)}
                r={4}
                fill={d.materiality === "significant" ? "var(--red)" : "var(--amber)"}
                stroke="var(--panel)"
                strokeWidth={1.5}
              />
            ) : null
          )}

          {/* hover target + crosshair */}
          {chrono.map((d, i) => (
            <rect
              key={d.date + "-hit"}
              x={x(i) - plotW / chrono.length / 2}
              y={0}
              width={plotW / chrono.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
          {hoverIdx != null && (
            <>
              <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={0} y2={plotH} stroke="var(--text-dim)" strokeDasharray="2 3" />
              <circle cx={x(hoverIdx)} cy={y(chrono[hoverIdx].close)} r={5} fill={lineColor} stroke="var(--panel)" strokeWidth={2} />
            </>
          )}

          {/* x labels */}
          {chrono.map((d, i) =>
            i % tickEvery === 0 || i === chrono.length - 1 ? (
              <text key={d.date + "-x"} x={x(i)} y={plotH + 18} textAnchor="middle" className="chart-axis-label">
                {formatDate(d.date)}
              </text>
            ) : null
          )}
        </g>
      </svg>

      <div className="chart-tooltip-row">
        {hovered ? (
          <>
            <strong>{formatDate(hovered.date)}</strong>
            <span>₹{hovered.close.toFixed(2)}</span>
            <span className={hovered.changePct >= 0 ? "delta-up" : "delta-down"}>
              {hovered.changePct >= 0 ? "▲" : "▼"} {Math.abs(hovered.changePct).toFixed(2)}% ({Math.abs(hovered.z).toFixed(1)}σ)
            </span>
          </>
        ) : (
          <span className="chart-hint">Hover the chart for day-by-day detail · dots mark unusual days</span>
        )}
      </div>
    </div>
  );
}
