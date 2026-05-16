import { db, rooms, voters, votes, douze } from "@/lib/db"
import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getHostToken } from "@/lib/auth"
import { getContestant } from "@/lib/contestants"
import { leaderboard } from "@/lib/scoring"
import { PollingRefresh } from "@/components/PollingRefresh"

export const dynamic = "force-dynamic"

export default async function HostTvPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const hostToken = await getHostToken(code)
  if (!hostToken || hostToken !== room[0].hostToken) redirect(`/r/${code}`)

  const allVoters = await db.select().from(voters).where(eq(voters.roomCode, code))
  const voterIds = new Set(allVoters.map((v) => v.id))
  const allVotes = await db.select().from(votes)
  const allDouze = await db.select().from(douze)

  const myVotes = allVotes.filter((v) => voterIds.has(v.voterId))
  const myDouze = allDouze.filter((d) => voterIds.has(d.voterId))

  const board = leaderboard(myVotes, myDouze).slice(0, 12)

  return (
    <main className="min-h-dvh p-8 md:p-16">
      <PollingRefresh intervalMs={3000} />
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <p className="text-white/60 text-sm uppercase tracking-widest">{room[0].name ?? "Eurovision Home Jury"}</p>
          <p className="font-mono text-2xl tracking-widest text-white/80">{code}</p>
        </header>

        <h1 className="headline-display text-7xl md:text-9xl">
          <span className="text-[color:var(--pink)]">vienna</span>
          <span className="text-white">26</span>
        </h1>

        <ol className="space-y-3">
          {board.map((row, i) => {
            const c = getContestant(row.contestantId)
            if (!c) return null
            return (
              <li
                key={row.contestantId}
                className={`flex items-center gap-6 rounded-2xl px-6 py-4 backdrop-blur transition ${
                  i === 0
                    ? "bg-[color:var(--gold)]/20 border border-[color:var(--gold)]/60"
                    : "bg-black/40 border border-white/10"
                }`}
              >
                <span
                  className={`font-mono text-4xl md:text-5xl tabular-nums w-14 text-right ${
                    i === 0 ? "text-[color:var(--gold)]" : "text-white/60"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-5xl md:text-7xl" aria-hidden>
                  {c.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl md:text-4xl text-white truncate">{c.country}</div>
                  <div className="text-sm md:text-lg text-white/60 truncate">
                    {c.artist} · <em>{c.song}</em>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-3xl md:text-5xl tabular-nums text-white">{row.total.toFixed(0)}</div>
                  <div className="text-xs text-white/50">
                    {row.base.toFixed(1)} base + {row.douze} pts
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="text-center text-white/40 text-xs">
          {allVoters.length} juror{allVoters.length === 1 ? "" : "s"} · auto-refresh every 3s
        </p>
      </div>
    </main>
  )
}
