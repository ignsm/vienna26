"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { submitDouze } from "@/lib/actions/votes"
import type { Contestant } from "@/lib/contestants"
import { DOUZE_POINTS } from "@/lib/db/schema"

type Props = {
  roomCode: string
  contestants: Contestant[]
  initialPicks: { contestantId: number; points: number }[]
}

const POINTS = [...DOUZE_POINTS] // [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

export function DouzePicker({ roomCode, contestants, initialPicks }: Props) {
  const initialOrder: (number | null)[] = POINTS.map((p) => {
    const found = initialPicks.find((pk) => pk.points === p)
    return found ? found.contestantId : null
  })

  const [order, setOrder] = useState<(number | null)[]>(initialOrder)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(initialPicks.length === 10)

  const filled = order.filter((x): x is number => x !== null)
  const picked = new Set(filled)
  const nextEmpty = order.findIndex((x) => x === null)
  const complete = nextEmpty === -1
  const remaining = order.filter((x) => x === null).length

  const onPickContestant = (id: number) => {
    setSubmitted(false)
    setError(null)
    if (picked.has(id)) {
      const removedIdx = order.findIndex((x) => x === id)
      const next = [...order]
      next.splice(removedIdx, 1)
      next.push(null)
      setOrder(next)
      return
    }
    if (nextEmpty === -1) return
    const next = [...order]
    next[nextEmpty] = id
    setOrder(next)
  }

  const onClearSlot = (idx: number) => {
    setSubmitted(false)
    setError(null)
    const next = [...order]
    next.splice(idx, 1)
    next.push(null)
    setOrder(next)
  }

  const onReset = () => {
    setSubmitted(false)
    setError(null)
    setOrder(POINTS.map(() => null))
  }

  const onSubmit = () => {
    if (!complete) return
    setError(null)
    start(async () => {
      try {
        const picks = order.map((id, i) => ({ contestantId: id!, points: POINTS[i] }))
        await submitDouze({ roomCode, picks })
        setSubmitted(true)
      } catch (e: any) {
        setError(e?.message ?? "FAILED")
      }
    })
  }

  const scrollToGrid = () => {
    if (typeof window !== "undefined") {
      document.getElementById("douze-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="space-y-5">
      {/* Your picks: empty state stays compact, fills out as user picks */}
      <section className="card-light !p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-black/80 text-sm uppercase tracking-widest">Your picks</h2>
          <span className="text-xs text-black/45 font-mono tabular-nums">{filled.length}/10</span>
        </div>

        {filled.length === 0 ? (
          <button
            type="button"
            onClick={scrollToGrid}
            className="w-full rounded-2xl border-2 border-dashed border-[color:var(--pink)]/40 bg-[color:var(--pink)]/5 px-4 py-5 text-center hover:bg-[color:var(--pink)]/10 transition active:scale-[0.99]"
          >
            <p className="text-base font-bold text-black/85">↓ Tap a country below</p>
            <p className="text-xs text-black/55 mt-1">
              First tap gets <span className="font-bold text-[color:var(--pink)]">12 points</span>, then 10, 8, 7, 6, 5, 4, 3, 2, 1
            </p>
          </button>
        ) : (
          <>
            {POINTS.map((p, i) => {
              const id = order[i]
              const c = id ? contestants.find((x) => x.id === id) : null
              const isTwelve = p === 12
              if (!c) {
                return (
                  <div key={p} className="flex items-center gap-2 px-2 py-1 text-xs text-black/40">
                    <span
                      className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums text-[11px] w-6 h-6 ${
                        isTwelve ? "bg-[color:var(--gold)] text-black" : "bg-black/65 text-white"
                      }`}
                    >
                      {p}
                    </span>
                    <span className="italic">empty</span>
                  </div>
                )
              }
              return (
                <div
                  key={p}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isTwelve
                      ? "bg-gradient-to-r from-[color:var(--gold)]/30 to-[color:var(--gold)]/10 border border-[color:var(--gold)]/50"
                      : "bg-black/[0.04]"
                  }`}
                >
                  <span
                    className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums ${
                      isTwelve
                        ? "w-11 h-11 bg-[color:var(--gold)] text-black text-lg shadow-md shadow-[color:var(--gold)]/40"
                        : "w-9 h-9 bg-black text-white text-sm"
                    }`}
                  >
                    {p}
                  </span>
                  <span className="text-2xl shrink-0">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isTwelve ? "text-black text-base" : "text-black/85 text-sm"}`}>
                      {c.country}
                    </div>
                    <div className="text-xs text-black/55 truncate">{c.artist}</div>
                  </div>
                  <button
                    onClick={() => onClearSlot(i)}
                    className="text-black/35 hover:text-black/80 text-base px-2 shrink-0"
                    aria-label="Clear slot"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
            <button
              onClick={onReset}
              className="text-black/45 hover:text-black/75 text-xs underline underline-offset-2 mt-1"
            >
              Reset all picks
            </button>
          </>
        )}
      </section>

      {/* Contestant grid */}
      <section id="douze-grid" className="scroll-mt-24">
        <h2 className="text-white/60 text-xs uppercase tracking-widest mb-2">
          {remaining > 0
            ? `Pick ${remaining} more (tap a country)`
            : "All 10 picked. Tap to swap or submit below."}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {contestants.map((c) => {
            const idx = order.findIndex((x) => x === c.id)
            const pickedHere = idx !== -1
            const points = pickedHere ? POINTS[idx] : null
            return (
              <button
                key={c.id}
                onClick={() => onPickContestant(c.id)}
                disabled={!pickedHere && nextEmpty === -1}
                className={`relative text-left rounded-xl p-3 transition border ${
                  pickedHere
                    ? points === 12
                      ? "bg-[color:var(--gold)] border-[color:var(--gold)] text-black"
                      : "bg-[color:var(--pink)] border-[color:var(--pink)] text-white"
                    : "bg-white text-black border-transparent hover:border-[color:var(--pink)]/40 disabled:opacity-40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono tabular-nums shrink-0 rounded px-1 py-0.5 ${
                      pickedHere ? "bg-black/15 text-current" : "bg-black/5 text-black/55"
                    }`}
                  >
                    {String(c.id).padStart(2, "0")}
                  </span>
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-sm font-medium truncate">{c.country}</span>
                </div>
                <div className={`text-xs mt-1 truncate ${pickedHere ? "opacity-85" : "text-black/55"}`}>
                  {c.artist} <span className="italic opacity-70">· {c.song}</span>
                </div>
                {points !== null && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-black/40 ${
                      points === 12 ? "bg-black text-[color:var(--gold)]" : "bg-white text-[color:var(--pink)]"
                    }`}
                  >
                    {points}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      {/* Inline submit + post-submit CTA. Tab bar sits below; no fixed overlay here. */}
      <div className="space-y-3 pt-1">
        <button
          onClick={onSubmit}
          disabled={!complete || pending}
          className={`w-full py-4 rounded-2xl text-base font-bold transition shadow-lg ${
            complete
              ? "bg-[color:var(--pink)] text-white hover:brightness-110 shadow-[color:var(--pink)]/40"
              : "bg-white/15 text-white/55 cursor-not-allowed"
          }`}
        >
          {pending
            ? "Saving…"
            : submitted
              ? "Update submission"
              : complete
                ? "Submit 12 points"
                : `Pick ${remaining} more to submit`}
        </button>

        {submitted && (
          <Link
            href={`/r/${roomCode}/results`}
            className="block text-center rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/15 hover:bg-[color:var(--gold)]/25 transition px-5 py-4"
          >
            <p className="text-[color:var(--gold)] font-bold">✓ Submitted · see leaderboard →</p>
            <p className="text-white/70 text-xs mt-1">Your 12 points are in the room totals.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
