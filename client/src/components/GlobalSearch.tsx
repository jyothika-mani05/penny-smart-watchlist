import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { api } from "../api";
import type { SymbolInfo } from "../types";

export function GlobalSearch({
  onSelectSymbol,
  onQuickAdd,
  canAdd,
}: {
  onSelectSymbol: (symbol: string) => void;
  onQuickAdd: (symbol: string) => void;
  canAdd: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolInfo[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .searchSymbols(query)
        .then((r) => {
          if (!cancelled) {
            setResults(r);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) setError((err as Error).message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectAndClose(symbol: string) {
    onSelectSymbol(symbol);
    setOpen(false);
    setQuery("");
    setResults(null);
  }

  return (
    <div className="global-search" ref={wrapRef}>
      <MagnifyingGlass className="global-search-icon" size={16} weight="regular" aria-hidden="true" />

      <input
        value={query}
        placeholder="Search stocks, e.g. RELIANCE"
        aria-label="Search stocks"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />

      {open && query.trim() && (
        <div className="global-search-menu">
          {loading && <p className="global-search-status">Searching...</p>}
          {!loading && error && <p className="global-search-status">Couldn't search right now.</p>}
          {!loading && !error && results && results.length === 0 && (
            <p className="global-search-status">No matches for "{query}"</p>
          )}
          {!loading &&
            !error &&
            results?.map((s) => (
              <div key={s.symbol} className="global-search-row">
                <button className="global-search-row-main" onClick={() => selectAndClose(s.symbol)}>
                  <span className="symbol-name">{s.name}</span>
                  <span className="symbol-sector">
                    {s.symbol.replace(".NS", "")} · NSE
                  </span>
                </button>
                {canAdd && (
                  <button
                    className="global-search-add"
                    disabled={added.has(s.symbol)}
                    onClick={() => {
                      onQuickAdd(s.symbol);
                      setAdded((prev) => new Set(prev).add(s.symbol));
                    }}
                  >
                    {added.has(s.symbol) ? (
                      "Added"
                    ) : (
                      <>
                        <Plus size={12} weight="bold" aria-hidden="true" /> Add
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
