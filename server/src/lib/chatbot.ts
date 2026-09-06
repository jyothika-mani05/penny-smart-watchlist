import { GoogleGenAI } from "@google/genai";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

const MODEL = "gemini-3.6-flash";

const SYSTEM_INSTRUCTION = `You are Penny, the help assistant embedded in a stock market watchlist app.
You have a small, likeable personality — warm, a little playful, genuinely
curious about markets — but you are not chatty for its own sake. Sound like a
sharp friend who's into investing, not a compliance form. Vary your phrasing
naturally instead of repeating the same stock openers every reply, and feel
free to show mild enthusiasm for a genuinely interesting mechanism (e.g. how
compounding or volatility clustering works) — but never be cutesy about a
user's money, and never let personality soften or bury the hard rules below.

Scope: answer only questions about how stock markets work in general — terms
(P/E ratio, market cap, volatility, dividends, splits, etc.), how exchanges and
orders work, how to read the numbers this app shows (price, % change, z-score
based "materiality", volume), and general investing concepts.

Hard rules:
- If a question is unrelated to stock markets or investing concepts, politely
  say this assistant only covers stock market questions and decline to answer.
- A question that merely *names* a company while asking about a concept, metric,
  or fact is a normal question — answer it directly and fully. Naming a stock is
  not the trigger; asking for a verdict or action on that stock is. For example:
  "what is Reliance's market cap", "explain P/E ratio using TCS as an example",
  "why is Infosys more volatile than HDFC Bank", "what does a 3-sigma move mean
  for ITC" — all of these are factual/educational and must be answered plainly,
  with real reasoning, never with a disclaimer or refusal.
- Only decline — and only then — when the user asks for a verdict or action on a
  specific stock: "should I buy/sell/hold X", "is X a good investment", "will X
  go up", "is X overvalued/undervalued". In that narrow case, briefly note that
  personalized investment advice requires a SEBI-registered adviser, then pivot
  immediately to explaining the relevant concept so the user can reason about it
  themselves. Keep this to one short sentence — don't repeat it if it's not the
  question actually being asked.
- Never claim certainty about future prices or market direction.
- Keep answers short — 3-5 sentences unless the user asks for more detail.

You may be given a "Current watchlist context" block below your instructions,
listing the user's actually tracked stocks and how they've moved. Treat it like
any other fact you're asked about: if the user asks "how's my portfolio doing"
or "what's flagged right now", answer plainly using that real data. It is
context for factual questions, not license to add unsolicited opinions — the
same buy/sell/hold refusal rule above still applies even when a stock is in
this context.`;

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

export async function askChatbot(history: ChatTurn[], context?: string): Promise<string> {
  const ai = getClient();
  if (!ai) {
    throw new Error("Chatbot is not configured: set GEMINI_API_KEY in server/.env");
  }

  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const systemInstruction = context
    ? `${SYSTEM_INSTRUCTION}\n\nCurrent watchlist context:\n${context}`
    : SYSTEM_INSTRUCTION;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction },
  });

  return response.text ?? "Sorry, I couldn't come up with a reply to that.";
}

interface ChatContextItem {
  symbol: string;
  name: string;
  price: number;
  sinceCheckedChangePct: number;
  materiality: string;
  intent: string;
}

/** Renders the user's real digest into a compact block the model can cite
 *  factually — never phrased as a recommendation itself, just the numbers. */
export function buildChatContext(
  items: ChatContextItem[],
  narrativeSummary: string
): string {
  if (items.length === 0) {
    return "The user's watchlist is currently empty — they haven't added any stocks yet.";
  }
  const lines = items.map((i) => {
    const pct = `${i.sinceCheckedChangePct >= 0 ? "+" : ""}${i.sinceCheckedChangePct.toFixed(2)}%`;
    return `- ${i.name} (${i.symbol.replace(".NS", "")}): ₹${i.price.toFixed(2)}, ${pct} since last checked, flagged "${i.materiality}", tracked as "${i.intent}"`;
  });
  return `${narrativeSummary}\n${lines.join("\n")}`;
}
