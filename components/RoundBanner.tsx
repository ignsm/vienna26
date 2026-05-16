"use client"

import type { Route } from "next"
import { NavButton } from "@/components/NavButton"

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
 *
 * Uses NavButton (router.push + useTransition) instead of Link so the user
 * sees an immediate spinner while the heavy room sub-route is fetched.
 * From Tokyo the trip to EU-West-2 Neon is ~1-2s.
 */
export function RoundBanner({ roomCode, mySubmittedDouze, myVotesCount, totalActs, lang }: Props) {
  if (mySubmittedDouze) {
    return (
      <NavButton
        href={`/r/${roomCode}/results` as Route}
        className="block w-full text-left rounded-2xl border border-[color:var(--gold)]/45 bg-[color:var(--gold)]/15 hover:bg-[color:var(--gold)]/25 transition px-5 py-3.5 mb-4"
      >
        <p className="text-[color:var(--gold)] font-bold text-sm md:text-base">
          ✓ {lang === "ru" ? "12 баллов отправлены · смотри лидерборд" : "12 points submitted · see leaderboard"} →
        </p>
      </NavButton>
    )
  }

  if (myVotesCount >= totalActs) {
    return (
      <NavButton
        href={`/r/${roomCode}/douze` as Route}
        className="block w-full text-left rounded-2xl bg-[color:var(--pink)] hover:brightness-110 transition px-5 py-3.5 mb-4 shadow-lg shadow-[color:var(--pink)]/40 animate-pulse-soft"
      >
        <p className="text-white font-bold text-base md:text-lg leading-tight">
          🏆 {lang === "ru" ? "Все 25 оценены — раздай свои 12 баллов!" : "All 25 rated — distribute your 12 points!"}
        </p>
        <p className="text-white/85 text-xs mt-1">
          {lang === "ru"
            ? "12 → топ-1, 10 → 2-му, потом 8, 7, 6, 5, 4, 3, 2, 1."
            : "12 to the winner, then 10, 8, 7, 6, 5, 4, 3, 2, 1."}
        </p>
      </NavButton>
    )
  }

  return null
}
