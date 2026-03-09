/**
 * Timing-safe string comparison (prevents timing attacks on API key).
 * Constant-time: always compares full length regardless of mismatch position.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare b against itself to keep constant time, but return false
    b = a;
    var result = 1; // will force false
  } else {
    var result = 0;
  }
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** UUID v4 format validator */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(s: string): boolean {
  return UUID_RE.test(s);
}

/** Strip HTML tags to prevent stored XSS */
export function sanitize(s: unknown): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/[<>]/g, "")   // strip angle brackets
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 1000);        // max 1000 chars per field
}

/** Sanitize an array of strings */
export function sanitizeArray(arr: unknown): string[] | null {
  if (!Array.isArray(arr)) return null;
  return arr
    .filter((item): item is string => typeof item === "string")
    .map(sanitize)
    .slice(0, 50); // max 50 items
}

/** Security headers for all responses */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

/** Max request body size in bytes (64KB) */
export const MAX_BODY_SIZE = 64 * 1024;

/**
 * Simple in-memory rate limiter for serverless.
 * Uses sliding window per IP. Resets on cold start (acceptable for serverless).
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  windowMs = 60_000,
  maxRequests = 30
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const key = ip;
  const entry = rateLimitMap.get(key);

  // Cleanup old entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetAt < now) rateLimitMap.delete(k);
    });
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfter: 0 };
}
