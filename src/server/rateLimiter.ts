/**
 * Simple in-memory sliding window rate limiter
 */

interface RateLimitRecord {
  timestamps: number[];
}

const clientRecords = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const oneMinuteAgo = Date.now() - 60 * 1000;
  for (const [key, record] of clientRecords.entries()) {
    const valid = record.timestamps.filter((ts) => ts > oneMinuteAgo);
    if (valid.length === 0) {
      clientRecords.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}, 30 * 1000);

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = clientRecords.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    clientRecords.set(identifier, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(retryAfter, 1),
    };
  }

  record.timestamps.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
}
