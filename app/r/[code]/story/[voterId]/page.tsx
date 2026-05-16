import { db, rooms, voters, douze, votes } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getContestant, CONTESTANTS } from "@/lib/contestants"
import { DOUZE_POINTS } from "@/lib/db/schema"
import Link from "next/link"

export const dynamic = "force-dynamic"

// Story-shaped page (9:16). User screenshots it on their phone.
// Designed to look good as 1080×1920 when captured.

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
  const totalRated = myVotes.length
  const lookalikeUrl = "vienna26.vercel.app"

  return (
    <main className="min-h-dvh flex flex-col items-center safe-x py-4">
      <div className="w-full max-w-md text-center mb-3">
        <p className="text-white/55 text-xs uppercase tracking-widest">
          Screenshot this page → save to Stories
        </p>
        <Link
          href={`/r/${code}`}
          className="text-white/40 hover:text-white text-xs underline underline-offset-2"
        >
          ← back to room
        </Link>
      </div>

      {/* Story canvas: 9:16 aspect, capped to viewport */}
      <div
        id="story-canvas"
        className="relative w-full max-w-[min(420px,calc(100dvh*9/16-60px))] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{
          background:
            "radial-gradient(120% 150% at 90% -3%, #2200ff, #000c54 22.49%, #010a41 33.26% 64.14%, #4c0a54 85.82%, #ff0178)",
        }}
      >
        {/* Header */}
        <div className="p-[6%] pb-2">
          <p className="text-white/55 text-[2.6cqw] tracking-[0.25em] uppercase font-medium">
            Eurovision · Vienna 2026
          </p>
          <h1
            className="font-display font-extrabold leading-none mt-2"
            style={{ fontSize: "clamp(40px, 14cqw, 96px)" }}
          >
            <span className="text-[color:var(--pink)]">vienna</span>
            <span className="text-white">26</span>
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="rounded-full bg-white/15 text-white px-2.5 py-1 font-mono tracking-widest text-xs">
              {code}
            </span>
            <span className="text-white/85 font-bold text-sm truncate">
              {voter[0].displayName}&apos;s top {rows.length}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/15 mx-[6%]" />

        {/* Picks */}
        <ol className="flex-1 px-[5%] py-[3%] space-y-1.5 overflow-hidden">
          {rows.map((r) => {
            const isTwelve = r.points === 12
            return (
              <li
                key={r.id}
                className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition ${
                  isTwelve
                    ? "bg-gradient-to-r from-[color:var(--gold)]/30 to-transparent border border-[color:var(--gold)]/40"
                    : "bg-black/30 border border-white/5"
                }`}
              >
                <span
                  className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums ${
                    isTwelve
                      ? "w-9 h-9 bg-[color:var(--gold)] text-black text-base shadow"
                      : "w-7 h-7 bg-black text-white text-xs"
                  }`}
                >
                  {r.points ?? ""}
                </span>
                <span className="text-2xl shrink-0">{r.c!.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className={`truncate ${isTwelve ? "text-white font-bold text-sm" : "text-white text-xs font-medium"}`}>
                    {r.c!.country}
                  </div>
                  <div className="text-white/55 text-[10px] truncate">{r.c!.artist}</div>
                </div>
              </li>
            )
          })}
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <span className="text-4xl">🎤</span>
              <p className="text-white/65 text-sm">No picks yet</p>
            </div>
          )}
        </ol>

        {/* Footer */}
        <div className="px-[6%] pb-[5%] pt-2 flex items-center justify-between text-white/45 text-[10px] uppercase tracking-widest">
          <span>
            {totalRated} rated · {picks.length}/10 douze
          </span>
          <span>{lookalikeUrl}</span>
        </div>
      </div>

      <p className="mt-4 text-white/40 text-xs text-center max-w-md">
        On iPhone: <strong>side button + volume up</strong> for screenshot. Android: <strong>power + volume down</strong>. Then post to Stories.
      </p>
    </main>
  )
}
