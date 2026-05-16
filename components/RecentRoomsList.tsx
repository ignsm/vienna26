"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const KEY = "v26:recent-rooms"

type Entry = {
  code: string
  name: string | null
  meName: string
  lastVisitedAt: number
}

export function RecentRoomsList({ lang }: { lang: "en" | "ru" }) {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const list = JSON.parse(raw) as Entry[]
      setEntries(list.slice(0, 5))
    } catch {}
  }, [])

  if (entries.length === 0) return null

  const title = lang === "ru" ? "Вернуться в комнату" : "Jump back in"

  return (
    <div className="w-full max-w-md space-y-2">
      <p className="text-white/45 text-[10px] uppercase tracking-widest text-center">{title}</p>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <Link
            key={e.code}
            href={`/r/${e.code}`}
            className="block rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/10 transition px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-base tracking-widest text-white font-bold">{e.code}</span>
              <div className="flex-1 min-w-0">
                {e.name && <div className="text-white/85 text-sm truncate">{e.name}</div>}
                <div className="text-white/45 text-xs truncate">
                  {lang === "ru" ? "как" : "as"} {e.meName}
                </div>
              </div>
              <span className="text-white/40 text-base">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
