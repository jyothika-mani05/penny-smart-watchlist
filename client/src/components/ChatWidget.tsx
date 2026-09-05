import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { ChatTurn } from "../types";
import { RobotIcon, type RobotState } from "./RobotIcon";

const IDLE_MS = 30_000;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [idleTick, setIdleTick] = useState(0);
  const lastActivity = useRef(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chatStatus().then((s) => setConfigured(s.configured)).catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setIdleTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, busy]);

  function poke() {
    lastActivity.current = Date.now();
  }

  const isIdle = idleTick >= 0 && Date.now() - lastActivity.current >= IDLE_MS;
  const botState: RobotState = busy ? "thinking" : isIdle ? "sleeping" : "awake";

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    poke();
    const next = [...history, { role: "user" as const, text }];
    setHistory(next);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await api.sendChatMessage(next);
      setHistory([...next, { role: "model" as const, text: reply }]);
    } catch (err) {
      setHistory([...next, { role: "model" as const, text: `Error: ${(err as Error).message}` }]);
    } finally {
      setBusy(false);
      poke();
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-panel-title">
              <RobotIcon state={botState} size={40} />
              <div>
                <span className="chat-panel-name">Penny</span>
                <span className="chat-panel-subtitle">Stock market help</span>
              </div>
            </div>
            <button
              className="chat-close"
              onClick={() => {
                poke();
                setOpen(false);
              }}
            >
              ×
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef} onClick={poke}>
            {configured === false && (
              <div className="chat-row">
                <RobotIcon state="awake" size={28} />
                <div className="chat-bubble chat-bubble-model chat-bubble-warning">
                  Hi, I'm Penny — but I'm not configured yet. Set <code>GEMINI_API_KEY</code> in{" "}
                  <code>server/.env</code> and restart the server. Get a free key at{" "}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                    aistudio.google.com
                  </a>
                  .
                </div>
              </div>
            )}
            {history.length === 0 && configured && (
              <div className="chat-row">
                <RobotIcon state="awake" size={28} />
                <div className="chat-bubble chat-bubble-model">
                  Hi, I'm Penny. Ask me anything about how stock markets work — terms, how to
                  read the numbers in this app, general investing concepts. I can't recommend
                  specific stocks or give personalized investment advice.
                </div>
              </div>
            )}
            {history.map((turn, i) =>
              turn.role === "user" ? (
                <div key={i} className="chat-bubble chat-bubble-user">
                  {turn.text}
                </div>
              ) : (
                <div key={i} className="chat-row">
                  <RobotIcon state="awake" size={28} />
                  <div className="chat-bubble chat-bubble-model">{turn.text}</div>
                </div>
              )
            )}
            {busy && (
              <div className="chat-row">
                <RobotIcon state="thinking" size={28} />
                <div className="chat-bubble chat-bubble-model chat-typing">Penny is thinking...</div>
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              placeholder={configured ? "Ask a stock market question..." : "Chat not configured"}
              value={input}
              disabled={!configured || busy}
              onChange={(e) => {
                poke();
                setInput(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && send()}
              onFocus={poke}
            />
            <button className="chat-send-btn" onClick={send} disabled={!configured || busy}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        className={`chat-fab ${botState === "sleeping" ? "chat-fab-sleeping" : ""}`}
        onClick={() => {
          poke();
          setOpen((o) => !o);
        }}
        title="Penny — stock market help"
      >
        {open ? <span className="chat-fab-close">×</span> : <RobotIcon state={botState} size={64} />}
      </button>
    </div>
  );
}
