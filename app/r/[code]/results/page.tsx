import { db, rooms, voters, votes, douze } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS, getContestant } from "@/lib/contestants"
import { leaderboard, type Aggregate } from "@/lib/scoring"
import { PollingRefresh } from "@/components/PollingRefresh"
import { RoomTabBar } from "@/components/RoomTabBar"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const voterToken = await getVoterToken(code)
  if (!voterToken) redirect(`/join?code=${code}`)

  const me = await db
    .select()
    .from(voters)
    .where(and(eq(voters.roomCode, code), eq(voters.token, voterToken)))
    .limit(1)
  if (me.length === 0) redirect(`/join?code=${code}`)

  const allVoters = await db.select().from(voters).where(eq(voters.roomCode, code))
  const voterIds = new Set(allVoters.map((v) => v.id))

  const allVotes = await db.select().from(votes)
  const allDouze = await db.select().from(douze)

  const myVotes = allVotes.filter((v) => voterIds.has(v.voterId))
  const myDouze = allDouze.filter((d) => voterIds.has(d.voterId))
  const myOwnVotes = allVotes.filter((v) => v.voterId === me[0].id)
  const myOwnDouze = allDouze.filter((d) => d.voterId === me[0].id)

  const board = leaderboard(myVotes, myDouze)
  const top3 = board.slice(0, 3)
  const rest = board.slice(3)

  const byHotness = [...board].sort((a, b) => b.hotness - a.hotness).slice(0, 5)
  const byVocal = [...board].sort((a, b) => b.vocal - a.vocal).slice(0, 5)
  const byPerformance = [...board].sort((a, b) => b.performance - a.performance).slice(0, 5)

  const { lang, t } = await getT()
  const hasAnyVotes = board.length > 0 && board[0].total > 0

  return (
    <main className="min-h-dvh pb-28">
      <PollingRefresh intervalMs={3000} />

      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/r/${code}`} className="text-white/70 hover:text-white text-sm shrink-0 font-medium">
            vienna<span className="text-[color:var(--pink)]">26</span>
          </Link>
          <span className="font-mono text-sm tracking-widest text-white/80 ml-auto">{code}</span>
        </div>
      </header>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="headline-display text-4xl">{t("results.title")}</h1>
          <p className="text-white/60 text-xs">
            {allVoters.length} {lang === "ru" ? "в жюри" : "jurors"} · {myVotes.length}{" "}
            {lang === "ru" ? "оценок поставлено" : "ratings cast"} · {myDouze.length / 10}{" "}
            {lang === "ru" ? "финалов отправлено" : "douze submitted"}
          </p>
        </div>

        {!hasAnyVotes ? (
          <div className="card-glass text-center py-12 space-y-2">
            <p className="text-3xl">🎤</p>
            <p className="text-white font-bold">{lang === "ru" ? "Голосов пока нет" : "No votes yet"}</p>
            <p className="text-white/60 text-sm">
              {lang === "ru" ? "Начни оценивать номера, и они появятся здесь" : "Start rating acts to see the board light up"}
            </p>
            <Link href={`/r/${code}`} className="inline-block pill-pink text-sm mt-3 px-5 py-2">
              {lang === "ru" ? "К голосованию →" : "Start voting →"}
            </Link>
          </div>
        ) : (
          <>
            {/* DRAMATIC TOP-3 */}
            {top3.length > 0 && <PodiumTop3 rows={top3} />}

            {/* The rest */}
            {rest.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2 px-1">
                  {lang === "ru" ? "Остальные" : "The rest"}
                </h2>
                <BoardList rows={rest} startRank={4} />
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BonusCard
                title={t("results.bonus.hotness")}
                rows={byHotness}
                metric="hotness"
                accent="--hotpink"
              />
              <BonusCard title={t("results.bonus.vocal")} rows={byVocal} metric="vocal" />
              <BonusCard title={t("results.bonus.performance")} rows={byPerformance} metric="performance" />
            </section>
          </>
        )}
      </div>

      <RoomTabBar
        roomCode={code}
        active="results"
        douzeSubmitted={myOwnDouze.length === 10}
        douzePicks={myOwnDouze.length}
        votesCount={myOwnVotes.length}
        totalActs={CONTESTANTS.length}
        lang={lang}
      />
    </main>
  )
}

function PodiumTop3({ rows }: { rows: Aggregate[] }) {
  return (
    <section className="space-y-2">
      {rows.map((r, i) => {
        const c = getContestant(r.contestantId)
        if (!c) return null
        const isWinner = i === 0
        const place = i + 1
        return (
          <article
            key={r.contestantId}
            className={`rounded-2xl border transition relative overflow-hidden ${
              isWinner
                ? "bg-gradient-to-br from-[color:var(--gold)]/30 via-black/40 to-[color:var(--pink)]/10 border-[color:var(--gold)]/50 shadow-xl shadow-[color:var(--gold)]/10"
                : place === 2
                  ? "bg-black/50 border-white/20"
                  : "bg-black/40 border-white/15"
            }`}
          >
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div
                className={`shrink-0 font-display font-bold tabular-nums ${
                  isWinner ? "text-7xl md:text-8xl text-[color:var(--gold)]" : "text-5xl text-white/50"
                }`}
              >
                {place}
              </div>
              <div className="shrink-0 text-5xl md:text-6xl">{c.flag}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold truncate ${isWinner ? "text-xl md:text-2xl text-white" : "text-lg text-white/95"}`}>
                  {c.country}
                </div>
                <div className="text-white/55 text-sm truncate">
                  {c.artist} <span className="text-white/40">·</span> <em className="text-white/70">{c.song}</em>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`font-mono font-bold tabular-nums ${
                    isWinner ? "text-4xl md:text-5xl text-white" : "text-2xl text-white/90"
                  }`}
                >
                  {r.total.toFixed(0)}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  {r.base.toFixed(1)} × {r.voteCount} + {r.douze}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function BoardList({ rows, startRank }: { rows: Aggregate[]; startRank: number }) {
  return (
    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 overflow-hidden divide-y divide-white/5">
      {rows.map((r, i) => {
        const c = getContestant(r.contestantId)
        if (!c) return null
        return (
          <div
            key={r.contestantId}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition"
          >
            <span className="text-white/40 font-mono text-sm tabular-nums w-6 text-right">{startRank + i}</span>
            <span className="text-xl shrink-0">{c.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{c.country}</div>
              <div className="text-white/45 text-xs truncate">{c.artist}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-white text-sm font-mono tabular-nums font-bold">{r.total.toFixed(0)}</div>
              <div className="text-white/40 text-[10px]">
                {r.base.toFixed(1)} · {r.voteCount}v · {r.douze}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BonusCard({
  title,
  rows,
  metric,
  accent,
}: {
  title: string
  rows: Aggregate[]
  metric: "hotness" | "vocal" | "performance"
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 p-4 space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-white/50" style={accent ? { color: `var(${accent})` } : undefined}>
        {title}
      </p>
      <ol className="space-y-1.5">
        {rows.map((r, i) => {
          const c = getContestant(r.contestantId)
          if (!c) return null
          return (
            <li key={r.contestantId} className="text-sm flex items-center gap-2">
              <span className="text-white/35 font-mono text-xs w-4">{i + 1}</span>
              <span>{c.flag}</span>
              <span className="text-white truncate flex-1">{c.country}</span>
              <span className="text-white/70 font-mono tabular-nums text-xs">{r[metric].toFixed(1)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
