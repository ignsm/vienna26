import { db, votes, douze, voters } from "@/lib/db"
import { getContestant } from "@/lib/contestants"
import { aggregate, spearman, topKHitRate } from "@/lib/scoring"
import { REAL_FINAL_RANKING, isRealResultsReady } from "@/lib/real-results"
import { getT } from "@/lib/i18n/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

/**
 * Global vs reality — cross-room analytics against the real Eurovision final.
 *
 * Two engines:
 *   1) "Crowd verdict": aggregate every douze pick across every room into one
 *      global top, then score it against the real final using Spearman ρ and
 *      top-10 hit rate. Answers "did the vienna26 hive mind agree with the
 *      real jury?".
 *   2) "Most accurate prophet (global)": for every voter who submitted a full
 *      douze (10 picks), compute their personal Spearman ρ and hit rate
 *      against the real final. Ranked by ρ desc. Cross-room leaderboard of
 *      "who guessed best".
 */
export default async function GlobalVsRealityPage() {
  const { lang } = await getT()

  if (!isRealResultsReady()) {
    return (
      <main className="min-h-dvh p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/global" className="text-white/70 hover:text-white text-sm">
            ← {lang === "ru" ? "Глобальный лидерборд" : "Global leaderboard"}
          </Link>
          <h1 className="headline-display text-4xl">
            {lang === "ru" ? "Глобально vs реальность" : "Global vs reality"}
          </h1>
          <div className="card-glass">
            <p className="text-[color:var(--gold)]">
              {lang === "ru" ? "Реальные результаты ещё не загружены." : "Real results not loaded yet."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const realOrdered = [...REAL_FINAL_RANKING]
  const realTop10 = realOrdered.slice(0, 10)

  // Pull everything — small at vienna26 scale (one-night party app, ≤ a few hundred rows tonight).
  const [allVotes, allDouze, allVoters] = await Promise.all([
    db.select().from(votes),
    db.select().from(douze),
    db.select().from(voters),
  ])

  // 1) Global aggregate — sum douze per contestant across all rooms, build a top list.
  const agg = aggregate(allVotes, allDouze)
  const globalTop = [...agg.values()]
    .filter((a) => a.douze > 0)
    .sort((a, b) => b.douze - a.douze)
    .map((a) => a.contestantId)
  const globalSpearman = spearman(globalTop, realOrdered)
  const globalHits = Math.round(topKHitRate(globalTop, realOrdered, 10) * 10)

  // 2) Per-voter prophets. Only voters with a complete 10-pick douze count —
  //    partial picks would skew Spearman noisily.
  const douzeByVoter = new Map<string, typeof allDouze>()
  for (const d of allDouze) {
    if (!douzeByVoter.has(d.voterId)) douzeByVoter.set(d.voterId, [])
    douzeByVoter.get(d.voterId)!.push(d)
  }

  type Prophet = {
    voterId: string
    name: string
    roomCode: string
    myTop: number[]
    spearman: number
    hits: number
  }
  const prophets: Prophet[] = []
  for (const v of allVoters) {
    const rows = douzeByVoter.get(v.id) ?? []
    if (rows.length < 10) continue
    const myTop = [...rows].sort((a, b) => b.points - a.points).map((r) => r.contestantId)
    prophets.push({
      voterId: v.id,
      name: v.displayName,
      roomCode: v.roomCode,
      myTop,
      spearman: spearman(myTop, realOrdered),
      hits: Math.round(topKHitRate(myTop, realOrdered, 10) * 10),
    })
  }
  prophets.sort((a, b) => b.spearman - a.spearman)

  const noProphets = prophets.length === 0
  const crowdHasData = globalTop.length > 0

  return (
    <main className="min-h-dvh p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/global" className="text-white/70 hover:text-white text-sm">
          ← {lang === "ru" ? "Глобальный лидерборд" : "Global leaderboard"}
        </Link>

        <div className="space-y-1">
          <h1 className="headline-display text-4xl">
            {lang === "ru" ? "Глобально vs реальность" : "Global vs reality"}
          </h1>
          <p className="text-white/55 text-sm">
            {lang === "ru"
              ? `Сравнение по всем комнатам · ${prophets.length} ${prophets.length === 1 ? "жюри" : "жюри"} с полным douze`
              : `Aggregated across every room · ${prophets.length} ${prophets.length === 1 ? "juror" : "jurors"} with full douze`}
          </p>
        </div>

        {/* Real top 10 */}
        <section className="card-glass space-y-3">
          <h2 className="headline-lg text-xl text-white">
            {lang === "ru" ? "Реальный топ-10" : "Real top 10"}
          </h2>
          <ol className="space-y-1">
            {realTop10.map((id, i) => {
              const c = getContestant(id)
              return (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <span className="text-white/40 font-mono w-5">{i + 1}</span>
                  <span className="text-xl">{c?.flag}</span>
                  <span className="text-white">{c?.country}</span>
                  <span className="text-white/40 text-xs">· {c?.artist}</span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Crowd verdict */}
        {crowdHasData && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="headline-lg text-xl text-white">
                {lang === "ru" ? "Вердикт толпы" : "Crowd verdict"}
              </h2>
              <span className="text-xs text-white/50">
                {lang === "ru" ? "Точность" : "Accuracy"}
              </span>
            </div>

            <div className="card-glass space-y-3">
              <div className="flex items-center justify-around gap-3 pb-3 border-b border-white/10">
                <div className="text-center">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest">Spearman ρ</div>
                  <div className="text-[color:var(--gold)] text-3xl font-bold font-mono tabular-nums">
                    {globalSpearman.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest">
                    {lang === "ru" ? "Попало в топ-10" : "Top-10 hits"}
                  </div>
                  <div className="text-white text-3xl font-bold font-mono tabular-nums">
                    {globalHits}<span className="text-white/40 text-base">/10</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-white/55 text-xs uppercase tracking-widest mb-2">
                  {lang === "ru" ? "Топ-10 толпы" : "Crowd's top 10"}
                </p>
                <ol className="space-y-1">
                  {globalTop.slice(0, 10).map((id, i) => {
                    const c = getContestant(id)
                    const realRank = realOrdered.indexOf(id) + 1 || null
                    const delta = realRank ? realRank - (i + 1) : null
                    return (
                      <li key={id} className="flex items-center gap-2 text-sm">
                        <span className="text-white/40 font-mono w-5">{i + 1}</span>
                        <span className="text-xl">{c?.flag}</span>
                        <span className="text-white flex-1 truncate">{c?.country}</span>
                        <span className="font-mono text-xs text-white/55 shrink-0">
                          {delta === null ? "—" : delta === 0 ? "✓" : delta > 0 ? `+${delta}` : `${delta}`}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* Prophets */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="headline-lg text-xl text-white">
              {lang === "ru" ? "Самые точные пророки" : "Most accurate prophets"}
            </h2>
            <span className="text-xs text-white/50">{lang === "ru" ? "По всем комнатам" : "All rooms"}</span>
          </div>

          {noProphets ? (
            <div className="card-glass text-center text-white/55 text-sm py-6">
              {lang === "ru"
                ? "Никто не успел отправить финальный douze. Сравнение ждёт первого пророка."
                : "Nobody submitted a full douze yet."}
            </div>
          ) : (
            <div className="card-light space-y-2">
              {prophets.map((p, i) => (
                <div
                  key={p.voterId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    i === 0 ? "bg-[color:var(--gold)]/30" : i % 2 ? "bg-black/[0.03]" : ""
                  }`}
                >
                  <span className="font-mono w-5 text-xs text-black/60">{i + 1}</span>
                  <span className={`font-medium ${i === 0 ? "text-black" : "text-black/80"}`}>
                    {p.name}
                  </span>
                  <span className="text-[10px] text-black/45 font-mono uppercase tracking-widest">
                    · {p.roomCode}
                  </span>
                  <span className="ml-auto text-xs text-black/60 shrink-0">
                    {p.hits}/10
                  </span>
                  <span className="font-mono tabular-nums text-sm text-black shrink-0">
                    {p.spearman.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-white/40 text-[11px] leading-snug px-1">
            {lang === "ru"
              ? "Spearman ρ — корреляция твоего топа с реальным финалом. 1.00 = идеальное совпадение, 0 = случайно, –1 = идеально перевёрнуто. Считается по общей части твоих 10 пиков и реального топ-25."
              : "Spearman ρ measures rank correlation against the real final. 1.00 = perfect order, 0 = uncorrelated, –1 = perfectly reversed. Computed across the overlap between your 10 picks and the real top-25."}
          </p>
        </section>
      </div>
    </main>
  )
}
