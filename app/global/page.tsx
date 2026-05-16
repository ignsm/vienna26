import { db, votes, douze, voters, rooms } from "@/lib/db"
import { getT } from "@/lib/i18n/server"
import { getContestant } from "@/lib/contestants"
import { leaderboard } from "@/lib/scoring"
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
  const top = board.slice(0, 12)

  const byHotness = [...board].sort((a, b) => b.hotness - a.hotness).slice(0, 5)
  const byVocal = [...board].sort((a, b) => b.vocal - a.vocal).slice(0, 5)
  const byPerformance = [...board].sort((a, b) => b.performance - a.performance).slice(0, 5)

  const { t } = await getT()

  return (
    <main className="min-h-dvh p-4">
      <PollingRefresh intervalMs={5000} />
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-2">
          <Link href="/" className="text-white/70 hover:text-white text-sm">
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

        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wider">
              <th className="text-left font-normal py-2 w-8">#</th>
              <th className="text-left font-normal py-2">Country</th>
              <th className="text-right font-normal py-2 w-14">Base</th>
              <th className="text-right font-normal py-2 w-14">12pt</th>
              <th className="text-right font-normal py-2 w-16 font-mono">Total</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r, i) => {
              const c = getContestant(r.contestantId)
              if (!c) return null
              return (
                <tr
                  key={r.contestantId}
                  className={`border-t border-white/10 ${i === 0 ? "bg-[color:var(--gold)]/10" : ""}`}
                >
                  <td className="py-2 text-white/60 font-mono text-xs">{i + 1}</td>
                  <td className="py-2">
                    <span className="mr-2 text-lg align-middle">{c.flag}</span>
                    <span className="text-white align-middle">{c.country}</span>
                    <span className="text-white/40 align-middle ml-1 text-xs">· {c.artist}</span>
                  </td>
                  <td className="py-2 text-right text-white/70 tabular-nums">{r.base.toFixed(1)}</td>
                  <td className="py-2 text-right text-white/70 tabular-nums">{r.douze}</td>
                  <td className="py-2 text-right tabular-nums font-mono text-white font-bold">{r.total.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BonusCard title={t("results.bonus.hotness")} rows={byHotness} metric="hotness" />
          <BonusCard title={t("results.bonus.vocal")} rows={byVocal} metric="vocal" />
          <BonusCard title={t("results.bonus.performance")} rows={byPerformance} metric="performance" />
        </section>
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
  rows: { contestantId: number; vocal: number; performance: number; hotness: number }[]
  metric: "hotness" | "vocal" | "performance"
}) {
  return (
    <div className="card-glass !p-4 space-y-2">
      <p className="text-xs uppercase tracking-widest text-white/50">{title}</p>
      <ol className="space-y-1">
        {rows.map((r, i) => {
          const c = getContestant(r.contestantId)
          if (!c) return null
          return (
            <li key={r.contestantId} className="text-sm flex items-center gap-2">
              <span className="text-white/40 font-mono text-xs w-4">{i + 1}</span>
              <span>{c.flag}</span>
              <span className="text-white truncate">{c.country}</span>
              <span className="ml-auto text-white/60 font-mono tabular-nums text-xs">{r[metric].toFixed(1)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
