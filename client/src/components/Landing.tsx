import { useRef } from "react";
import { Buildings, ChartBar, ChartLineUp, ChatCircleDots, Compass, Tray } from "@phosphor-icons/react";
import { RobotIcon } from "./RobotIcon";

const FEATURES = [
  {
    icon: Tray,
    title: "Personal baseline",
    body: "Every number is a delta from when you personally last looked — not just today vs. yesterday.",
  },
  {
    icon: ChartLineUp,
    title: "Is this normal for this stock?",
    body: "Moves are flagged relative to that stock's own volatility, not a flat percentage rule for everyone.",
  },
  {
    icon: ChartBar,
    title: "Compare, don't recommend",
    body: "Facts ranked by how much attention they deserve right now. Never a buy/sell call — that's regulated territory.",
  },
  {
    icon: Compass,
    title: "One sentence, not a wall of numbers",
    body: "A portfolio-level summary tells you if a dip is market-wide or actually about your stock.",
  },
  {
    icon: Buildings,
    title: "Verify before you track",
    body: "Real company profiles, ownership breakdowns, and official NSE filing links — before you add a stock.",
  },
  {
    icon: ChatCircleDots,
    title: "Penny, the market assistant",
    body: "Ask about how markets work, anytime. Scoped strictly to concepts — never personalized advice.",
  },
];

const STEPS = [
  { n: "01", title: "Build your list", body: "Search real NSE stocks, add them, and say why you're tracking each one." },
  { n: "02", title: "Go live your life", body: "Come back in a day, a week, whenever — your baseline waits exactly where you left it." },
  { n: "03", title: "See what deserves attention", body: "One digest, sorted by what's actually unusual — not a spreadsheet you have to interpret yourself." },
];

export function Landing({ onEnter }: { onEnter: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty("--mx", mx.toFixed(3));
    el.style.setProperty("--my", my.toFixed(3));
  }

  function handleMouseLeave() {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  }

  return (
    <div className="landing">
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />
      <div className="landing-orb landing-orb-4" />

      <nav className="landing-nav">
        <div className="landing-brand">
          <img src="/logo.png" alt="" className="brand-logo" />
          <span className="brand-name">Penny</span>
          <span className="landing-brand-tagline">A Smart Watchlist</span>
        </div>
        <button className="glass-btn" onClick={onEnter}>
          Log in
        </button>
      </nav>

      <header
        className="landing-hero"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">Not another price ticker</span>
          <h1>
            See what <span className="landing-highlight">actually changed</span> —
            not just today's number.
          </h1>
          <p className="landing-sub">
            A watchlist that remembers when you last checked, tells you which moves are
            genuinely unusual for that stock, and explains why — in one sentence, not a
            spreadsheet.
          </p>
          <div className="landing-cta-row">
            <button className="btn-primary landing-cta" onClick={onEnter}>
              Get started — it's free
            </button>
            <span className="landing-cta-hint">No signup form. Just a name.</span>
          </div>
        </div>

        <div className="landing-hero-scene">
          <div className="tilt-card tilt-layer-1 glass-panel">
            <div className="mock-badge mock-badge-notable">Notable</div>
            <div className="mock-row">
              <span className="mock-name">RELIANCE</span>
              <span className="mock-delta mock-up">▲ 2.1%</span>
            </div>
            <p className="mock-reason">
              Up 2.1% (1.8σ) — more than the market move alone explains.
            </p>
          </div>

          <div className="tilt-card tilt-layer-2 glass-panel mock-chart-card">
            <div className="mock-chart-line" />
            <span className="mock-chart-label">30d trend</span>
          </div>

          <div className="tilt-card tilt-layer-3 glass-panel mock-chat-card">
            <RobotIcon state="awake" size={22} badge />
            <p>Ask me anything about how markets work.</p>
          </div>

          <div className="tilt-card tilt-layer-4 glass-panel mock-stat-card">
            <RobotIcon state="happy" size={20} badge />
            <div>
              <span className="mock-stat-number">2 of 5</span>
              <span className="mock-stat-label">stocks unusual today</span>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-section">
        <h2>Built to answer one question</h2>
        <p className="landing-section-sub">
          "Did anything happen to my stocks while I wasn't looking?" — everything below
          exists to answer that, honestly and without noise.
        </p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-panel feature-card">
              <span className="feature-icon" aria-hidden="true">
                <f.icon size={22} weight="regular" />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <div className="steps-row">
          {STEPS.map((s) => (
            <div key={s.n} className="glass-panel step-card">
              <span className="step-number">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-disclaimer glass-panel">
        <p>
          This app surfaces facts — price behavior, volatility, ownership, official filings
          — and lets you draw your own conclusions. It never recommends buying, selling, or
          holding any specific stock; personalized investment advice requires a
          SEBI-registered adviser.
        </p>
      </section>

      <footer className="landing-footer">
        <button className="btn-primary landing-cta" onClick={onEnter}>
          Get started — it's free
        </button>
        <p className="landing-footer-note">Live prices are simulated on real NSE historical data.</p>
      </footer>
    </div>
  );
}
