"use server"

import { db, rooms, voters } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { newRoomCode, newToken } from "@/lib/codes"
import { setHostCookie, setVoterCookie, getVoterToken } from "@/lib/auth"

const NameSchema = z.string().trim().min(1).max(32)
const RoomNameSchema = z.string().trim().min(1).max(48).optional()
const CodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,8}$/)

/**
 * One-click solo room for users without a party. Reuses the same room/voter
 * infrastructure so all features (save, share, vs-reality) work identically.
 */
export async function createSoloRoom() {
  const hostName = "You"

  let code = newRoomCode()
  for (let i = 0; i < 8; i++) {
    const existing = await db.select({ code: rooms.code }).from(rooms).where(eq(rooms.code, code)).limit(1)
    if (existing.length === 0) break
    code = newRoomCode()
  }

  const hostToken = newToken()
  await db.insert(rooms).values({ code, name: "Solo session", hostToken, hostName })

  const voterToken = newToken()
  await db.insert(voters).values({ roomCode: code, token: voterToken, displayName: hostName })

  await setHostCookie(code, hostToken)
  await setVoterCookie(code, voterToken)

  redirect(`/r/${code}`)
}

export async function createRoom(formData: FormData) {
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
  const code = CodeSchema.parse(formData.get("code"))
  const displayName = NameSchema.parse(formData.get("name"))

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) {
    throw new Error("ROOM_NOT_FOUND")
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

  const token = newToken()
  await db.insert(voters).values({ roomCode: code, token, displayName })
  await setVoterCookie(code, token)
  redirect(`/r/${code}`)
}

export async function openDouzeRound(roomCode: string) {
  const code = CodeSchema.parse(roomCode)
  const c = await import("@/lib/auth").then((m) => m.getHostToken(code))
  if (!c) throw new Error("NOT_HOST")
  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0 || room[0].hostToken !== c) throw new Error("NOT_HOST")

  await db.update(rooms).set({ douzeOpen: 1 }).where(eq(rooms.code, code))
  revalidatePath(`/r/${code}`)
  revalidatePath(`/host/${code}`)
}
