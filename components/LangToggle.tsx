"use client"

import { useTransition } from "react"
import { setLang } from "@/lib/i18n/actions"
import type { Lang } from "@/lib/i18n/dict"

export function LangToggle({ current }: { current: Lang }) {
  const [pending, start] = useTransition()
  const next: Lang = current === "en" ? "ru" : "en"

  return (
    <button
      onClick={() => start(() => setLang(next))}
      disabled={pending}
      className="pill bg-black/40 backdrop-blur-sm border border-white/15 text-white/90 text-xs px-3 py-1.5 hover:bg-black/60 transition disabled:opacity-50"
      aria-label="Toggle language"
      title="Toggle language"
    >
      <span className={current === "en" ? "font-bold text-white" : "text-white/50"}>EN</span>
      <span className="mx-1 text-white/40">/</span>
      <span className={current === "ru" ? "font-bold text-white" : "text-white/50"}>RU</span>
    </button>
  )
}
