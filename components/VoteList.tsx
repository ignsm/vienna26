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

type Bucket = { value: number; labelEn: string; labelRu: string; emoji: string; accent: string }
const BUCKETS: Bucket[] = [
  { value: 10, labelEn: "Iconic", labelRu: "Икона", emoji: "🔥", accent: "from-[color:var(--pink)] to-[color:var(--hotpink)]" },
  { value: 8, labelEn: "Great", labelRu: "Огонь", emoji: "🤩", accent: "from-fuchsia-500 to-pink-500" },
  { value: 6, labelEn: "Good", labelRu: "Норм", emoji: "🙂", accent: "from-violet-500 to-fuchsia-500" },
  { value: 4, labelEn: "Meh", labelRu: "Так себе", emoji: "😐", accent: "from-indigo-500 to-violet-500" },
  { value: 2, labelEn: "Nope", labelRu: "Мимо", emoji: "💀", accent: "from-slate-600 to-indigo-700" },
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
  const [jumpOpen, setJumpOpen] = useState(false)
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
            if (localCount > serverCount) next[c.id] = parsed
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
    if (typeof window !== "undefined") localStorage.setItem(lsCursorKey(roomCode), String(cursor))
  }, [cursor, roomCode])

  const current = contestants[cursor]
  const currentVote = votes[current.id] ?? {}
  const isCurrentDone = AXES.every((a) => currentVote[a] !== undefined)

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current) }, [])

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
      const nextVote: VoteState = { vocal: value, performance: value, song: value, hotness: value }
      setVotes((prev) => ({ ...prev, [current.id]: nextVote }))
      try { localStorage.setItem(lsKey(roomCode, current.id), JSON.stringify(nextVote)) } catch {}
      syncToServer(current.id, nextVote)
      if (!tweakOpen) {
        if (advanceTimer.current) clearTimeout(advanceTimer.current)
        advanceTimer.current = setTimeout(() => {
          setCursor((c) => Math.min(contestants.length - 1, c + 1))
        }, 500)
      }
    },
    [current.id, roomCode, syncToServer, tweakOpen, contestants.length],
  )

  const setAxis = useCallback(
    (axis: Axis, value: number) => {
      const nextVote: VoteState = { ...currentVote, [axis]: value }
      setVotes((prev) => ({ ...prev, [current.id]: nextVote }))
      try { localStorage.setItem(lsKey(roomCode, current.id), JSON.stringify(nextVote)) } catch {}
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
                roomCode, contestantId: c.id,
                vocal: v.vocal!, performance: v.performance!, song: v.song!, hotness: v.hotness!,
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
        <div className="text-center text-xs text-[color:var(--gold)] bg-black/40 rounded-full px-3 py-1.5">
          offline — saving locally, will sync
        </div>
      )}

      <article className="rounded-3xl bg-white text-black shadow-2xl overflow-hidden">
        {/* Contestant header */}
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-black/[0.05]">
          <span className="text-5xl leading-none shrink-0" aria-hidden>{current.flag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-black/45 uppercase tracking-widest">
              {String(current.id).padStart(2, "0")} / {String(contestants.length).padStart(2, "0")} · {current.country}
            </p>
            <h3 className="font-bold text-lg leading-tight truncate">{current.artist}</h3>
            <p className="italic text-black/55 text-sm truncate">{current.song}</p>
          </div>
          {isCurrentDone && (
            <span className="rounded-full bg-[color:var(--pink)] text-white text-xs px-2.5 py-1 shrink-0 font-bold leading-none">✓</span>
          )}
        </div>

        {/* Mode switcher — segmented control. Outside the rating area so it can't be mis-tapped */}
        <div className="px-3 pt-3 md:px-4 md:pt-4">
          <p className="text-[10px] uppercase tracking-widest text-black/45 mb-1.5 px-1">
            {lang === "ru" ? "Как хотите оценить?" : "How to rate"}
          </p>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-black/[0.06]">
            <button
              onClick={() => setTweakOpen(false)}
              className={`h-9 rounded-full text-xs font-bold transition ${
                !tweakOpen ? "bg-white text-black shadow" : "text-black/55 hover:text-black/80"
              }`}
            >
              {lang === "ru" ? "Общая оценка" : "Overall"}
            </button>
            <button
              onClick={() => setTweakOpen(true)}
              className={`h-9 rounded-full text-xs font-bold transition ${
                tweakOpen ? "bg-white text-black shadow" : "text-black/55 hover:text-black/80"
              }`}
            >
              {lang === "ru" ? "Детально" : "Detail"}
            </button>
          </div>
        </div>

        {/* Scoring area — either the 5-bucket primary OR the 4-axis detail view, not both */}
        <div className="p-3 md:p-4 space-y-2">
          {!tweakOpen && (
            <>
              {BUCKETS.map((b) => {
                const isSelected = primaryDisplay === b.value
                return (
                  <button
                    key={b.value}
                    onClick={() => setPrimary(b.value)}
                    className={`group relative w-full h-14 rounded-2xl flex items-center gap-3 px-4 transition active:scale-[0.985] ${
                      isSelected
                        ? `bg-gradient-to-r ${b.accent} text-white shadow-lg`
                        : "bg-black/[0.04] hover:bg-black/[0.08] text-black"
                    }`}
                    aria-label={lang === "ru" ? b.labelRu : b.labelEn}
                  >
                    <span className="text-2xl leading-none shrink-0" aria-hidden>{b.emoji}</span>
                    <span className="flex-1 text-left font-bold text-base leading-tight">
                      {lang === "ru" ? b.labelRu : b.labelEn}
                    </span>
                    <span
                      className={`text-sm font-mono tabular-nums shrink-0 ${
                        isSelected ? "text-white/85" : "text-black/40"
                      }`}
                    >
                      {b.value}
                    </span>
                  </button>
                )
              })}
            </>
          )}

          {tweakOpen && (
            <div className="space-y-4">
              {AXES.map((axis) => (
                <AxisRow
                  key={axis}
                  label={labels[axis]}
                  value={currentVote[axis]}
                  onSelect={(v) => setAxis(axis, v)}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Pagination — prev / counter / next. Counter taps to open jump grid */}
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={cursor === 0}
          className="rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white disabled:opacity-30 w-12 h-12 flex items-center justify-center text-xl transition shrink-0"
          aria-label="Previous act"
        >
          ←
        </button>
        <button
          onClick={() => setJumpOpen(true)}
          className="flex-1 h-12 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition flex items-center justify-center gap-2 px-3"
          aria-label="Jump to act"
        >
          <span className="text-white/55 text-xs">
            {lang === "ru" ? "Номер" : "Act"}
          </span>
          <span className="font-mono tabular-nums font-bold">
            {cursor + 1} / {contestants.length}
          </span>
          <span className="text-white/40 text-xs">▾</span>
        </button>
        <button
          onClick={goNext}
          disabled={cursor === contestants.length - 1}
          className="rounded-full bg-[color:var(--pink)] hover:brightness-110 text-white disabled:opacity-30 w-12 h-12 flex items-center justify-center text-xl transition shrink-0 shadow-md shadow-[color:var(--pink)]/30"
          aria-label="Next act"
        >
          →
        </button>
      </div>

      {/* Jump-to grid modal */}
      {jumpOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setJumpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-black/95 border border-white/15 p-4 max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">
                {lang === "ru" ? "Перейти к номеру" : "Jump to act"}
              </h4>
              <button onClick={() => setJumpOpen(false)} className="text-white/60 hover:text-white text-sm">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {contestants.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setCursor(i); setJumpOpen(false) }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition ${
                    i === cursor
                      ? "bg-white text-black"
                      : isDone(c.id)
                        ? "bg-[color:var(--pink)]/25 text-white border border-[color:var(--pink)]/40"
                        : "bg-white/5 text-white/85 hover:bg-white/10"
                  }`}
                >
                  <span className="font-mono text-[11px] tabular-nums w-5 shrink-0 opacity-70">{c.id}</span>
                  <span className="text-base shrink-0">{c.flag}</span>
                  <span className="text-xs truncate">{c.country}</span>
                  {isDone(c.id) && i !== cursor && <span className="ml-auto text-[color:var(--pink)] text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AxisRow({
  label,
  value,
  onSelect,
  lang,
}: {
  label: string
  value: number | undefined
  onSelect: (v: number) => void
  lang: "en" | "ru"
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-black/70">{label}</span>
        <span className="text-xs font-mono tabular-nums text-black/55">{value === undefined ? "·" : value}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {BUCKETS.slice().reverse().map((b) => (
          <button
            key={b.value}
            onClick={() => onSelect(b.value)}
            className={`h-10 rounded-xl text-xs font-medium transition flex items-center justify-center ${
              value === b.value
                ? "bg-[color:var(--pink)] text-white shadow-md"
                : "bg-black/[0.04] hover:bg-black/[0.08] text-black/65"
            }`}
            aria-label={`${label} ${b.value} ${lang === "ru" ? b.labelRu : b.labelEn}`}
          >
            <span className="text-base leading-none">{b.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
