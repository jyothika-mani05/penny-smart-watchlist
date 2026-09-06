import type { SparkPoint } from "../types";

/** A compact trend line for a stock card — no axes, no tooltip, just shape.
 *  For the full interactive chart (hover, crosshair, materiality dots), see PriceChart. */
export function Sparkline({ points, up }: { points: SparkPoint[]; up: boolean }) {
  const width = 110;
  const height = 32;
  const chrono = points;
  if (chrono.length < 2) return <svg width={width} height={height} className="sparkline" />;

  const closes = chrono.map((d) => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const pad = (max - min) * 0.1 || max * 0.02;
  const yMin = min - pad;
  const yMax = max + pad;

  const x = (i: number) => (i / (chrono.length - 1)) * width;
  const y = (v: number) => height - ((v - yMin) / (yMax - yMin || 1)) * height;

  const path = chrono
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.close).toFixed(1)}`)
    .join(" ");

  const color = up ? "var(--green)" : "var(--red)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
