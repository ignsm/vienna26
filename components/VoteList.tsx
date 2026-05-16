"use client"

import { useState, useEffect, useTransition, useCallback, useRef } from "react"
import type { Contestant } from "@/lib/contestants"
import { castVote } from "@/lib/actions/votes"

type VoteState = {
  vocal?: number
  performance?: number
  song?: number
  hotness?: number
}

type Props = {
  roomCode: string
  contestants: Contestant[]
  initialVotes: {
    contestantId: number
    vocal: number
    performance: number
    song: number
    hotness: number
  }[]
}

const AXES = ["vocal", "performance", "song", "hotness"] as const
type Axis = (typeof AXES)[number]

const AXIS_LABELS_EN: Record<Axis, string> = {
  vocal: "Vocal",
  performance: "Stage",
  song: "Song",
  hotness: "Hotness",
}
const AXIS_LABELS_RU: Record<Axis, string> = {
  vocal: "Вокал",
  performance: "Шоу",
  song: "Песня",
  hotness: "Секс.",
}

const lsKey = (room: string, id: number) => `v26:${room}:${id}`
const lsCursorKey = (room: string) => `v26:${room}:cursor`

export function VoteList({ roomCode, contestants, initialVotes }: Props) {
  const [votes, setVotes] = useState<Record<number, VoteState>>(() => {
    const m: Record<number, VoteState> = {}
    for (const v of initialVotes) {
      m[v.contestantId] = { vocal: v.vocal, performance: v.performance, song: v.song, hotness: v.hotness }
    }
    return m
  })

  const [cursor, setCursor] = useState(0)
  const [tweakOpen, setTweakOpen] = useState(false)
  const [online, setOnline] = useState(true)
  const [, startTransition] = useTransition()
  const [lang, setLang] = useState<"en" | "ru">("en")
  const labels = lang === "ru" ? AXIS_LABELS_RU : AXIS_LABELS_EN

  useEffect(() => {
    if (typeof window === "undefined") return

    const m = document.cookie.match(/v26_lang=(en|ru)/)
    if (m) setLang(m[1] as "en" | "ru")

    setVotes((prev) => {
      const next = { ...prev }
      for (const c of contestants) {
        try {
          const raw = localStorage.getItem(lsKey(roomCode, c.id))
          if (raw) {
            const parsed = JSON.parse(raw) as VoteState
            const localCount = AXES.filter((a) => parsed[a] !== undefined).length
            const serverCount = AXES.filter((a) => next[c.id]?.[a] !== undefined).length
            if (localCount > serverCount) {
              next[c.id] = parsed
            }
          }
        } catch {}
      }
      return next
    })

    const savedCursor = Number(localStorage.getItem(lsCursorKey(roomCode)) ?? "0")
    if (Number.isInteger(savedCursor) && savedCursor >= 0 && savedCursor < contestants.length) {
      setCursor(savedCursor)
    }

    const setOn = () => setOnline(true)
    const setOff = () => setOnline(false)
    window.addEventListener("online", setOn)
    window.addEventListener("offline", setOff)
    setOnline(navigator.onLine)
    return () => {
      window.removeEventListener("online", setOn)
      window.removeEventListener("offline", setOff)
    }
  }, [roomCode, contestants])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(lsCursorKey(roomCode), String(cursor))
    }
  }, [cursor, roomCode])

  const current = contestants[cursor]
  const currentVote = votes[current.id] ?? {}
  const isCurrentDone = AXES.every((a) => currentVote[a] !== undefined)

  // Auto-advance timer (cleaned up on cursor change or new tap).
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const syncToServer = useCallback(
    (id: number, v: VoteState) => {
      if (!AXES.every((a) => v[a] !== undefined)) return
      startTransition(async () => {
        try {
          await castVote({
            roomCode,
            contestantId: id,
            vocal: v.vocal!,
            performance: v.performance!,
            song: v.song!,
            hotness: v.hotness!,
          })
        } catch (e) {
          console.warn("castVote failed", e)
          setOnline(false)
        }
      })
    },
    [roomCode],
  )

  const setPrimary = useCallback(
    (value: number) => {
      const nextVote: VoteState = {
        vocal: value,
        performance: value,
        song: value,
        hotness: value,
      }
      setVotes((prev) => ({ ...prev, [current.id]: nextVote }))
      try {
        localStorage.setItem(lsKey(roomCode, current.id), JSON.stringify(nextVote))
      } catch {}
      syncToServer(current.id, nextVote)

      // Auto-advance unless we're tweaking the breakdown.
      if (!tweakOpen) {
        if (advanceTimer.current) clearTimeout(advanceTimer.current)
        advanceTimer.current = setTimeout(() => {
          setCursor((c) => Math.min(contestants.length - 1, c + 1))
        }, 400)
      }
    },
    [current.id, roomCode, syncToServer, tweakOpen, contestants.length],
  )

  const setAxis = useCallback(
    (axis: Axis, value: number) => {
      const nextVote: VoteState = { ...currentVote, [axis]: value }
      setVotes((prev) => ({ ...prev, [current.id]: nextVote }))
      try {
        localStorage.setItem(lsKey(roomCode, current.id), JSON.stringify(nextVote))
      } catch {}
      syncToServer(current.id, nextVote)
    },
    [current.id, currentVote, roomCode, syncToServer],
  )

  // Offline → online retry.
  const lastOnlineRef = useRef(online)
  useEffect(() => {
    if (online && !lastOnlineRef.current) {
      startTransition(async () => {
        for (const c of contestants) {
          const v = votes[c.id]
          if (!v) continue
          if (AXES.every((a) => v[a] !== undefined)) {
            try {
              await castVote({
                roomCode,
                contestantId: c.id,
                vocal: v.vocal!,
                performance: v.performance!,
                song: v.song!,
                hotness: v.hotness!,
              })
            } catch {}
          }
        }
      })
    }
    lastOnlineRef.current = online
  }, [online, contestants, roomCode, votes])

  const isDone = (id: number) => {
    const v = votes[id]
    return v ? AXES.every((a) => v[a] !== undefined) : false
  }

  // The "primary" displayed value is the average of the 4 axes (or undefined if not all set).
  const primaryDisplay =
    currentVote.vocal !== undefined &&
    currentVote.performance !== undefined &&
    currentVote.song !== undefined &&
    currentVote.hotness !== undefined &&
    currentVote.vocal === currentVote.performance &&
    currentVote.performance === currentVote.song &&
    currentVote.song === currentVote.hotness
      ? currentVote.vocal
      : undefined

  const goPrev = () => setCursor((c) => Math.max(0, c - 1))
  const goNext = () => setCursor((c) => Math.min(contestants.length - 1, c + 1))

  return (
    <div className="space-y-5">
      {!online && (
        <div className="text-center text-xs text-[color:var(--gold)] bg-black/40 rounded-pill px-3 py-1.5">
          offline — saving locally, will sync
        </div>
      )}

      <article className="card-light shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <span className="text-6xl leading-none" aria-hidden>
            {current.flag}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-black/50 uppercase tracking-widest">
              {String(current.id).padStart(2, "0")} / {String(contestants.length).padStart(2, "0")} ·{" "}
              {current.country}
            </p>
            <h3 className="headline-lg text-2xl mt-1 leading-tight">{current.artist}</h3>
            <p className="italic text-black/60 text-sm">{current.song}</p>
          </div>
          {isCurrentDone && <span className="pill bg-[color:var(--pink)] text-white text-xs px-3 py-1">✓</span>}
        </div>

        {/* Big primary row — one tap per song. */}
        <div className="grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setPrimary(i)}
              className={`aspect-square rounded-lg text-lg font-bold transition ${
                primaryDisplay === i
                  ? "bg-[color:var(--pink)] text-white scale-110 shadow-lg"
                  : "bg-black/5 hover:bg-black/10 text-black/80 active:scale-95"
              }`}
              aria-label={`Score ${i}`}
            >
              {i}
            </button>
          ))}
        </div>

        <button
          onClick={() => setTweakOpen((v) => !v)}
          className="mt-4 text-xs text-black/50 hover:text-black/80 underline underline-offset-2"
        >
          {tweakOpen ? "▾ collapse" : "▸ tweak axes"}
        </button>

        {tweakOpen && (
          <div className="mt-3 space-y-3">
            {AXES.map((axis) => (
              <AxisRow
                key={axis}
                label={labels[axis]}
                value={currentVote[axis]}
                onSelect={(v) => setAxis(axis, v)}
              />
            ))}
          </div>
        )}
      </article>

      {/* Pagination strip */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          onClick={goPrev}
          disabled={cursor === 0}
          className="pill bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 px-4 py-3 text-lg"
        >
          ←
        </button>
        <div className="flex gap-1 overflow-x-auto py-1 px-1 snap-x">
          {contestants.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCursor(i)}
              className={`shrink-0 snap-center w-7 h-7 rounded-full text-xs font-mono transition ${
                i === cursor
                  ? "bg-white text-black ring-2 ring-[color:var(--pink)]"
                  : isDone(c.id)
                    ? "bg-[color:var(--pink)]/80 text-white"
                    : "bg-white/15 text-white/70 hover:bg-white/25"
              }`}
              aria-label={`${c.country} (${c.id})`}
            >
              {c.id}
            </button>
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={cursor === contestants.length - 1}
          className="pill bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 px-4 py-3 text-lg"
        >
          →
        </button>
      </div>
    </div>
  )
}

function AxisRow({
  label,
  value,
  onSelect,
}: {
  label: string
  value: number | undefined
  onSelect: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-black/70">{label}</span>
        <span className="text-xs font-mono tabular-nums w-6 text-right">
          {value === undefined ? "·" : value}
        </span>
      </div>
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`aspect-square rounded text-xs font-medium transition ${
              value === i
                ? "bg-[color:var(--pink)] text-white"
                : "bg-black/5 hover:bg-black/10 text-black/70"
            }`}
            aria-label={`${label} ${i}`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}
