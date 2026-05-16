"use client"

import { useState, useTransition } from "react"
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
  // Reconstruct initial ordering: slot i (0..9) holds the contestant who got POINTS[i].
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

  const onPickContestant = (id: number) => {
    setSubmitted(false)
    setError(null)
    if (picked.has(id)) {
      // Remove and shift remaining picks up to fill the gap.
      const removedIdx = order.findIndex((x) => x === id)
      const next = [...order]
      next.splice(removedIdx, 1)
      next.push(null)
      setOrder(next)
      return
    }
    if (nextEmpty === -1) return // already full
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

  return (
    <div className="space-y-6">
      {/* Slots */}
      <section className="card-light space-y-2">
        {POINTS.map((p, i) => {
          const id = order[i]
          const c = id ? contestants.find((x) => x.id === id) : null
          return (
            <div
              key={p}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                p === 12 ? "bg-[color:var(--gold)]/20" : i % 2 ? "bg-black/[0.03]" : "bg-transparent"
              }`}
            >
              <span
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                  p === 12 ? "bg-[color:var(--gold)] text-black" : "bg-black text-white"
                }`}
              >
                {p}
              </span>
              {c ? (
                <>
                  <span className="text-2xl shrink-0">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">{c.country}</div>
                    <div className="text-xs text-black/60 truncate">
                      {c.artist} · <em>{c.song}</em>
                    </div>
                  </div>
                  <button
                    onClick={() => onClearSlot(i)}
                    className="text-black/40 hover:text-black/80 text-sm px-2"
                    aria-label="Clear slot"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-black/30 text-sm">— empty —</span>
              )}
            </div>
          )
        })}
      </section>

      <div className="flex items-center gap-3">
        <span className="text-white/70 text-sm">
          Remaining: <span className="font-mono">{order.filter((x) => x === null).length} / 10</span>
        </span>
        <button onClick={onReset} className="ml-auto pill bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5">
          Reset
        </button>
      </div>

      {/* Contestant grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {contestants.map((c) => {
          const idx = order.findIndex((x) => x === c.id)
          const pickedHere = idx !== -1
          return (
            <button
              key={c.id}
              onClick={() => onPickContestant(c.id)}
              disabled={!pickedHere && nextEmpty === -1}
              className={`text-left rounded-xl p-3 transition border ${
                pickedHere
                  ? "bg-[color:var(--pink)] border-[color:var(--pink)] text-white"
                  : "bg-white text-black border-transparent hover:border-[color:var(--pink)]/40 disabled:opacity-40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.flag}</span>
                <span className="text-sm font-medium truncate">{c.country}</span>
                {pickedHere && (
                  <span className="ml-auto font-bold text-xs bg-white/20 rounded px-1.5 py-0.5">{POINTS[idx]}</span>
                )}
              </div>
              <div className={`text-xs mt-1 truncate ${pickedHere ? "text-white/80" : "text-black/50"}`}>{c.artist}</div>
            </button>
          )
        })}
      </section>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={!complete || pending}
        className="pill-pink w-full py-4 text-base disabled:opacity-40"
      >
        {pending ? "Saving…" : complete ? "Submit douze" : `Pick ${order.filter((x) => x === null).length} more`}
      </button>

      {submitted && (
        <p className="text-center text-[color:var(--gold)] text-sm">✓ Submitted. Waiting for the rest of the jury.</p>
      )}
    </div>
  )
}
