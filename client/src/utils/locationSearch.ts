const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 5 * 60 * 1000;

let lastRequestTime = 0;
let pendingRequest: AbortController | null = null;

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();

export interface SearchResult {
  displayName: string;
  lat: number;
  lng: number;
  area: string;
  type: string;
}

function extractArea(address: Record<string, string>): string {
  return (
    address.suburb ||
    address.neighbourhood ||
    address.town ||
    address.city ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  );
}

function getCached(query: string): SearchResult[] | null {
  const entry = searchCache.get(query);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.results;
  searchCache.delete(query);
  return null;
}

function setCache(query: string, results: SearchResult[]) {
  if (searchCache.size >= 100) {
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(query, { results, timestamp: Date.now() });
}

async function rateLimitedFetch(url: string, init: RequestInit): Promise<Response> {
  const now = Date.now();
  const waitMs = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestTime));
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
  lastRequestTime = Date.now();
  return fetch(url, init);
}

export async function searchLocation(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  const cached = getCached(query);
  if (cached) return cached;

  if (pendingRequest) {
    pendingRequest.abort();
    pendingRequest = null;
  }

  const controller = new AbortController();
  pendingRequest = controller;
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const params = new URLSearchParams({
      format: "json",
      q: query,
      limit: "7",
      addressdetails: "1",
      "accept-language": "en",
    });

    const res = await rateLimitedFetch(`${NOMINATIM_URL}/search?${params}`, {
      signal: combinedSignal,
      headers: {
        "User-Agent": "GlowUpOS/1.0 (beauty-marketplace-app)",
        Referer: typeof window !== "undefined" ? window.location.origin : "",
      },
    });

    if (!res.ok) throw new Error("Search failed");

    const data = await res.json();

    const results: SearchResult[] = (data as Array<Record<string, unknown>>).map((item) => ({
      displayName: String(item.display_name ?? ""),
      lat: parseFloat(String(item.lat ?? "0")),
      lng: parseFloat(String(item.lon ?? "0")),
      area: extractArea((item.address ?? {}) as Record<string, string>) || String(item.name ?? "") || query,
      type: String(item.type ?? "unknown"),
    }));

    setCache(query, results);
    return results;
  } finally {
    if (pendingRequest === controller) {
      pendingRequest = null;
    }
  }
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await rateLimitedFetch(
    `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}`,
    {
      headers: {
        "User-Agent": "GlowUpOS/1.0 (beauty-marketplace-app)",
        Referer: typeof window !== "undefined" ? window.location.origin : "",
      },
    },
  );

  if (!res.ok) throw new Error("Reverse geocode failed");

  const data = (await res.json()) as { address?: Record<string, string> };
  return (
    data.address?.suburb ||
    data.address?.neighbourhood ||
    data.address?.town ||
    data.address?.city ||
    "My location"
  );
}
