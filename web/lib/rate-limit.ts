// Per-instance in-memory sliding-window rate limiter for public endpoints.
//
// Serverless platforms scale horizontally, so each instance enforces its own
// budget — this is defense-in-depth against single-instance bursts (a client
// slamming one warm instance), not a hard global limit. A true cross-instance
// limit requires an external service (Upstash, Cloudflare, etc.) — see
// SECURITY.md.
//
// Keyed by client IP (x-forwarded-for, set by the hosting proxy). Default
// budget: 120 requests / 60s per IP, tunable via PUBLIC_RATE_LIMIT_MAX.

const WINDOW_MS = 60_000
const DEFAULT_MAX = Number(process.env.PUBLIC_RATE_LIMIT_MAX ?? 120)

const hits = new Map<string, number[]>()

export function isRateLimited(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const now = Date.now()
  const window = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (window.length >= DEFAULT_MAX) {
    hits.set(ip, window)
    return true
  }
  window.push(now)
  hits.set(ip, window)
  return false
}
