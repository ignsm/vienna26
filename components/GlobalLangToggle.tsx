"use client"

import { usePathname } from "next/navigation"
import { LangToggle } from "@/components/LangToggle"
import type { Lang } from "@/lib/i18n/dict"

// Hide on app-internal screens to avoid colliding with sticky headers and bottom tabs.
const HIDDEN_PREFIXES = [/^\/r\//, /^\/admin\//, /^\/host\//]

export function GlobalLangToggle({ current }: { current: Lang }) {
  const pathname = usePathname() ?? ""
  if (HIDDEN_PREFIXES.some((re) => re.test(pathname))) return null
  return (
    <div className="fixed top-3 right-3 z-50">
      <LangToggle current={current} />
    </div>
  )
}
