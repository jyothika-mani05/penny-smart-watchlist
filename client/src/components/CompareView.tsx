import { useState, type ReactNode } from "react";
import type { CompareResponse } from "../types";

function materialityLabel(m: string) {
  if (m === "significant") return "UNUSUAL";
  if (m === "notable") return "NOTABLE";
  return "QUIET";
}

export function CompareView({
  compare,
  onOpen,
}: {
  compare: CompareResponse;
  onOpen: (symbol: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string> | null>(null);

  if (compare.items.length === 0) {
    return (
      <div>
        <div className="empty-state-card">
          <p className="empty-state-title">Nothing to compare yet</p>
          <p className="empty-state-body">Add a couple of stocks to your watchlist to compare them side by side.</p>
        </div>
      </div>
    );
  }

  // Default: everything selected, so existing behaviour isn't lost — the picker
  // just lets you narrow the table down.
  const activeSelection = selected ?? new Set(compare.items.map((i) => i.symbol));
  const shown = compare.items.filter((i) => activeSelection.has(i.symbol));

  function toggle(symbol: string) {
    const next = new Set(activeSelection);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    setSelected(next);
  }

  const rows: { label: string; render: (i: (typeof compare.items)[number]) => ReactNode }[] = [
    {
      label: "Price",
      render: (i) => `₹${i.price.toFixed(2)}`,
    },
    {
      label: "Since you checked",
      render: (i) => (
        <span className={i.sinceCheckedChangePct >= 0 ? "delta-up" : "delta-down"}>
          {i.sinceCheckedChangePct >= 0 ? "▲" : "▼"} {Math.abs(i.sinceCheckedChangePct).toFixed(2)}%
        </span>
      ),
    },
    {
      label: "Unusualness",
      render: (i) => `${Math.abs(i.sinceCheckedZ).toFixed(1)}σ`,
    },
    {
      label: "Volume",
      render: (i) => `${i.volumeRatio.toFixed(1)}×`,
    },
    {
      label: "vs Market",
      render: (i) => (
        <span className={i.idiosyncraticPct >= 0 ? "delta-up" : "delta-down"}>
          {i.idiosyncraticPct >= 0 ? "+" : ""}
          {i.idiosyncraticPct.toFixed(2)}%
        </span>
      ),
    },
    {
      label: "Penny says",
      render: (i) => <span className={`penny-says penny-says-${i.materiality}`}>{materialityLabel(i.materiality)}</span>,
    },
  ];

  return (
    <div>
      <div className="compare-picker">
        {compare.items.map((i) => (
          <button
            key={i.symbol}
            className={`chip ${activeSelection.has(i.symbol) ? "chip-active" : ""}`}
            onClick={() => toggle(i.symbol)}
          >
            {i.symbol.replace(".NS", "")}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty-state-card">
          <p className="empty-state-title">Select stocks to compare</p>
          <p className="empty-state-body">Pick at least one stock above to see its numbers.</p>
        </div>
      ) : (
        <div className="compare-scroll">
          <table className="compare-table compare-table-transposed">
            <thead>
              <tr>
                <th></th>
                {shown.map((i) => (
                  <th key={i.symbol} className="clickable-row" onClick={() => onOpen(i.symbol)}>
                    <div className="compare-name">{i.name}</div>
                    <div className="compare-symbol">{i.symbol.replace(".NS", "")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="compare-row-label">{row.label}</td>
                  {shown.map((i) => (
                    <td key={i.symbol}>{row.render(i)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
