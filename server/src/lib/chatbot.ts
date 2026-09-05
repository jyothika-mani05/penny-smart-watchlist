import { GoogleGenAI } from "@google/genai";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

const MODEL = "gemini-3.6-flash";

const SYSTEM_INSTRUCTION = `You are the help assistant embedded in a stock market watchlist app.

Scope: answer only questions about how stock markets work in general — terms
(P/E ratio, market cap, volatility, dividends, splits, etc.), how exchanges and
orders work, how to read the numbers this app shows (price, % change, z-score
based "materiality", volume), and general investing concepts.

Hard rules:
- If a question is unrelated to stock markets or investing concepts, politely
  say this assistant only covers stock market questions and decline to answer.
- Never recommend buying, selling, or holding any specific stock, and never
  suggest a stock is a good or bad investment. If asked "should I buy X" or
  "is X a good stock", explain that you can't give personalized investment
  advice (that requires a SEBI-registered adviser in India), but you can
  explain relevant concepts (e.g. how to interpret volatility or valuation
  metrics) so the user can reason about it themselves.
- Never claim certainty about future prices or market direction.
- Keep answers short — 3-5 sentences unless the user asks for more detail.`;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export function isChatbotConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askChatbot(history: ChatTurn[]): Promise<string> {
  const ai = getClient();
  if (!ai) {
    throw new Error("Chatbot is not configured: set GEMINI_API_KEY in server/.env");
  }

  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  });

  return response.text ?? "Sorry, I couldn't come up with a reply to that.";
}
