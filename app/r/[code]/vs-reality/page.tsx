import { db, rooms, voters, douze } from "@/lib/db"
import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS, getContestant } from "@/lib/contestants"
import { spearman, topKHitRate } from "@/lib/scoring"
import Link from "next/link"

export const dynamic = "force-dynamic"

type RealMap = Record<string, number>

function realRanking(real: RealMap): number[] {
  // Map back to a flat ordered list of contestant ids, rank 1..N.
  return Object.entries(real)
    .sort(([, a], [, b]) => a - b)
    .map(([cid]) => Number(cid))
}

export default async function VsRealityPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const voterToken = await getVoterToken(code)
  if (!voterToken) redirect(`/join?code=${code}`)

  const { t } = await getT()

  if (!room[0].realResults) {
    return (
      <main className="min-h-dvh p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href={`/r/${code}`} className="text-white/70 hover:text-white text-sm">
            ← vienna<span className="text-[color:var(--pink)]">26</span> · {code}
          </Link>
          <h1 className="headline-display text-4xl">{t("reality.title")}</h1>
          <div className="card-glass">
            <p className="text-[color:var(--gold)]">{t("reality.locked")}</p>
          </div>
        </div>
      </main>
    )
  }

  const real = room[0].realResults as RealMap
  const realOrdered = realRanking(real)
  const realTop10 = realOrdered.slice(0, 10)

  // Per-voter top-10 by their douze picks (12 → 1).
  const allVoters = await db.select().from(voters).where(eq(voters.roomCode, code))
  const allDouze = await db.select().from(douze)
  const voterMap = new Map(allVoters.map((v) => [v.id, v]))

  type Scored = {
    voterId: string
    name: string
    myTop: number[]
    spearman: number
    hits: number
  }

  const scored: Scored[] = []
  for (const v of allVoters) {
    const mine = allDouze
      .filter((d) => d.voterId === v.id)
      .sort((a, b) => b.points - a.points)
      .map((d) => d.contestantId)
    if (mine.length === 0) continue
    scored.push({
      voterId: v.id,
      name: v.displayName,
      myTop: mine,
      spearman: spearman(mine, realOrdered),
      hits: Math.round(topKHitRate(mine, realOrdered, 10) * 10),
    })
  }

  scored.sort((a, b) => b.spearman - a.spearman)

  return (
    <main className="min-h-dvh p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/r/${code}`} className="text-white/70 hover:text-white text-sm">
          ← vienna<span className="text-[color:var(--pink)]">26</span> · {code}
        </Link>

        <div className="space-y-1">
          <h1 className="headline-display text-4xl">{t("reality.title")}</h1>
        </div>

        <section className="card-glass space-y-3">
          <h2 className="headline-lg text-xl text-white">{t("reality.real_top")}</h2>
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

        {scored.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="headline-lg text-xl text-white">{t("reality.prophet")}</h2>
              <span className="text-xs text-white/50">{t("reality.accuracy")}</span>
            </div>

            <div className="card-light space-y-2">
              {scored.map((s, i) => (
                <div
                  key={s.voterId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    i === 0 ? "bg-[color:var(--gold)]/30" : i % 2 ? "bg-black/[0.03]" : ""
                  }`}
                >
                  <span className="font-mono w-5 text-xs text-black/60">{i + 1}</span>
                  <span className={`font-medium ${i === 0 ? "text-black" : "text-black/80"}`}>{s.name}</span>
                  <span className="ml-auto text-xs text-black/60">{s.hits}/10 in top-10</span>
                  <span className="font-mono tabular-nums text-sm text-black">{s.spearman.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <details className="card-glass">
              <summary className="cursor-pointer text-sm text-white/80">Show every juror&apos;s top 10</summary>
              <div className="mt-3 space-y-4">
                {scored.map((s) => (
                  <div key={s.voterId}>
                    <p className="text-sm font-medium text-white mb-1">{s.name}</p>
                    <ol className="text-xs text-white/70 space-y-0.5">
                      {s.myTop.slice(0, 10).map((id, i) => {
                        const c = getContestant(id)
                        const realRank = real[String(id)]
                        const delta = realRank ? realRank - (i + 1) : null
                        return (
                          <li key={id} className="flex items-center gap-1.5">
                            <span className="font-mono w-5">{i + 1}</span>
                            <span>{c?.flag}</span>
                            <span className="truncate">{c?.country}</span>
                            <span className="ml-auto font-mono">
                              {delta === null ? "—" : delta === 0 ? "✓" : delta > 0 ? `+${delta}` : `${delta}`}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </main>
  )
}
