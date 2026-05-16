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

const EMOJI_BUCKETS: { emoji: string; value: number; labelEn: string; labelRu: string }[] = [
  { emoji: "💀", value: 2, labelEn: "Nope", labelRu: "Мимо" },
  { emoji: "😐", value: 4, labelEn: "Meh", labelRu: "Так себе" },
  { emoji: "🙂", value: 6, labelEn: "Good", labelRu: "Норм" },
  { emoji: "🤩", value: 8, labelEn: "Great", labelRu: "Огонь" },
  { emoji: "🔥", value: 10, labelEn: "Iconic", labelRu: "Икона" },
]

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

      if (!tweakOpen) {
        if (advanceTimer.current) clearTimeout(advanceTimer.current)
        advanceTimer.current = setTimeout(() => {
          setCursor((c) => Math.min(contestants.length - 1, c + 1))
        }, 450)
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

  // Primary "feel" — the bucket that matches the current avg if all axes equal.
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
    <div className="space-y-4">
      {!online && (
        <div className="text-center text-xs text-[color:var(--gold)] bg-black/40 rounded-pill px-3 py-1.5">
          offline — saving locally, will sync
        </div>
      )}

      <article className="card-light shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <span className="text-5xl leading-none shrink-0" aria-hidden>
            {current.flag}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-black/50 uppercase tracking-widest">
              {String(current.id).padStart(2, "0")} / {String(contestants.length).padStart(2, "0")} · {current.country}
            </p>
            <h3 className="headline-lg text-xl mt-0.5 leading-tight">{current.artist}</h3>
            <p className="italic text-black/55 text-sm">{current.song}</p>
          </div>
          {isCurrentDone && (
            <span className="rounded-full bg-[color:var(--pink)] text-white text-xs px-2 py-0.5 shrink-0 font-bold">✓</span>
          )}
        </div>

        {/* Primary feel — 5 large emoji buckets */}
        <div className="grid grid-cols-5 gap-2">
          {EMOJI_BUCKETS.map((b) => {
            const isSelected = primaryDisplay === b.value
            return (
              <button
                key={b.value}
                onClick={() => setPrimary(b.value)}
                className={`flex flex-col items-center justify-center gap-0.5 aspect-square rounded-2xl transition active:scale-95 ${
                  isSelected
                    ? "bg-[color:var(--pink)] text-white shadow-lg shadow-[color:var(--pink)]/40 scale-105"
                    : "bg-black/[0.04] hover:bg-black/[0.08]"
                }`}
                aria-label={`Score ${b.value}`}
              >
                <span className="text-3xl leading-none">{b.emoji}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${isSelected ? "text-white" : "text-black/55"}`}>
                  {lang === "ru" ? b.labelRu : b.labelEn}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setTweakOpen((v) => !v)}
          className="mt-3 text-[11px] text-black/45 hover:text-black/75 underline underline-offset-2"
        >
          {tweakOpen
            ? lang === "ru"
              ? "▾ свернуть"
              : "▾ collapse"
            : lang === "ru"
              ? "▸ оценить детально"
              : "▸ rate axes individually"}
        </button>

        {tweakOpen && (
          <div className="mt-3 space-y-2.5">
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

      {/* Pagination */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          onClick={goPrev}
          disabled={cursor === 0}
          className="rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 w-11 h-11 flex items-center justify-center text-lg"
          aria-label="Previous"
        >
          ←
        </button>
        <div className="flex gap-1 overflow-x-auto py-1 px-1 snap-x">
          {contestants.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCursor(i)}
              className={`shrink-0 snap-center w-7 h-7 rounded-full text-[11px] font-mono transition ${
                i === cursor
                  ? "bg-white text-black ring-2 ring-[color:var(--pink)] font-bold"
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
          className="rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 w-11 h-11 flex items-center justify-center text-lg"
          aria-label="Next"
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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-black/70">{label}</span>
        <span className="text-xs font-mono tabular-nums w-6 text-right">{value === undefined ? "·" : value}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {EMOJI_BUCKETS.map((b) => (
          <button
            key={b.value}
            onClick={() => onSelect(b.value)}
            className={`h-9 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
              value === b.value
                ? "bg-[color:var(--pink)] text-white"
                : "bg-black/[0.04] hover:bg-black/[0.08] text-black/65"
            }`}
            aria-label={`${label} ${b.value}`}
          >
            <span className="text-base leading-none">{b.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
