"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * Smart polling for live-updating pages.
 *
 * Behavior:
 *   - default interval N ms, backs off to 2N after `idleThresholdMs` of no
 *     interaction, and to 3N after 2× that. Resets to N on any user activity.
 *   - PAUSES entirely when the tab is hidden (saves ~all polling cost while
 *     people are mid-show with the tab in background).
 *   - Fires an immediate refresh on visibilitychange → visible so users see
 *     fresh state the moment they switch back.
 *
 * Saves a ton of DB compute on free-tier Postgres without sacrificing UX
 * during active viewing.
 */
type Props = {
  intervalMs?: number
  idleThresholdMs?: number
  maxBackoff?: number
}

export function PollingRefresh({
  intervalMs = 5000,
  idleThresholdMs = 60_000,
  maxBackoff = 3,
}: Props) {
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const onActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const compute = () => {
      const idle = Date.now() - lastActivityRef.current
      const factor = Math.min(maxBackoff, 1 + Math.floor(idle / idleThresholdMs))
      return intervalMs * factor
    }

    const tick = () => {
      if (cancelled) return
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        // paused; reschedule a tiny check to re-evaluate
        timer = setTimeout(tick, 5000)
        return
      }
      router.refresh()
      timer = setTimeout(tick, compute())
    }

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        lastActivityRef.current = Date.now()
        if (timer) clearTimeout(timer)
        // Immediate refresh on come-back, then resume normal cadence.
        router.refresh()
        timer = setTimeout(tick, compute())
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", onActivity, { passive: true })
      window.addEventListener("keydown", onActivity)
      window.addEventListener("scroll", onActivity, { passive: true })
      document.addEventListener("visibilitychange", onVisibility)
    }

    timer = setTimeout(tick, compute())

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (typeof window !== "undefined") {
        window.removeEventListener("pointerdown", onActivity)
        window.removeEventListener("keydown", onActivity)
        window.removeEventListener("scroll", onActivity)
        document.removeEventListener("visibilitychange", onVisibility)
      }
    }
  }, [intervalMs, idleThresholdMs, maxBackoff, router])

  return null
}
