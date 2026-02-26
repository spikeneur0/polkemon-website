import { db } from "@/lib/db";

const API_BASE = "https://api.justtcg.com/v1";

const RATE_LIMITS = {
  perMinute: 10,
  perDay: 100,
  perMonth: 1000,
};

// In-memory per-minute tracking (resets across serverless invocations, but good enough for burst protection)
let minuteCallCount = 0;
let minuteResetTime = Date.now() + 60_000;

export interface JustTcgCardVariant {
  condition: string;
  printing: string;
  price: number | null;
  lastUpdated: number | null;
}

export interface JustTcgCard {
  id: string;
  name: string;
  tcgplayerId: string | null;
  game: string;
  set: string;
  rarity?: string;
  imageUrl?: string;
  variants: JustTcgCardVariant[];
}

export interface JustTcgSearchResult {
  data: JustTcgCard[];
  meta: {
    api_calls_used: number;
    api_calls_remaining: number;
  };
}

function getApiKey(): string {
  const key = process.env.JUSTTCG_API_KEY;
  if (!key) throw new Error("JUSTTCG_API_KEY environment variable is not set");
  return key;
}

async function checkAndRecordUsage(): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();

  let usage = await db.marketPriceApiUsage.findUnique({ where: { id: "default" } });
  if (!usage) {
    usage = await db.marketPriceApiUsage.create({
      data: {
        id: "default",
        dailyCalls: 0,
        monthlyCalls: 0,
        dailyResetAt: startOfTomorrow(),
        monthlyResetAt: startOfNextMonth(),
      },
    });
  }

  // Reset daily counter if past reset time
  if (now >= usage.dailyResetAt) {
    usage = await db.marketPriceApiUsage.update({
      where: { id: "default" },
      data: { dailyCalls: 0, dailyResetAt: startOfTomorrow() },
    });
  }

  // Reset monthly counter if past reset time
  if (now >= usage.monthlyResetAt) {
    usage = await db.marketPriceApiUsage.update({
      where: { id: "default" },
      data: { monthlyCalls: 0, monthlyResetAt: startOfNextMonth() },
    });
  }

  // Check per-minute (in-memory)
  if (Date.now() > minuteResetTime) {
    minuteCallCount = 0;
    minuteResetTime = Date.now() + 60_000;
  }
  if (minuteCallCount >= RATE_LIMITS.perMinute) {
    return { allowed: false, reason: "Per-minute rate limit reached (10/min)" };
  }

  if (usage.dailyCalls >= RATE_LIMITS.perDay) {
    return { allowed: false, reason: "Daily rate limit reached (100/day)" };
  }

  if (usage.monthlyCalls >= RATE_LIMITS.perMonth) {
    return { allowed: false, reason: "Monthly rate limit reached (1000/month)" };
  }

  // Record the call
  minuteCallCount++;
  await db.marketPriceApiUsage.update({
    where: { id: "default" },
    data: {
      dailyCalls: { increment: 1 },
      monthlyCalls: { increment: 1 },
    },
  });

  return { allowed: true };
}

async function updateRemainingFromMeta(remaining: number) {
  await db.marketPriceApiUsage.update({
    where: { id: "default" },
    data: { lastApiCallsRemaining: remaining },
  });
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      if (attempt < retries - 1) {
        await sleep(60_000); // Back off 60s on rate limit
        continue;
      }
    }

    return res;
  }

  throw new Error("Max retries exceeded");
}

export async function searchCards(query: string): Promise<JustTcgSearchResult> {
  const { allowed, reason } = await checkAndRecordUsage();
  if (!allowed) {
    console.warn(`JustTCG rate limit: ${reason}`);
    return { data: [], meta: { api_calls_used: 0, api_calls_remaining: 0 } };
  }

  const res = await fetchWithRetry(
    `${API_BASE}/cards?q=${encodeURIComponent(query)}`,
    {
      headers: { "x-api-key": getApiKey() },
    }
  );

  if (!res.ok) {
    console.error(`JustTCG search failed: ${res.status} ${res.statusText}`);
    return { data: [], meta: { api_calls_used: 0, api_calls_remaining: 0 } };
  }

  const json = await res.json();

  if (json.meta?.api_calls_remaining != null) {
    await updateRemainingFromMeta(json.meta.api_calls_remaining);
  }

  return json;
}

