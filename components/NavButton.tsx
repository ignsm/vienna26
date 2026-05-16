"use client"

import { useRouter } from "next/navigation"
import { useTransition, type ReactNode } from "react"
import type { Route } from "next"

type Props = {
  href: Route
  children: ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * Link-shaped button that owns its own pending state via useTransition + router.push.
 * Use this in place of <Link> when the destination route is slow enough that the
 * gap between tap and first paint feels broken — typically anything that hits
 * the DB on render (room sub-routes from Tokyo are ~1-2s round-trip).
 *
 * Visual: button label fades to invisible while pending, a centered spinner
 * occupies the same box (no layout shift), button is disabled (anti double-tap).
 */
export function NavButton({ href, children, className, ariaLabel }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-busy={pending}
      disabled={pending}
      onClick={() => start(() => router.push(href))}
      className={`${className ?? ""} relative disabled:opacity-80 disabled:cursor-wait`}
    >
      <span className={pending ? "invisible" : ""}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  )
}
