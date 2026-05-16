import { db, votes, douze, voters, rooms } from "@/lib/db"
import { getT } from "@/lib/i18n/server"
import { getContestant } from "@/lib/contestants"
import { leaderboard, type Aggregate } from "@/lib/scoring"
import { PollingRefresh } from "@/components/PollingRefresh"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function GlobalPage() {
  const [allVotes, allDouze, allVoters, allRooms] = await Promise.all([
    db.select().from(votes),
    db.select().from(douze),
    db.select().from(voters),
    db.select().from(rooms),
  ])

  const board = leaderboard(allVotes, allDouze)
  const top3 = board.slice(0, 3)
  const rest = board.slice(3, 15)

  const byHotness = [...board].sort((a, b) => b.hotness - a.hotness).slice(0, 5)
  const byVocal = [...board].sort((a, b) => b.vocal - a.vocal).slice(0, 5)
  const byPerformance = [...board].sort((a, b) => b.performance - a.performance).slice(0, 5)

  const { lang, t } = await getT()

  return (
    <main className="min-h-dvh p-4 pb-12">
      <PollingRefresh intervalMs={5000} />
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-2">
          <Link href="/" className="text-white/70 hover:text-white text-sm font-medium">
            ← vienna<span className="text-[color:var(--pink)]">26</span>
          </Link>
        </header>

        <div className="space-y-1">
          <h1 className="headline-display text-4xl">{t("global.title")}</h1>
          <p className="text-white/60 text-sm">{t("global.subtitle")}</p>
          <p className="text-white/40 text-xs">
            {allVoters.length} {t("global.voters")} · {allRooms.length} {t("global.rooms")}
          </p>
        </div>

        {top3.length === 0 || top3[0].total === 0 ? (
          <div className="rounded-2xl bg-black/40 border border-white/10 p-10 text-center space-y-2">
            <p className="text-3xl">🎤</p>
            <p className="text-white font-bold">{lang === "ru" ? "Голосов пока нет" : "No votes yet"}</p>
          </div>
        ) : (
          <>
            <section className="space-y-2">
              {top3.map((r, i) => {
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
                          {r.douzeVoters === 0
                            ? "—"
                            : lang === "ru"
                              ? `от ${r.douzeVoters} голосующих`
                              : `from ${r.douzeVoters} ${r.douzeVoters === 1 ? "juror" : "jurors"}`}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            {rest.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2 px-1">
                  {lang === "ru" ? "Остальные" : "The rest"}
                </h2>
                <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 overflow-hidden divide-y divide-white/5">
                  {rest.map((r, i) => {
                    const c = getContestant(r.contestantId)
                    if (!c) return null
                    return (
                      <div key={r.contestantId} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-white/40 font-mono text-sm tabular-nums w-6 text-right">{i + 4}</span>
                        <span className="text-xl shrink-0">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{c.country}</div>
                          <div className="text-white/45 text-xs truncate">{c.artist}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-white text-sm font-mono tabular-nums font-bold">{r.total.toFixed(0)}</div>
                          <div className="text-white/40 text-[10px]">
                            {r.douzeVoters === 0
                              ? "—"
                              : lang === "ru"
                                ? `от ${r.douzeVoters} голосующих`
                                : `from ${r.douzeVoters} ${r.douzeVoters === 1 ? "juror" : "jurors"}`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BonusCard title={t("results.bonus.hotness")} rows={byHotness} metric="hotness" />
              <BonusCard title={t("results.bonus.vocal")} rows={byVocal} metric="vocal" />
              <BonusCard title={t("results.bonus.performance")} rows={byPerformance} metric="performance" />
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function BonusCard({
  title,
  rows,
  metric,
}: {
  title: string
  rows: Aggregate[]
  metric: "hotness" | "vocal" | "performance"
}) {
  return (
    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 p-4 space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-white/50">{title}</p>
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
