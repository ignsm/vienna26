"use client"

import Link from "next/link"

type Props = {
  roomCode: string
  mySubmittedDouze: boolean
  myVotesCount: number
  totalActs: number
  lang: "en" | "ru"
}

const COPY = {
  en: {
    allRated: "All 25 rated · time for your 12 points",
    allRatedHint: "Distribute 12, 10, 8, ..., 1 across your top 10. Final round.",
    submitted: "Your 12 points are in · see leaderboard",
    submittedHint: "Per-act scores keep going if you want to revise.",
    progress: (n: number, t: number) => `${n} / ${t} acts rated`,
    skipToDouze: "skip to 12 points →",
  },
  ru: {
    allRated: "Все 25 оценены · теперь раздай свои 12 баллов",
    allRatedHint: "Распредели 12, 10, 8, ..., 1 на свой топ-10. Финальный раунд.",
    submitted: "Твои 12 баллов отправлены · смотри лидерборд",
    submittedHint: "Оценки за номера можно править дальше — не блокируется.",
    progress: (n: number, t: number) => `${n} / ${t} номеров оценено`,
    skipToDouze: "сразу к 12 баллам →",
  },
} as const

export function RoundBanner({ roomCode, mySubmittedDouze, myVotesCount, totalActs, lang }: Props) {
  const c = COPY[lang]

  // State C — already submitted douze. Calm gold "see leaderboard" CTA.
  if (mySubmittedDouze) {
    return (
      <Link
        href={`/r/${roomCode}/results`}
        className="block rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/15 hover:bg-[color:var(--gold)]/25 transition px-5 py-4 mb-6"
      >
        <p className="text-[color:var(--gold)] font-bold text-base md:text-lg">✓ {c.submitted} →</p>
        <p className="text-white/70 text-xs md:text-sm mt-0.5">{c.submittedHint}</p>
      </Link>
    )
  }

  // State B — all 25 rated, douze not submitted yet. Pulsing pink CTA.
  if (myVotesCount >= totalActs) {
    return (
      <Link
        href={`/r/${roomCode}/douze`}
        className="block rounded-2xl bg-[color:var(--pink)] hover:brightness-110 transition px-5 py-4 mb-6 shadow-lg shadow-[color:var(--pink)]/30 animate-pulse-soft"
      >
        <p className="text-white font-bold text-base md:text-lg">🏆 {c.allRated} →</p>
        <p className="text-white/85 text-xs md:text-sm mt-0.5">{c.allRatedHint}</p>
      </Link>
    )
  }

  // State A — still rating. Quiet progress strip + a skip-to-douze shortcut.
  return (
    <div className="flex items-center justify-between text-xs text-white/50 mb-6">
      <span>{c.progress(myVotesCount, totalActs)}</span>
      <Link
        href={`/r/${roomCode}/douze`}
        className="text-white/60 hover:text-[color:var(--pink)] underline underline-offset-2"
      >
        {c.skipToDouze}
      </Link>
    </div>
  )
}
