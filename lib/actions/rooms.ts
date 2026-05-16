"use server"

import { db, rooms, voters } from "@/lib/db"
import { eq, and, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { z } from "zod"
import { newRoomCode, newToken } from "@/lib/codes"
import { setHostCookie, setVoterCookie, getVoterToken } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/ratelimit"
import { READ_ONLY } from "@/lib/feature-flags"

const NameSchema = z.string().trim().min(1).max(32)
const RoomNameSchema = z.string().trim().min(1).max(48).optional()
const CodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,8}$/)

// Hard caps so a script kiddie can't fill Neon's free tier by spamming /create.
// Override via env if a real viral moment hits; on Vercel set VIENNA26_ROOM_CAP
// and redeploy. Defaults below are tuned to free-tier headroom (~500 active
// rooms during the show consumes most of Neon's monthly compute hours).
const GLOBAL_ROOM_CAP = Number(process.env.VIENNA26_ROOM_CAP ?? 5000)
const ROOM_VOTER_CAP = Number(process.env.VIENNA26_VOTER_CAP ?? 100)

async function checkRoomCap() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(rooms)
  if (c >= GLOBAL_ROOM_CAP) throw new Error("ROOM_CAP_REACHED")
}

async function checkVoterCap(code: string) {
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(voters)
    .where(eq(voters.roomCode, code))
  if (c >= ROOM_VOTER_CAP) throw new Error("ROOM_FULL")
}

/**
 * One-click solo room for users without a party. Reuses the same room/voter
 * infrastructure so all features (save, share, vs-reality) work identically.
 */
export async function createSoloRoom() {
  if (READ_ONLY) throw new Error("READ_ONLY")
  await rateLimit("createRoom", await getClientIp())
  await checkRoomCap()

  const hostName = "You"

  let code = newRoomCode()
  for (let i = 0; i < 8; i++) {
    const existing = await db.select({ code: rooms.code }).from(rooms).where(eq(rooms.code, code)).limit(1)
    if (existing.length === 0) break
    code = newRoomCode()
  }

  const hostToken = newToken()
  // Solo rooms are private — non-host visitors hit a 404. Can be flipped to
  // public later via Settings → Invite friends if a party materialises.
  await db.insert(rooms).values({ code, name: "Solo session", hostToken, hostName, isPrivate: true })

  const voterToken = newToken()
  await db.insert(voters).values({ roomCode: code, token: voterToken, displayName: hostName })

  await setHostCookie(code, hostToken)
  await setVoterCookie(code, voterToken)

  redirect(`/r/${code}`)
}

export async function createRoom(formData: FormData) {
  if (READ_ONLY) throw new Error("READ_ONLY")
  await rateLimit("createRoom", await getClientIp())
  await checkRoomCap()

  const hostName = NameSchema.parse(formData.get("name"))
  const rawRoomName = formData.get("roomName")
  const roomName = RoomNameSchema.parse(
    typeof rawRoomName === "string" && rawRoomName.trim().length > 0 ? rawRoomName : undefined,
  )

  let code = newRoomCode()
  for (let i = 0; i < 8; i++) {
    const existing = await db.select({ code: rooms.code }).from(rooms).where(eq(rooms.code, code)).limit(1)
    if (existing.length === 0) break
    code = newRoomCode()
  }

  const hostToken = newToken()
  await db.insert(rooms).values({ code, name: roomName ?? null, hostToken, hostName })

  const voterToken = newToken()
  await db.insert(voters).values({ roomCode: code, token: voterToken, displayName: hostName })

  await setHostCookie(code, hostToken)
  await setVoterCookie(code, voterToken)

  redirect(`/r/${code}`)
}

export async function joinRoom(formData: FormData) {
  if (READ_ONLY) redirect(`/join?error=read_only`)
  try {
    await rateLimit("joinRoom", await getClientIp())
  } catch {
    redirect(`/join?error=rate_limited`)
  }

  let code: string
  let displayName: string
  try {
    code = CodeSchema.parse(formData.get("code"))
    displayName = NameSchema.parse(formData.get("name"))
  } catch {
    // Invalid input — send back to /join with a friendly error param.
    redirect(`/join?error=invalid`)
  }

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) {
    redirect(`/join?error=not_found&code=${code}`)
  }

  // If we already have a voter for this room, just refresh the cookie.
  const existing = await getVoterToken(code)
  if (existing) {
    const found = await db.select().from(voters).where(and(eq(voters.roomCode, code), eq(voters.token, existing))).limit(1)
    if (found.length > 0) {
      await setVoterCookie(code, existing)
      redirect(`/r/${code}`)
    }
  }

  // Dedupe display name within the room — append (2), (3), ...
  const existingNames = await db
    .select({ displayName: voters.displayName })
    .from(voters)
    .where(eq(voters.roomCode, code))
  const taken = new Set(existingNames.map((v) => v.displayName.toLowerCase()))
  let finalName = displayName
  if (taken.has(finalName.toLowerCase())) {
    let n = 2
    while (taken.has(`${displayName} (${n})`.toLowerCase())) n += 1
    finalName = `${displayName} (${n})`
  }

  // Private room → only the host can be inside. Anyone else trying to /join
  // gets the same "not found" message as if the code didn't exist (don't leak
  // the existence of someone's solo session).
  if (room[0].isPrivate) {
    redirect(`/join?error=not_found&code=${code}`)
  }

  await checkVoterCap(code)

  const token = newToken()
  await db.insert(voters).values({ roomCode: code, token, displayName: finalName })
  await setVoterCookie(code, token)
  redirect(`/r/${code}`)
}

/**
 * Flip a private (solo) room to public so the host can share the code.
 * Host-only.
 */
export async function openRoomToFriends(roomCode: string) {
  if (READ_ONLY) throw new Error("READ_ONLY")
  const code = CodeSchema.parse(roomCode)
  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) throw new Error("ROOM_NOT_FOUND")

  const { getHostToken } = await import("@/lib/auth")
  const token = await getHostToken(code)
  if (!token || token !== room[0].hostToken) throw new Error("NOT_HOST")

  await db.update(rooms).set({ isPrivate: false }).where(eq(rooms.code, code))
  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/r/${code}`)
}

