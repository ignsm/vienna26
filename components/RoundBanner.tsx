"use client"

import Link from "next/link"
import { useTransition } from "react"
import { openDouzeRound } from "@/lib/actions/rooms"

type Props = {
  roomCode: string
  isHost: boolean
  douzeOpen: boolean
  mySubmitted: boolean
  myVotesCount: number
  totalActs: number
  lang: "en" | "ru"
}

const COPY = {
  en: {
    hostOpen: "End voting · open the 12-point round",
    hostOpenHint: "Click when everyone has rated all acts. Jurors will be prompted to distribute their 12 points.",
    voterGoDouze: "Final round open · distribute your 12 points",
    voterGoDouzeHint: "Pick your top 10 in order. 12 points to your favourite, 1 to your tenth.",
    submitted: "Your 12 points are in · see leaderboard",
    submittedHint: "Waiting on the rest of the jury, then we'll have the winner.",
    progress: (n: number, t: number) => `${n} of ${t} acts rated`,
  },
  ru: {
    hostOpen: "Закрыть голосование · открыть финал на 12 баллов",
    hostOpenHint: "Нажми когда все оценили все номера. Жюри перейдёт к раздаче 12 баллов.",
    voterGoDouze: "Финал открыт · раздай свои 12 баллов",
    voterGoDouzeHint: "Выбери топ-10 по порядку. 12 баллов фавориту, 1 — десятому.",
    submitted: "Твои 12 баллов отправлены · смотри лидерборд",
    submittedHint: "Ждём остальных, потом узнаем победителя.",
    progress: (n: number, t: number) => `${n} из ${t} номеров оценено`,
  },
} as const

export function RoundBanner({ roomCode, isHost, douzeOpen, mySubmitted, myVotesCount, totalActs, lang }: Props) {
  const c = COPY[lang]
  const [pending, start] = useTransition()

  // State C — already submitted douze. Show calm "see leaderboard" CTA.
  if (douzeOpen && mySubmitted) {
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

  // State B — douze open for me, prominent CTA to /douze.
  if (douzeOpen && !mySubmitted) {
    return (
      <Link
        href={`/r/${roomCode}/douze`}
        className="block rounded-2xl bg-[color:var(--pink)] hover:brightness-110 transition px-5 py-4 mb-6 shadow-lg shadow-[color:var(--pink)]/30 animate-pulse-soft"
      >
        <p className="text-white font-bold text-base md:text-lg">🎤 {c.voterGoDouze} →</p>
        <p className="text-white/80 text-xs md:text-sm mt-0.5">{c.voterGoDouzeHint}</p>
      </Link>
    )
  }

  // State A — host, douze not yet open, big "Open round" action.
  if (isHost && !douzeOpen) {
    return (
      <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-sm px-5 py-4 mb-6">
        <p className="text-white/60 text-xs mb-2">{c.progress(myVotesCount, totalActs)}</p>
        <button
          onClick={() => start(() => openDouzeRound(roomCode))}
          disabled={pending}
          className="block w-full text-left rounded-xl bg-[color:var(--pink)] hover:brightness-110 transition px-4 py-3 disabled:opacity-50"
        >
          <p className="text-white font-bold text-base">{pending ? "…" : c.hostOpen} →</p>
          <p className="text-white/80 text-xs mt-0.5">{c.hostOpenHint}</p>
        </button>
      </div>
    )
  }

  // State A' — non-host, douze not yet open. Just show progress quietly.
  return (
    <p className="text-white/40 text-xs mb-6">{c.progress(myVotesCount, totalActs)}</p>
  )
}
