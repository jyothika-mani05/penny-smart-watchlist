import type { PortfolioNarrative } from "../types";

export function StatTiles({ narrative }: { narrative: PortfolioNarrative }) {
  const tiles = [
    { label: "Tracked", value: narrative.totalCount, tone: "neutral" as const },
    { label: "Significant", value: narrative.significantCount, tone: "red" as const },
    { label: "Notable", value: narrative.notableCount, tone: "amber" as const },
    {
      label: "Up / Down",
      value: `${narrative.upCount} / ${narrative.downCount}`,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="stat-tiles">
      {tiles.map((t) => (
        <div key={t.label} className={`stat-tile stat-tile-${t.tone}`}>
          <span className="stat-value">{t.value}</span>
          <span className="stat-label">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
