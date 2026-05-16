import { db, rooms, voters, douze, votes } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getContestant } from "@/lib/contestants"
import { DOUZE_POINTS } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

// Full-viewport story shot. Made for one-tap screenshot → post to Stories.
// No surrounding chrome, no instructions — just the picks card filling the screen.

const STORY_BG =
  "radial-gradient(120% 150% at 90% -3%, #2200ff, #000c54 22.49%, #010a41 33.26% 64.14%, #4c0a54 85.82%, #ff0178)"

export default async function StoryPage({
  params,
}: {
  params: Promise<{ code: string; voterId: string }>
}) {
  const { code: raw, voterId } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const voter = await db
    .select()
    .from(voters)
    .where(and(eq(voters.roomCode, code), eq(voters.id, voterId)))
    .limit(1)
  if (voter.length === 0) notFound()

  const [picks, myVotes] = await Promise.all([
    db.select().from(douze).where(eq(douze.voterId, voterId)),
    db.select().from(votes).where(eq(votes.voterId, voterId)),
  ])

  let ranked: { id: number; points: number | null }[] = []
  if (picks.length === 10) {
    ranked = [...picks]
      .sort((a, b) => b.points - a.points)
      .map((p) => ({ id: p.contestantId, points: p.points }))
  } else if (myVotes.length > 0) {
    ranked = [...myVotes]
      .sort(
        (a, b) =>
          b.vocal + b.performance + b.song + b.hotness - (a.vocal + a.performance + a.song + a.hotness),
      )
      .slice(0, 10)
      .map((v, i) => ({ id: v.contestantId, points: DOUZE_POINTS[i] ?? null }))
  }

  const rows = ranked.map((r) => ({ ...r, c: getContestant(r.id) })).filter((r) => r.c)

  return (
    <div className="fixed inset-0 flex flex-col text-white" style={{ background: STORY_BG }}>
      <div className="flex-1 flex flex-col p-6 sm:p-10 max-w-md mx-auto w-full">
        {/* Header */}
        <header className="space-y-1 shrink-0">
          <p className="text-white/55 text-[10px] uppercase tracking-[0.25em] font-medium">
            Eurovision · Vienna 2026
          </p>
          <h1 className="font-display font-extrabold leading-none text-5xl">
            <span className="text-[color:var(--pink)]">vienna</span>
            <span className="text-white">26</span>
          </h1>
          <p className="text-white/85 font-bold text-base pt-1 truncate">
            {voter[0].displayName}&apos;s top {rows.length}
          </p>
        </header>

        <div className="h-px bg-white/15 my-3 shrink-0" />

        {/* Picks — flex column with equal-share rows so all 10 always fit */}
        <ol className="flex-1 min-h-0 flex flex-col gap-1.5">
          {rows.map((r) => {
            const isTwelve = r.points === 12
            return (
              <li
                key={r.id}
                className={`flex-1 min-h-0 flex items-center gap-2 rounded-xl px-2.5 overflow-hidden ${
                  isTwelve
                    ? "bg-gradient-to-r from-[color:var(--gold)]/30 to-transparent border border-[color:var(--gold)]/45"
                    : "bg-black/30 border border-white/10"
                }`}
              >
                <span
                  className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums ${
                    isTwelve
                      ? "w-9 h-9 bg-[color:var(--gold)] text-black text-sm shadow"
                      : "w-7 h-7 bg-black text-white text-xs"
                  }`}
                >
                  {r.points ?? ""}
                </span>
                <span className="text-xl shrink-0 leading-none">{r.c!.flag}</span>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className={`truncate leading-tight ${isTwelve ? "text-white font-bold text-sm" : "text-white text-xs font-semibold"}`}>
                    {r.c!.country}
                  </div>
                  <div className="text-white/55 text-[10px] truncate leading-tight">{r.c!.artist}</div>
                </div>
              </li>
            )
          })}
          {rows.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-5xl">🎤</span>
              <p className="text-white/65 text-sm">No picks yet</p>
            </div>
          )}
        </ol>

        {/* Footer — clean centered brand URL, nothing else. */}
        <div className="shrink-0 pt-3 text-center text-white/45 text-[10px] uppercase tracking-widest">
          vienna26.vercel.app
        </div>
      </div>
    </div>
  )
}
