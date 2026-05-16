"use client"

import Link from "next/link"

type Props = {
  roomCode: string
  mySubmittedDouze: boolean
  myVotesCount: number
  totalActs: number
  lang: "en" | "ru"
}

/**
 * Big CTA shown only at the meaningful transition points:
 *   - all 25 rated, douze not submitted: pulsing pink "time for 12 points"
 *   - douze submitted: calm gold "see leaderboard"
 *   - otherwise: nothing (progress shown in header strip + tab bar)
 */
export function RoundBanner({ roomCode, mySubmittedDouze, myVotesCount, totalActs, lang }: Props) {
  if (mySubmittedDouze) {
    return (
      <Link
        href={`/r/${roomCode}/results`}
        className="block rounded-2xl border border-[color:var(--gold)]/45 bg-[color:var(--gold)]/15 hover:bg-[color:var(--gold)]/25 transition px-5 py-3.5 mb-4"
      >
        <p className="text-[color:var(--gold)] font-bold text-sm md:text-base">
          ✓ {lang === "ru" ? "12 баллов отправлены · смотри лидерборд" : "12 points submitted · see leaderboard"} →
        </p>
      </Link>
    )
  }

  if (myVotesCount >= totalActs) {
    return (
      <Link
        href={`/r/${roomCode}/douze`}
        className="block rounded-2xl bg-[color:var(--pink)] hover:brightness-110 transition px-5 py-3.5 mb-4 shadow-lg shadow-[color:var(--pink)]/40 animate-pulse-soft"
      >
        <p className="text-white font-bold text-base md:text-lg leading-tight">
          🏆 {lang === "ru" ? "Все 25 оценены — раздай свои 12 баллов!" : "All 25 rated — distribute your 12 points!"}
        </p>
        <p className="text-white/85 text-xs mt-1">
          {lang === "ru"
            ? "12 → топ-1, 10 → 2-му, потом 8, 7, 6, 5, 4, 3, 2, 1."
            : "12 to the winner, then 10, 8, 7, 6, 5, 4, 3, 2, 1."}
        </p>
      </Link>
    )
  }

  return null
}