export async function getCardPrice(
  tcgplayerId: string,
  condition: string,
  printing: string
): Promise<{ priceCents: number | null; card: JustTcgCard | null; meta: { api_calls_remaining: number } }> {
  const { allowed, reason } = await checkAndRecordUsage();
  if (!allowed) {
    console.warn(`JustTCG rate limit: ${reason}`);
    return { priceCents: null, card: null, meta: { api_calls_remaining: 0 } };
  }

  const params = new URLSearchParams({
    tcgplayerId,
    condition,
    printing,
  });

  const res = await fetchWithRetry(
    `${API_BASE}/cards?${params.toString()}`,
    {
      headers: { "x-api-key": getApiKey() },
    }
  );

  if (!res.ok) {
    console.error(`JustTCG price fetch failed: ${res.status}`);
    return { priceCents: null, card: null, meta: { api_calls_remaining: 0 } };
  }

  const json = await res.json();

  if (json.meta?.api_calls_remaining != null) {
    await updateRemainingFromMeta(json.meta.api_calls_remaining);
  }

  const card: JustTcgCard | undefined = json.data?.[0];
  if (!card) {
    return { priceCents: null, card: null, meta: json.meta || { api_calls_remaining: 0 } };
  }

  const variant = card.variants?.find(
    (v: JustTcgCardVariant) => v.condition === condition && v.printing === printing
  );

  const priceCents = variant?.price != null ? Math.round(variant.price * 100) : null;

  return { priceCents, card, meta: json.meta || { api_calls_remaining: 0 } };
}

export interface BulkPriceRequest {
  tcgplayerId: string;
  condition: string;
  printing: string;
}

export interface BulkPriceResult {
  prices: Map<string, number | null>; // tcgplayerId -> price in cents
  apiCallsUsed: number;
}

export async function bulkGetPrices(cards: BulkPriceRequest[]): Promise<BulkPriceResult> {
  const { allowed, reason } = await checkAndRecordUsage();
  if (!allowed) {
    console.warn(`JustTCG rate limit: ${reason}`);
    return { prices: new Map(), apiCallsUsed: 0 };
  }

  const res = await fetchWithRetry(
    `${API_BASE}/cards`,
    {
      method: "POST",
      headers: {
        "x-api-key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cards }),
    }
  );

  if (!res.ok) {
    console.error(`JustTCG bulk fetch failed: ${res.status}`);
    return { prices: new Map(), apiCallsUsed: 0 };
  }

  const json = await res.json();

  if (json.meta?.api_calls_remaining != null) {
    await updateRemainingFromMeta(json.meta.api_calls_remaining);
  }

  const prices = new Map<string, number | null>();

  for (const card of json.data || []) {
    const tcgId = card.tcgplayerId;
    if (!tcgId) continue;

    // Find the matching request to get the condition/printing we need
    const request = cards.find((c) => c.tcgplayerId === tcgId);
    if (!request) continue;

    const variant = card.variants?.find(
      (v: JustTcgCardVariant) =>
        v.condition === request.condition && v.printing === request.printing
    );

    prices.set(tcgId, variant?.price != null ? Math.round(variant.price * 100) : null);
  }

  return { prices, apiCallsUsed: 1 };
}

export async function getApiUsage() {
  let usage = await db.marketPriceApiUsage.findUnique({ where: { id: "default" } });
  if (!usage) {
    usage = await db.marketPriceApiUsage.create({
      data: {
        id: "default",
        dailyCalls: 0,
        monthlyCalls: 0,
        dailyResetAt: startOfTomorrow(),
        monthlyResetAt: startOfNextMonth(),
      },
    });
  }

  const now = new Date();
  // Return fresh data if counters need reset
  return {
    dailyCalls: now >= usage.dailyResetAt ? 0 : usage.dailyCalls,
    monthlyCalls: now >= usage.monthlyResetAt ? 0 : usage.monthlyCalls,
    dailyLimit: RATE_LIMITS.perDay,
    monthlyLimit: RATE_LIMITS.perMonth,
    lastApiCallsRemaining: usage.lastApiCallsRemaining,
  };
}

// Helpers

function startOfTomorrow(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function startOfNextMonth(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
