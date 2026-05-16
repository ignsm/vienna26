"use server"

import { db, votes, douze, rooms, voters } from "@/lib/db"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { getVoterToken } from "@/lib/auth"
import { DOUZE_POINTS } from "@/lib/db/schema"
import { CONTESTANTS } from "@/lib/contestants"
import { rateLimit } from "@/lib/ratelimit"
import { revalidatePath } from "next/cache"
import { READ_ONLY } from "@/lib/feature-flags"

const Score = z.number().int().min(0).max(10)
const CodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,8}$/)

const CONTESTANT_IDS = new Set(CONTESTANTS.map((c) => c.id))

async function requireVoter(roomCode: string) {
  const token = await getVoterToken(roomCode)
  if (!token) throw new Error("NOT_JOINED")
  const found = await db.select().from(voters).where(and(eq(voters.roomCode, roomCode), eq(voters.token, token))).limit(1)
  if (found.length === 0) throw new Error("NOT_JOINED")
  return found[0]
}

export async function castVote(input: {
  roomCode: string
  contestantId: number
  vocal: number
  performance: number
  song: number
  hotness: number
}) {
  if (READ_ONLY) throw new Error("READ_ONLY")
  const code = CodeSchema.parse(input.roomCode)
  if (!CONTESTANT_IDS.has(input.contestantId)) throw new Error("BAD_CONTESTANT")

  const vocal = Score.parse(input.vocal)
  const performance = Score.parse(input.performance)
  const song = Score.parse(input.song)
  const hotness = Score.parse(input.hotness)

  const voter = await requireVoter(code)
  await rateLimit("castVote", voter.id)

  await db
    .insert(votes)
    .values({
      voterId: voter.id,
      contestantId: input.contestantId,
      vocal,
      performance,
      song,
      hotness,
    })
    .onConflictDoUpdate({
      target: [votes.voterId, votes.contestantId],
      set: { vocal, performance, song, hotness, updatedAt: new Date() },
    })

  revalidatePath(`/r/${code}`)
  revalidatePath(`/r/${code}/results`)
  revalidatePath(`/host/${code}`)
}

const DouzePicks = z.array(
  z.object({
    contestantId: z.number().int(),
    points: z.union([
      z.literal(12),
      z.literal(10),
      z.literal(8),
      z.literal(7),
      z.literal(6),
      z.literal(5),
      z.literal(4),
      z.literal(3),
      z.literal(2),
      z.literal(1),
    ]),
  }),
).length(10)

export async function submitDouze(input: { roomCode: string; picks: { contestantId: number; points: number }[] }) {
  if (READ_ONLY) throw new Error("READ_ONLY")
  const code = CodeSchema.parse(input.roomCode)
  const picks = DouzePicks.parse(input.picks)

  // Distinct contestants AND distinct point values (one of each 12,10,8,...,1).
  const contestantIds = new Set(picks.map((p) => p.contestantId))
  if (contestantIds.size !== 10) throw new Error("DUPLICATE_CONTESTANT")
  for (const id of contestantIds) {
    if (!CONTESTANT_IDS.has(id)) throw new Error("BAD_CONTESTANT")
  }
  const pointSet = new Set(picks.map((p) => p.points))
  if (pointSet.size !== 10) throw new Error("DUPLICATE_POINTS")
  for (const p of DOUZE_POINTS) {
    if (!pointSet.has(p)) throw new Error("INCOMPLETE_POINTS")
  }

  // Room must exist; douze round is always open (independent of per-act scoring).
  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) throw new Error("ROOM_NOT_FOUND")

  const voter = await requireVoter(code)
  await rateLimit("submitDouze", voter.id)

  await db.transaction(async (tx) => {
    await tx.delete(douze).where(eq(douze.voterId, voter.id))
    await tx.insert(douze).values(
      picks.map((p) => ({
        voterId: voter.id,
        contestantId: p.contestantId,
        points: p.points,
      })),
    )
  })

  revalidatePath(`/r/${code}`)
  revalidatePath(`/r/${code}/results`)
  revalidatePath(`/r/${code}/douze`)
  revalidatePath(`/host/${code}`)
}
