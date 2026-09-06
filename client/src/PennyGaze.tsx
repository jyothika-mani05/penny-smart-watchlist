import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Gaze {
  dx: number;
  dy: number;
}

const GazeContext = createContext<Gaze>({ dx: 0, dy: 0 });

const MAX_OFFSET = 2.2; // small — a glance, not a stare

export function PennyGazeProvider({ children }: { children: ReactNode }) {
  const [gaze, setGaze] = useState<Gaze>({ dx: 0, dy: 0 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const dx = ((e.clientX / window.innerWidth) * 2 - 1) * MAX_OFFSET;
      const dy = ((e.clientY / window.innerHeight) * 2 - 1) * MAX_OFFSET;
      setGaze({ dx, dy });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return <GazeContext.Provider value={gaze}>{children}</GazeContext.Provider>;
}

export function usePennyGaze(): Gaze {
  return useContext(GazeContext);
}
