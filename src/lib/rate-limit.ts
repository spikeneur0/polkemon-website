/**
 * In-memory rate limiter for serverless environments.
 * Tracks request counts by key (typically IP address) with configurable limits and windows.
 * Includes automatic cleanup of expired entries every 5 minutes.
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Block duration in milliseconds after limit is exceeded (defaults to windowMs) */
  blockDurationMs?: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup interval — purge expired entries every 5 minutes
let cleanupStarted = false;
function startCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        const expired =
          now - entry.firstRequest > 30 * 60 * 1000 && // 30 min since first request
          (!entry.blockedUntil || now > entry.blockedUntil);
        if (expired) {
          store.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  startCleanup();
  return stores.get(name)!;
}

export function createRateLimiter(name: string, config: RateLimitConfig) {
  const store = getStore(name);

  return {
    /**
     * Check if a key (IP) is rate limited.
     * Returns { limited: false } if allowed, or { limited: true, retryAfterSeconds } if blocked.
     */
    check(key: string): { limited: boolean; retryAfterSeconds?: number } {
      const now = Date.now();
      const entry = store.get(key);

      // Check if currently blocked
      if (entry?.blockedUntil && now < entry.blockedUntil) {
        const retryAfterSeconds = Math.ceil(
          (entry.blockedUntil - now) / 1000
        );
        return { limited: true, retryAfterSeconds };
      }

      // If no entry or window has expired, start fresh
      if (!entry || now - entry.firstRequest > config.windowMs) {
        store.set(key, { count: 1, firstRequest: now });
        return { limited: false };
      }

      // Increment count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        entry.blockedUntil =
          now + (config.blockDurationMs ?? config.windowMs);
        const retryAfterSeconds = Math.ceil(
          (entry.blockedUntil - now) / 1000
        );
        return { limited: true, retryAfterSeconds };
      }

      return { limited: false };
    },

    /** Reset the counter for a key (e.g., on successful login) */
    reset(key: string) {
      store.delete(key);
    },
  };
}

// --- Pre-configured rate limiters ---

/** Login: 5 attempts per 15 minutes, blocks for 15 minutes */
export const loginLimiter = createRateLimiter("login", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
});

/** Newsletter subscribe: 3 per hour */
export const subscribeLimiter = createRateLimiter("subscribe", {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
});

/** Contact form: 5 per hour */
export const contactLimiter = createRateLimiter("contact", {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
});

/** Promo code validation: 10 per minute */
export const promoLimiter = createRateLimiter("promo", {
  maxRequests: 10,
  windowMs: 60 * 1000,
});

/**
 * Extract client IP from request headers.
 * Works with Vercel (x-forwarded-for) and direct connections.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
