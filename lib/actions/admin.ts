"use server"

import { db, rooms } from "@/lib/db"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { getHostToken } from "@/lib/auth"
import { parseRealResults } from "@/lib/parse-results"
import { rateLimit } from "@/lib/ratelimit"
import { revalidatePath } from "next/cache"

const CodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,8}$/)

async function requireHost(code: string) {
  const token = await getHostToken(code)
  if (!token) throw new Error("NOT_HOST")
  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0 || room[0].hostToken !== token) throw new Error("NOT_HOST")
  return room[0]
}

export async function saveRealResults(formData: FormData) {
  const code = CodeSchema.parse(formData.get("code"))
  const text = z.string().min(5).parse(formData.get("results"))

  const room = await requireHost(code)
  await rateLimit("saveRealResults", room.hostToken)
  const parsed = parseRealResults(text)
  await db.update(rooms).set({ realResults: parsed }).where(eq(rooms.code, code))
  revalidatePath(`/admin/${code}`)
  revalidatePath(`/r/${code}/vs-reality`)
  revalidatePath(`/r/${code}/results`)
  revalidatePath(`/host/${code}`)
}
