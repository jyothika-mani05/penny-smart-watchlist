import type {
  ChatTurn,
  CompanyProfile,
  CompareResponse,
  DigestResponse,
  HistoryResponse,
  RemovedItem,
  Sensitivity,
  SymbolInfo,
  User,
  UserSettings,
  Watchlist,
  WatchlistItem,
} from "./types";

// In dev, Vite proxies "/api" straight to the local server (see vite.config.ts).
// In production the frontend and backend are typically two separate deployed
// hosts, so VITE_API_BASE points at the backend's real URL instead.
const BASE = import.meta.env.VITE_API_BASE ?? "/api";
const STORAGE_KEY = "smart-watchlist-user";

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const user = getStoredUser();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(user ? { "X-User-Id": user.id } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: async (name: string): Promise<User> => {
    const user = await request<User>("/users", { method: "POST", body: JSON.stringify({ name }) });
    setStoredUser(user);
    return user;
  },
  validateStoredUser: (id: string) => request<User>(`/users/${id}`),
  getSettings: (userId: string) => request<UserSettings>(`/users/${userId}/settings`),
  updateSettings: (userId: string, sensitivity: Sensitivity) =>
    request<UserSettings>(`/users/${userId}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ sensitivity }),
    }),

  getWatchlists: () => request<Watchlist[]>("/watchlists"),
  createWatchlist: (name: string) =>
    request<Watchlist>("/watchlists", { method: "POST", body: JSON.stringify({ name }) }),
  renameWatchlist: (id: number, name: string) =>
    request<Watchlist>(`/watchlists/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteWatchlist: (id: number) => request<void>(`/watchlists/${id}`, { method: "DELETE" }),

  getItems: (watchlistId: number) => request<WatchlistItem[]>(`/watchlists/${watchlistId}/items`),
  addItem: (watchlistId: number, symbol: string, intent: string) =>
    request<WatchlistItem>(`/watchlists/${watchlistId}/items`, {
      method: "POST",
      body: JSON.stringify({ symbol, intent }),
    }),
  updateItemIntent: (watchlistId: number, itemId: number, intent: string) =>
    request<WatchlistItem>(`/watchlists/${watchlistId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ intent }),
    }),
  removeItem: (watchlistId: number, itemId: number) =>
    request<void>(`/watchlists/${watchlistId}/items/${itemId}`, { method: "DELETE" }),
  removeItemBySymbol: (watchlistId: number, symbol: string) =>
    request<void>(`/watchlists/${watchlistId}/items/by-symbol/${encodeURIComponent(symbol)}`, {
      method: "DELETE",
    }),

  getDigest: (watchlistId: number) => request<DigestResponse>(`/watchlists/${watchlistId}/digest`),
  getCompare: (watchlistId: number) => request<CompareResponse>(`/watchlists/${watchlistId}/compare`),
  checkpoint: (watchlistId: number, symbol?: string) =>
    request<{ checkpointed: string[] }>(`/watchlists/${watchlistId}/checkpoint`, {
      method: "POST",
      body: JSON.stringify(symbol ? { symbol } : {}),
    }),

  searchSymbols: (q: string) =>
    request<SymbolInfo[]>(`/market/symbols?q=${encodeURIComponent(q)}`),
  getHistory: (symbol: string, days = 30) =>
    request<HistoryResponse>(`/market/history/${encodeURIComponent(symbol)}?days=${days}`),
  getProfile: (symbol: string) =>
    request<CompanyProfile>(`/market/profile/${encodeURIComponent(symbol)}`),
  chatStatus: () => request<{ configured: boolean }>(`/chat/status`),
  getRemovedItems: () => request<RemovedItem[]>(`/removed`),
  sendChatMessage: (history: ChatTurn[], watchlistId?: number | null) =>
    request<{ reply: string }>(`/chat/message`, {
      method: "POST",
      body: JSON.stringify({ history, watchlistId }),
    }),
};
