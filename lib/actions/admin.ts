"use server"

import { db, rooms } from "@/lib/db"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { getHostToken } from "@/lib/auth"
import { CONTESTANTS } from "@/lib/contestants"
import { revalidatePath } from "next/cache"

const CodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,8}$/)

async function requireHost(code: string) {
  const token = await getHostToken(code)
  if (!token) throw new Error("NOT_HOST")
  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0 || room[0].hostToken !== token) throw new Error("NOT_HOST")
  return room[0]
}

/**
 * Parse free-form "1. Sweden\n2. Italy\n..." text into a ranking map.
 * Country can be name, code (ISO alpha-2), or running-order number — we match
 * loosely (case-insensitive substring on country, exact on code).
 *
 * Returns { id -> rank } where rank is 1..25 (1 = winner).
 */
export function parseRealResults(text: string): Record<string, number> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const out: Record<string, number> = {}
  let rank = 0
  for (const line of lines) {
    rank += 1
    // Strip leading "N." or "N)" or "N: "
    const cleaned = line.replace(/^\d+[\.\):]?\s*/, "").trim()
    const found = CONTESTANTS.find((c) => {
      const lc = cleaned.toLowerCase()
      return (
        c.country.toLowerCase() === lc ||
        c.country.toLowerCase().includes(lc) ||
        lc.includes(c.country.toLowerCase()) ||
        c.countryCode.toLowerCase() === lc
      )
    })
    if (!found) {
      throw new Error(`UNRECOGNIZED_LINE:${line}`)
    }
    if (out[found.id]) {
      throw new Error(`DUPLICATE_COUNTRY:${found.country}`)
    }
    out[found.id] = rank
  }
  if (rank < 3) throw new Error("TOO_FEW_LINES")
  return out
}

export async function saveRealResults(formData: FormData) {
  const code = CodeSchema.parse(formData.get("code"))
  const text = z.string().min(5).parse(formData.get("results"))

  await requireHost(code)
  const parsed = parseRealResults(text)
  await db.update(rooms).set({ realResults: parsed }).where(eq(rooms.code, code))
  revalidatePath(`/admin/${code}`)
  revalidatePath(`/r/${code}/vs-reality`)
  revalidatePath(`/r/${code}/results`)
  revalidatePath(`/host/${code}`)
}
