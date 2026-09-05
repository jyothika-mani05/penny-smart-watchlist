import { useEffect, useRef } from "react";

const DURATION_MS = 10_000;

export function UndoToast({
  message,
  onUndo,
  onExpire,
}: {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
}) {
  // Keep the latest callback without restarting the timer if the parent re-renders.
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const timer = setTimeout(() => expireRef.current(), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="undo-toast">
      <div className="undo-toast-row">
        <span className="undo-message">{message}</span>
        <button className="undo-btn" onClick={onUndo}>
          Undo
        </button>
      </div>
      <div className="undo-progress-track">
        <div className="undo-progress-fill" style={{ animationDuration: `${DURATION_MS}ms` }} />
      </div>
    </div>
  );
}
