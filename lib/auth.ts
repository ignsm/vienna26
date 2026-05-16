import { cookies } from "next/headers"

/**
 * Auth model — no real auth, just per-room cookies set on create/join.
 *
 * Per-room cookies:
 *   v26_v_<CODE>   voter token (every room participant)
 *   v26_h_<CODE>   host token (only the room creator)
 *
 * No global identity. If you join two rooms on the same device, you have two
 * separate identities. Tokens are server-secret enough for this party app
 * (random 24-char nanoid).
 */

const COOKIE_DAYS = 2
const COOKIE_MAX_AGE = 60 * 60 * 24 * COOKIE_DAYS
const SECURE_COOKIES = process.env.NODE_ENV === "production"

export async function setVoterCookie(roomCode: string, token: string) {
  const c = await cookies()
  c.set(`v26_v_${roomCode}`, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function setHostCookie(roomCode: string, token: string) {
  const c = await cookies()
  c.set(`v26_h_${roomCode}`, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function getVoterToken(roomCode: string): Promise<string | null> {
  const c = await cookies()
  return c.get(`v26_v_${roomCode}`)?.value ?? null
}

export async function getHostToken(roomCode: string): Promise<string | null> {
  const c = await cookies()
  return c.get(`v26_h_${roomCode}`)?.value ?? null
}
