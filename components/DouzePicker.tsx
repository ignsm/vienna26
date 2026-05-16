"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { submitDouze } from "@/lib/actions/votes"
import type { Contestant } from "@/lib/contestants"
import { DOUZE_POINTS } from "@/lib/db/schema"
import { CountryCombobox } from "@/components/CountryCombobox"

type Props = {
  roomCode: string
  contestants: Contestant[]
  initialPicks: { contestantId: number; points: number }[]
  myRatings?: { contestantId: number; sum: number }[]
  myVoterId?: string
  lang?: "en" | "ru"
}

const POINTS = [...DOUZE_POINTS] // [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

export function DouzePicker({ roomCode, contestants, initialPicks, myRatings = [], myVoterId, lang = "en" }: Props) {
  const initialOrder: (number | null)[] = POINTS.map((p) => {
    const found = initialPicks.find((pk) => pk.points === p)
    return found ? found.contestantId : null
  })

  const [order, setOrder] = useState<(number | null)[]>(initialOrder)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(initialPicks.length === 10)

  const filled = order.filter((x): x is number => x !== null)
  const nextEmpty = order.findIndex((x) => x === null)
  const complete = nextEmpty === -1
  const remaining = order.filter((x) => x === null).length

  const setSlot = (idx: number, id: number | null) => {
    setSubmitted(false)
    setError(null)
    const next = [...order]
    next[idx] = id
    setOrder(next)
  }

  const onReset = () => {
    setSubmitted(false)
    setError(null)
    setOrder(POINTS.map(() => null))
  }

  // Auto-fill top 10 from per-act ratings, sorted by sum desc, ties broken by running order (id asc)
  const autoFillFromRate = () => {
    if (myRatings.length === 0) return
    const overwrite = filled.length > 0
      ? (typeof window !== "undefined"
          ? window.confirm(
              lang === "ru"
                ? "Перезаписать твои текущие выборы из оценок Rate?"
                : "Overwrite your current picks with auto-fill from Rate?",
            )
          : true)
      : true
    if (!overwrite) return

    const ranked = [...myRatings]
      .sort((a, b) => b.sum - a.sum || a.contestantId - b.contestantId)
      .slice(0, 10)
      .map((r) => r.contestantId)
    // Pad with nulls if fewer than 10 rated
    const padded: (number | null)[] = [...ranked]
    while (padded.length < 10) padded.push(null)
    setOrder(padded)
    setSubmitted(false)
    setError(null)
  }

  const canAutoFill = myRatings.length > 0

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
    <div className="space-y-5">
      {/* Optional: auto-fill from per-act Rate scores */}
      {canAutoFill && (
        <button
          type="button"
          onClick={autoFillFromRate}
          className="w-full rounded-2xl border border-dashed border-white/25 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-sm transition px-4 py-3 text-left"
        >
          <p className="text-white font-bold text-sm flex items-center gap-2">
            <span className="text-base">✨</span>
            {lang === "ru" ? "Авто-заполнить из моих оценок" : "Auto-fill from my Rate scores"}
          </p>
          <p className="text-white/55 text-xs mt-0.5">
            {lang === "ru"
              ? `На основе ${myRatings.length} оценок: топ-10 → 12, 10, 8, 7, 6, 5, 4, 3, 2, 1. Потом можно подправить руками.`
              : `Uses your ${myRatings.length} ratings: top 10 → 12, 10, 8, 7, 6, 5, 4, 3, 2, 1. You can tweak after.`}
          </p>
        </button>
      )}

      {/* Table: points | country combobox */}
      <section className="card-light !p-3 md:!p-4 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-black/80 text-sm uppercase tracking-widest">
            {lang === "ru" ? "Твой топ-10" : "Your top 10"}
          </h2>
          <span className="text-xs text-black/45 font-mono tabular-nums">{filled.length}/10</span>
        </div>

        <div className="space-y-2">
          {POINTS.map((p, i) => {
            const isTwelve = p === 12
            return (
              <div
                key={p}
                className={`flex items-center gap-2.5 rounded-2xl p-1.5 ${
                  isTwelve ? "bg-gradient-to-r from-[color:var(--gold)]/25 to-transparent" : ""
                }`}
              >
                <span
                  className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums ${
                    isTwelve
                      ? "w-11 h-11 bg-[color:var(--gold)] text-black text-lg shadow-md shadow-[color:var(--gold)]/40"
                      : "w-10 h-10 bg-black text-white text-sm"
                  }`}
                >
                  {p}
                </span>
                <div className="flex-1 min-w-0">
                  <CountryCombobox
                    value={order[i]}
                    onChange={(id) => setSlot(i, id)}
                    contestants={contestants}
                    disabledIds={order.filter((x): x is number => x !== null)}
                    placeholder={
                      isTwelve
                        ? lang === "ru" ? "Главный фаворит" : "Top pick"
                        : lang === "ru" ? "Выбери страну" : "Select country"
                    }
                    lang={lang}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {filled.length > 0 && (
          <button
            onClick={onReset}
            className="text-black/45 hover:text-black/75 text-xs underline underline-offset-2 mt-1 px-1"
          >
            {lang === "ru" ? "Сбросить" : "Reset all picks"}
          </button>
        )}
      </section>

      {error && (
        <p className="text-red-300 text-sm">
          {error.startsWith("DUPLICATE_") || error === "INCOMPLETE_POINTS" || error === "BAD_CONTESTANT"
            ? lang === "ru"
              ? "Ошибка в выборе — проверь, что нет повторов."
              : "Validation error — make sure there are no duplicates."
            : error}
        </p>
      )}

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
            ? lang === "ru" ? "Сохраняем…" : "Saving…"
            : submitted
              ? lang === "ru" ? "Обновить" : "Update submission"
              : complete
                ? lang === "ru" ? "Отправить 12 баллов" : "Submit 12 points"
                : lang === "ru"
                  ? `Осталось выбрать ${remaining}`
                  : `Pick ${remaining} more to submit`}
        </button>

        {submitted && (
          <div className="space-y-2">
            <Link
              href={`/r/${roomCode}/results`}
              className="block text-center rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/15 hover:bg-[color:var(--gold)]/25 transition px-5 py-4"
            >
              <p className="text-[color:var(--gold)] font-bold">
                ✓ {lang === "ru" ? "Отправлено · смотри лидерборд" : "Submitted · see leaderboard"} →
              </p>
              <p className="text-white/70 text-xs mt-1">
                {lang === "ru"
                  ? "Твои 12 баллов уже в зачёте комнаты."
                  : "Your 12 points are in the room totals."}
              </p>
            </Link>
            {myVoterId && (
              <a
                href={`/r/${roomCode}/story/${myVoterId}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] transition px-5 py-3"
              >
                <p className="text-white font-bold text-sm">
                  📸 {lang === "ru" ? "Картинка для сторис (1080×1920)" : "Download story image (1080×1920)"}
                </p>
                <p className="text-white/55 text-xs mt-0.5">
                  {lang === "ru"
                    ? "Открой, сохрани, кидай в инсту."
                    : "Open, save, post to Instagram."}
                </p>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
