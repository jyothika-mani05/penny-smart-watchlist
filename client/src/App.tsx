import { useEffect, useState } from "react";
import { api, clearStoredUser, getStoredUser } from "./api";
import type { User } from "./types";
import { Landing } from "./components/Landing";
import { LoginGate } from "./components/LoginGate";
import { LoginWelcome } from "./components/LoginWelcome";
import { Dashboard } from "./components/Dashboard";
import { PennyGazeProvider } from "./PennyGaze";

type AuthState =
  | { status: "checking" }
  | { status: "landing" }
  | { status: "anonymous" }
  | { status: "welcome"; user: User }
  | { status: "authenticated"; user: User };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setAuth({ status: "landing" });
      return;
    }
    // The stored id might refer to a user that no longer exists (e.g. a reset
    // dev database) — validate it rather than trusting localStorage blindly.
    api
      .validateStoredUser(stored.id)
      .then((user) => setAuth({ status: "authenticated", user }))
      .catch(() => {
        clearStoredUser();
        setAuth({ status: "landing" });
      });
  }, []);

  if (auth.status === "checking") return null;

  return (
    <PennyGazeProvider>
      {auth.status === "landing" && (
        <Landing onEnter={() => setAuth({ status: "anonymous" })} />
      )}

      {auth.status === "anonymous" && (
        <LoginGate onLogin={(user) => setAuth({ status: "welcome", user })} />
      )}

      {auth.status === "welcome" && (
        <LoginWelcome
          name={auth.user.name}
          onDone={() => setAuth({ status: "authenticated", user: auth.user })}
        />
      )}

      {auth.status === "authenticated" && (
        <Dashboard
          user={auth.user}
          onSwitchUser={() => {
            clearStoredUser();
            setAuth({ status: "landing" });
          }}
        />
      )}
    </PennyGazeProvider>
  );
}
