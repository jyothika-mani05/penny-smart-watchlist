import { useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="info-tooltip-wrap">
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label="What does this mean?"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ?
      </button>
      {open && <span className="info-tooltip-bubble">{text}</span>}
    </span>
  );
}
