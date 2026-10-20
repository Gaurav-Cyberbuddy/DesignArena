type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

const LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 8 },
  vote: { windowMs: 10 * 60 * 1000, max: 20 },
  submit: { windowMs: 30 * 60 * 1000, max: 12 },
  admin: { windowMs: 5 * 60 * 1000, max: 60 },
} as const;

export type RateLimitAction = keyof typeof LIMITS;

/**
 * In-memory limiter for a single Node/Vercel isolate.
 * Duplicate votes are still prevented by PostgreSQL UNIQUE constraints.
 */
export function rateLimit(action: RateLimitAction, key: string): {
  ok: boolean;
  retryAfterSec: number;
} {
  const spec = LIMITS[action];
  const now = Date.now();
  const mapKey = `${action}:${key}`;
  const bucket = buckets.get(mapKey) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < spec.windowMs);

  if (bucket.timestamps.length >= spec.max) {
    const oldest = bucket.timestamps[0] ?? now;
    buckets.set(mapKey, bucket);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((spec.windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(mapKey, bucket);
  return { ok: true, retryAfterSec: 0 };
}

export function clientKey(headers: Headers, userId?: string | null) {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return userId ? `${userId}:${ip}` : ip;
}
