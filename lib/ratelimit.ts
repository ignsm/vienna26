import { sql } from "drizzle-orm"
import { db, ratelimitEvents } from "@/lib/db"
import { headers } from "next/headers"

/**
 * Postgres-backed sliding-window rate limiter.
 *
 * No external service (Redis/Upstash) — same Neon database that powers the app.
 * Costs 1 SELECT + 1 INSERT per protected action. With CAP on the window query
 * (`limit 1 + count`) and an index on (key, occurred_at), this is fast.
 *
 * Cleanup: a periodic `DELETE FROM ratelimit_events WHERE occurred_at < now() - '1 hour'`
 * should run nightly. For a one-night app this isn't strictly needed — the table
 * stays small.
 *
 * Global caps are also enforced via dedicated counters where appropriate
 * (e.g. total rooms cap).
 */

export type LimitName = "createRoom" | "joinRoom" | "castVote" | "submitDouze" | "saveRealResults"

type Window = { max: number; seconds: number }

const LIMITS: Record<LimitName, Window> = {
  createRoom: { max: 5, seconds: 60 },       // 5 rooms / minute / IP
  joinRoom: { max: 20, seconds: 60 },        // 20 join attempts / minute / IP
  castVote: { max: 120, seconds: 60 },       // 120 votes / minute / voter (way over normal usage)
  submitDouze: { max: 10, seconds: 60 },     // 10 submissions / minute / voter
  saveRealResults: { max: 20, seconds: 60 }, // 20 admin saves / minute / host
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return h.get("x-real-ip") ?? "anon"
}

/**
 * Throws Error("RATE_LIMITED") when the calling principal has exceeded the
 * configured window. `principal` is whatever you want to scope to — IP for
 * unauthenticated actions, voterId / hostToken for authenticated ones.
 */
export async function rateLimit(action: LimitName, principal: string): Promise<void> {
  const win = LIMITS[action]
  const key = `${action}:${principal}`

  // Count recent events for this key in the window.
  const result = await db.execute(sql`
    SELECT count(*)::int AS c FROM ${ratelimitEvents}
    WHERE key = ${key}
      AND occurred_at > now() - make_interval(secs => ${win.seconds})
  `)
  const row = result[0] as { c: number } | undefined
  const count = row?.c ?? 0

  if (count >= win.max) {
    throw new Error("RATE_LIMITED")
  }

  await db.insert(ratelimitEvents).values({ key })
}
