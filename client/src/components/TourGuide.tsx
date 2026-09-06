import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import type { ViewKey } from "./Sidebar";
import { RobotIcon } from "./RobotIcon";

interface TourStep {
  view?: ViewKey;
  selectors: string[];
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    view: "digest",
    selectors: [".digest-greeting"],
    title: "Hi, I'm Penny!",
    body: "This is your Digest — an inbox, not a spreadsheet. It only shows what's actually changed since you last checked, not every stock, every time.",
  },
  {
    view: "digest",
    selectors: [".item-card", ".empty-state-card"],
    title: "Why a move is flagged",
    body: "Each card explains itself in plain English — how many standard deviations this is from that stock's own normal move, plus volume and market context. Not a flat percentage rule.",
  },
  {
    view: "compare",
    selectors: [".compare-scroll", ".empty-state-card"],
    title: "Compare, don't recommend",
    body: "Pick any of your stocks and see them side by side — price, unusualness, volume, versus the market. Ranked by attention, never by buy or sell.",
  },
  {
    view: "manage",
    selectors: [".compare-scroll", ".empty-state-card"],
    title: "Your Watchlist",
    body: "Add or remove stocks and tag why you're tracking each one — own it, watching for a dip, competitor watch. Penny's explanations adapt to that.",
  },
  {
    view: "removed",
    selectors: [".removed-list", ".empty-state"],
    title: "Removed",
    body: "Stop tracking a stock and it doesn't just vanish — this shows what happened to the price after, purely for your own reflection.",
  },
  {
    selectors: [".global-search"],
    title: "Search any NSE stock",
    body: "Real, searchable NSE-listed companies — add one straight from here.",
  },
  {
    selectors: [".chat-fab"],
    title: "Ask Penny anything",
    body: "A market-education chatbot grounded in your real watchlist. She'll explain concepts and cite your actual numbers — but she'll never tell you what to buy or sell.",
  },
  {
    view: "settings",
    selectors: [".sensitivity-options", ".settings-view"],
    title: "Tune your sensitivity",
    body: "This actually changes the statistical threshold for what counts as unusual — fewer, bigger-deal alerts, or more, earlier ones. That's it — you're all set!",
  },
];

export function TourGuide({
  currentView,
  onNavigate,
  onClose,
}: {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (step.view && step.view !== currentView) onNavigate(step.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    function measure() {
      let el: Element | null = null;
      for (const sel of step.selectors) {
        el = document.querySelector(sel);
        if (el) break;
      }
      setRect(el ? el.getBoundingClientRect() : null);
    }
    const t = setTimeout(measure, 260);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [stepIndex, currentView, step.selectors]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  function next() {
    if (stepIndex >= STEPS.length - 1) {
      onNavigate("digest");
      onClose();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const pad = 10;
  const spotlightStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : { top: -9999, left: -9999, width: 0, height: 0 };

  const bubbleBelow = rect ? rect.bottom + pad * 2 < window.innerHeight - 220 : true;
  const bubbleTop = rect
    ? bubbleBelow
      ? rect.bottom + pad * 2
      : Math.max(16, rect.top - pad * 2 - 210)
    : window.innerHeight / 2 - 100;
  const bubbleLeft = rect
    ? Math.min(Math.max(16, rect.left), window.innerWidth - 340)
    : window.innerWidth / 2 - 160;

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="tour-backdrop" />
      <div className="tour-spotlight" style={spotlightStyle} />

      <div className="tour-bubble" style={{ top: bubbleTop, left: bubbleLeft }}>
        <button className="tour-close" onClick={onClose} aria-label="End tour">
          <X size={16} weight="bold" />
        </button>
        <div className="tour-bubble-head">
          <RobotIcon state="happy" size={32} badge />
          <h3>{step.title}</h3>
        </div>
        <p className="tour-bubble-body">{step.body}</p>
        <div className="tour-bubble-footer">
          <span className="tour-step-count">
            {stepIndex + 1} / {STEPS.length}
          </span>
          <div className="tour-bubble-actions">
            <button className="link-btn" onClick={onClose}>
              Skip tour
            </button>
            {stepIndex > 0 && (
              <button className="btn-secondary btn-small" onClick={back}>
                Back
              </button>
            )}
            <button className="btn-primary btn-small" onClick={next}>
              {stepIndex >= STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
