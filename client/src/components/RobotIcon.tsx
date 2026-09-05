export type RobotState = "awake" | "thinking" | "sleeping" | "concerned" | "happy";

/** Penny's icon is deliberately white line-art with no fill of its own — that
 *  only stays visible sitting on the dark chat panel/FAB. Every other context
 *  (light panels, cards, modals) needs `badge` so a dark plate renders behind
 *  her, or she's invisible against a light background. */
export function RobotIcon({
  state,
  size = 44,
  badge = false,
}: {
  state: RobotState;
  size?: number;
  badge?: boolean;
}) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      className={`robot-icon robot-${state}`}
      role="img"
      aria-label={`Penny is ${state}`}
    >
      {/* antenna */}
      <line x1="50" y1="10" x2="50" y2="22" className="robot-antenna-stem" />
      <circle cx="50" cy="7" r="5" className="robot-antenna-dot" />

      {/* ears */}
      <rect x="10" y="42" width="8" height="20" rx="3" className="robot-part" />
      <rect x="82" y="42" width="8" height="20" rx="3" className="robot-part" />

      {/* head */}
      <rect x="20" y="24" width="60" height="56" rx="18" className="robot-part robot-head" />

      {/* speech-bubble tail */}
      <path d="M38 80 L38 94 L54 80 Z" className="robot-part" />

      {/* eyes */}
      {state === "sleeping" ? (
        <>
          <path d="M33 52 q6 6 12 0" className="robot-eye-line" />
          <path d="M55 52 q6 6 12 0" className="robot-eye-line" />
        </>
      ) : state === "happy" ? (
        <>
          <path d="M33 54 q6 -7 12 0" className="robot-eye-line robot-eye-happy" />
          <path d="M55 54 q6 -7 12 0" className="robot-eye-line robot-eye-happy" />
        </>
      ) : (
        <>
          <circle cx="39" cy="51" r="6" className="robot-eye" style={{ animationDelay: "0s" }} />
          <circle cx="61" cy="51" r="6" className="robot-eye" style={{ animationDelay: "0.08s" }} />
        </>
      )}

      {/* mouth */}
      {state === "thinking" ? (
        <g className="robot-mouth-thinking">
          <circle cx="42" cy="67" r="3" className="robot-dot" style={{ animationDelay: "0s" }} />
          <circle cx="50" cy="67" r="3" className="robot-dot" style={{ animationDelay: "0.15s" }} />
          <circle cx="58" cy="67" r="3" className="robot-dot" style={{ animationDelay: "0.3s" }} />
        </g>
      ) : state === "sleeping" ? (
        <line x1="44" y1="68" x2="56" y2="68" className="robot-eye-line" />
      ) : state === "concerned" ? (
        <circle cx="50" cy="66" r="4.5" className="robot-mouth-o" />
      ) : state === "happy" ? (
        <path d="M35 61 q15 17 30 0" className="robot-mouth" />
      ) : (
        <path d="M40 64 q10 10 20 0" className="robot-mouth" />
      )}

      {/* zzz while sleeping */}
      {state === "sleeping" && (
        <g className="robot-zzz">
          <text x="66" y="30" className="robot-z robot-z1">
            z
          </text>
          <text x="74" y="20" className="robot-z robot-z2">
            Z
          </text>
          <text x="83" y="10" className="robot-z robot-z3">
            Z
          </text>
        </g>
      )}

      {/* sparkles while happy */}
      {state === "happy" && (
        <g className="robot-sparkles">
          <text x="68" y="26" className="robot-sparkle robot-sparkle-1">
            ✦
          </text>
          <text x="14" y="30" className="robot-sparkle robot-sparkle-2">
            ✦
          </text>
          <text x="78" y="55" className="robot-sparkle robot-sparkle-3">
            ✦
          </text>
        </g>
      )}
    </svg>
  );

  return badge ? <span className="robot-badge">{svg}</span> : svg;
}
