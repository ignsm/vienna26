"use client"

import { useEffect, useRef, useState } from "react"
import { getContestant } from "@/lib/contestants"
import type { Aggregate } from "@/lib/scoring"
import { IconClose } from "@/components/icons"

type Criterion = "total" | "hotness" | "vocal" | "performance" | "song"

const CRITERIA_EN: { id: Criterion; label: string; hint: string }[] = [
  { id: "total", label: "Total score", hint: "sum of 12-points from all jurors" },
  { id: "vocal", label: "Best vocal", hint: "avg vocal rating" },
  { id: "performance", label: "Best stage", hint: "avg stage rating" },
  { id: "song", label: "Best song", hint: "avg song rating" },
  { id: "hotness", label: "Hottest 🔥", hint: "avg sexy rating" },
]
const CRITERIA_RU: { id: Criterion; label: string; hint: string }[] = [
  { id: "total", label: "Итог", hint: "сумма 12 баллов от всех жюри" },
  { id: "vocal", label: "Лучший вокал", hint: "средний вокал" },
  { id: "performance", label: "Лучшее шоу", hint: "средняя постановка" },
  { id: "song", label: "Лучшая песня", hint: "средняя песня" },
  { id: "hotness", label: "Самые горячие 🔥", hint: "средняя сексуальность" },
]

type Props = {
  board: Aggregate[]
  lang: "en" | "ru"
}

export function LeaderboardView({ board, lang }: Props) {
  const [criterion, setCriterion] = useState<Criterion>("total")
  const [open, setOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const criteria = lang === "ru" ? CRITERIA_RU : CRITERIA_EN
  const current = criteria.find((c) => c.id === criterion)!

  useEffect(() => {
    if (!open) return
    const outside = (e: MouseEvent | TouchEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", outside)
    document.addEventListener("touchstart", outside)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", outside)
      document.removeEventListener("touchstart", outside)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const sorted = [...board].sort((a, b) => (b[criterion] as number) - (a[criterion] as number))
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  return (
    <div className="space-y-5">
      {/* Sort selector */}
      <div className="relative" ref={selectorRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full h-14 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition flex items-center gap-3 px-4 text-left"
          aria-expanded={open}
        >
          <span className="text-[10px] uppercase tracking-widest text-white/45 shrink-0">
            {lang === "ru" ? "Сортировка" : "Sort by"}
          </span>
          <span className="font-bold text-white text-base truncate">{current.label}</span>
          <span className="ml-auto text-white/40 shrink-0">▾</span>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl bg-black/95 backdrop-blur border border-white/15 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <p className="text-white/45 text-[10px] uppercase tracking-widest">
                {lang === "ru" ? "Что показать" : "What to rank"}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-white/45 hover:text-white"
                aria-label="Close"
              >
                <IconClose size={14} />
              </button>
            </div>
            <div className="py-1">
              {criteria.map((c) => {
                const isActive = c.id === criterion
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCriterion(c.id)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-baseline gap-2 transition ${
                      isActive ? "bg-[color:var(--pink)]/15" : "hover:bg-white/10"
                    }`}
                  >
                    <span className={`font-bold text-sm ${isActive ? "text-white" : "text-white/85"}`}>{c.label}</span>
                    <span className="text-white/45 text-[11px]">{c.hint}</span>
                    {isActive && <span className="ml-auto text-[color:var(--pink)] text-xs font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top 3 podium */}
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
                    {formatValue(criterion, r)}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">
                    {subline(criterion, r)}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {/* Rest list */}
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
                <div
                  key={r.contestantId}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition"
                >
                  <span className="text-white/40 font-mono text-sm tabular-nums w-6 text-right">{i + 4}</span>
                  <span className="text-xl shrink-0">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{c.country}</div>
                    <div className="text-white/45 text-xs truncate">{c.artist}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white text-sm font-mono tabular-nums font-bold">
                      {formatValue(criterion, r)}
                    </div>
                    <div className="text-white/40 text-[10px]">{subline(criterion, r)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function formatValue(criterion: Criterion, r: Aggregate): string {
  if (criterion === "total") return r.total.toFixed(0)
  return (r[criterion] as number).toFixed(1)
}

function subline(criterion: Criterion, r: Aggregate): string {
  if (criterion === "total") {
    if (r.douzeVoters === 0) return "—"
    return `from ${r.douzeVoters} ${r.douzeVoters === 1 ? "juror" : "jurors"}`
  }
  return `${r.voteCount}v · avg`
}
