import { useEffect, useState } from "react";
import { RobotIcon } from "./RobotIcon";

const HOLD_MS = 1400;
const EXIT_MS = 380;

export function LoginWelcome({ name, onDone }: { name: string; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setLeaving(true), HOLD_MS);
    return () => clearTimeout(holdTimer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const exitTimer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [leaving, onDone]);

  return (
    <div className="login-gate">
      <div className={`login-card ${leaving ? "login-card-leaving" : ""}`}>
        <div className="login-welcome-row">
          <RobotIcon state="happy" size={48} badge />
          <div className="login-welcome-text">
            <h1>You're in, {name}!</h1>
            <p>Successfully logged in — let's see what changed.</p>
          </div>
        </div>

        <svg className="login-checkmark" viewBox="0 0 64 64" role="img" aria-label="Success">
          <circle cx="32" cy="32" r="26" />
          <path d="M20 33.5 L28 41.5 L45 23" />
        </svg>
      </div>
    </div>
  );
}
