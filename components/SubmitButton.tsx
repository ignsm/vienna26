"use client"

import { useFormStatus } from "react-dom"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Submit button bound to the parent <form action={...}> via useFormStatus.
 * Shows a spinner and disables itself while the server action is in flight,
 * so the user doesn't think the app froze on slow connections (the
 * round-trip from Japan to Neon EU-West-2 is ~700-900 ms).
 */
export function SubmitButton({ children, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} relative disabled:opacity-70 disabled:cursor-wait`}
    >
      <span className={pending ? "invisible" : ""}>{children}</span>
      {pending && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Spinner />
        </span>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
