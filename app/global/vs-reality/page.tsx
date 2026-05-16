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
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="headline-lg text-xl text-white">
                {lang === "ru" ? "Вердикт толпы" : "Crowd verdict"}
              </h2>
              <span className="text-xs text-white/50 shrink-0">
                {lang === "ru" ? "Точность" : "Accuracy"}
              </span>
            </div>
            <p className="text-white/55 text-xs leading-snug -mt-1">
              {lang === "ru"
                ? "Складываем 12-баллы каждого жюри из всех комнат в один общий топ и сравниваем с реальным финалом."
                : "We sum every juror's 12-points across all rooms into one global ranking and compare it to the real final."}
            </p>

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
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="headline-lg text-xl text-white">
              {lang === "ru" ? "Самые точные пророки" : "Most accurate prophets"}
            </h2>
            <span className="text-xs text-white/50 shrink-0">
              {lang === "ru" ? "По всем комнатам" : "All rooms"}
            </span>
          </div>
          <p className="text-white/55 text-xs leading-snug -mt-1">
            {lang === "ru"
              ? "Каждое жюри, отдавшее все 10 баллов, сравнивается персонально с реальным финалом. Сортировка по ρ, при ничьей — по количеству попаданий в реальный топ-10."
              : "Every juror who submitted all 10 picks is scored personally against the real final. Ranked by ρ, ties broken by top-10 hits."}
          </p>

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

        </section>

        {/* Methodology — collapsible, default closed so it doesn't crowd the
            scoreboards but is one tap away. */}
        <details className="card-glass">
          <summary className="cursor-pointer text-sm text-white/85 font-medium select-none">
            {lang === "ru" ? "Как это всё считается?" : "How is this computed?"}
          </summary>

          <div className="mt-3 space-y-4 text-white/70 text-[13px] leading-relaxed">
            <div>
              <p className="text-white font-semibold mb-1 text-sm">
                {lang === "ru" ? "Реальный финал" : "Real final"}
              </p>
              <p>
                {lang === "ru"
                  ? "Топ-25 финала Евровидения 2026 — официальный итог жюри + телеголосования. Зашит в коде проекта (lib/real-results.ts), обновляется деплоем после шоу."
                  : "Official Eurovision 2026 grand-final top-25 (jury + televote). Baked into the codebase at lib/real-results.ts, refreshed by deploy after the show."}
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-1 text-sm">
                {lang === "ru" ? "Вердикт толпы — топ" : "Crowd verdict — ranking"}
              </p>
              <p>
                {lang === "ru"
                  ? "Каждый член жюри в каждой комнате раздаёт 12, 10, 8, 7, 6, 5, 4, 3, 2, 1 баллов своему топ-10. Мы суммируем все эти баллы по странам через все комнаты — кто набрал больше всего, тот выше в «вердикте толпы». Поактные оценки (5-кнопочные) в этом топе не участвуют, как и на лидерборде комнат."
                  : "Every juror in every room hands out 12, 10, 8, 7, 6, 5, 4, 3, 2, 1 to their top 10. We sum those points per country across all rooms — biggest total wins the global top. Per-act ratings (the 5-button screen) don't move this ranking, same rule as inside rooms."}
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-1 text-sm">Spearman ρ</p>
              <p>
                {lang === "ru"
                  ? "Ранговая корреляция между двумя топами. Берём твои 10 пиков, смотрим какое место каждый из них занял в реальном финале, и считаем насколько порядок совпадает."
                  : "Rank correlation between two top lists. We take your 10 picks, look up each one's real position, and compute how aligned the two orderings are."}
              </p>
              <ul className="mt-2 space-y-0.5 text-white/65 text-[12px]">
                <li>
                  <span className="font-mono text-[color:var(--gold)]">0.80–1.00</span>
                  {" "}— {lang === "ru" ? "ты предсказал почти один в один" : "near-perfect prediction"}
                </li>
                <li>
                  <span className="font-mono text-white">0.50–0.80</span>
                  {" "}— {lang === "ru" ? "общее направление угадано" : "right general direction"}
                </li>
                <li>
                  <span className="font-mono text-white/70">0.20–0.50</span>
                  {" "}— {lang === "ru" ? "слабая связь" : "weak signal"}
                </li>
                <li>
                  <span className="font-mono text-white/55">±0.20</span>
                  {" "}— {lang === "ru" ? "практически случайно" : "basically random"}
                </li>
                <li>
                  <span className="font-mono text-red-300">{"<"} 0</span>
                  {" "}— {lang === "ru" ? "наоборот: твои фавориты — реальные аутсайдеры" : "inverted: your favourites are the real flops"}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-1 text-sm">
                {lang === "ru" ? "Попадания в топ-10" : "Top-10 hits"}
              </p>
              <p>
                {lang === "ru"
                  ? "Сколько твоих 10 пиков попали в реальный топ-10, без учёта порядка. Простой способ ощутить «угадал ли я финалистов вообще», даже если порядок совсем другой."
                  : "How many of your 10 picks made the real top-10, ignoring order. A simpler 'did I at least pick the finalists' read for when ρ feels too abstract."}
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-1 text-sm">
                {lang === "ru" ? "Кого считаем «пророком»" : "Who counts as a prophet"}
              </p>
              <p>
                {lang === "ru"
                  ? "Только тех, кто отправил полный douze (все 10 пиков). Неполные douze искажают Spearman — нечего сравнивать, если ты раздал только 2 балла из 10."
                  : "Only voters who submitted a complete douze (all 10 picks). Partial douze noisy-up Spearman — there's nothing to correlate with 2 picks."}
              </p>
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}
