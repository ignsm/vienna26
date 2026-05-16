"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Bumps the route every `intervalMs` so server components re-fetch.
 * Used to fake realtime on the leaderboard and host TV view.
 */
export function PollingRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(t)
  }, [router, intervalMs])
  return null
}
