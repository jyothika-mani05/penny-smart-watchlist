import type { PortfolioNarrative } from "../types";

export function StatTiles({ narrative }: { narrative: PortfolioNarrative }) {
  const unusual = narrative.significantCount + narrative.notableCount;
  const quiet = narrative.totalCount - unusual;

  const tiles = [
    { label: "Stocks tracked", value: narrative.totalCount, tone: "neutral" as const },
    { label: "Unusual", value: unusual, tone: unusual > 0 ? ("red" as const) : ("neutral" as const) },
    { label: "Quiet", value: quiet, tone: "neutral" as const },
  ];

  return (
    <div className="stat-tiles stat-tiles-compact">
      {tiles.map((t) => (
        <div key={t.label} className={`stat-tile-compact stat-tile-${t.tone}`}>
          <span className="stat-value-compact">{t.value}</span>
          <span className="stat-label-compact">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
