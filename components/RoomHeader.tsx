"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { IconUsers, IconShare, IconCheck, IconSettings, IconClose } from "@/components/icons"
import { setLang } from "@/lib/i18n/actions"
import type { Lang } from "@/lib/i18n/dict"

type Props = {
  roomCode: string
  roomName: string | null
  meId: string
  meName: string
  voters: { id: string; displayName: string }[]
  isHost: boolean
  realResultsReady: boolean
  lang: Lang
}

type OpenPopover = "jurors" | "settings" | null

export function RoomHeader({ roomCode, roomName, meId, voters, isHost, realResultsReady, lang }: Props) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState<OpenPopover>(null)
  const [, startTransition] = useTransition()
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeIfOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(null)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
    }
    document.addEventListener("mousedown", closeIfOutside)
    document.addEventListener("touchstart", closeIfOutside)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", closeIfOutside)
      document.removeEventListener("touchstart", closeIfOutside)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const onShare = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : ""
    try {
      if (navigator.share) {
        await navigator.share({ title: `vienna26 · ${roomCode}`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  const t = (k: string) => {
    const en: Record<string, string> = {
      jurors: "Jurors",
      settings: "Settings",
      language: "Language",
      admin: "Admin",
      tv: "TV view",
      vs: "vs Reality",
      you: "you",
    }
    const ru: Record<string, string> = {
      jurors: "Жюри",
      settings: "Настройки",
      language: "Язык",
      admin: "Админка",
      tv: "TV-режим",
      vs: "vs Реальность",
      you: "ты",
    }
    return (lang === "ru" ? ru : en)[k] ?? k
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10" ref={headerRef}>
      <div className="safe-x py-2.5 max-w-2xl mx-auto flex items-center gap-2 relative">
        <Link href="/" className="text-white/90 hover:text-white text-base font-bold shrink-0 leading-none">
          vienna<span className="text-[color:var(--pink)]">26</span>
        </Link>
        {roomName && (
          <span className="text-white/65 text-xs font-medium truncate hidden sm:inline">· {roomName}</span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setOpen((o) => (o === "jurors" ? null : "jurors"))}
            className={`h-9 px-2.5 rounded-full text-xs flex items-center gap-1.5 transition ${
              open === "jurors" ? "bg-white/25 text-white" : "bg-white/10 hover:bg-white/20 text-white/90"
            }`}
            aria-expanded={open === "jurors"}
            aria-label={t("jurors")}
          >
            <IconUsers size={16} />
            <span className="font-mono tabular-nums">{voters.length}</span>
          </button>

          <button
            onClick={onShare}
            className="h-9 px-3 rounded-full bg-white text-black hover:bg-white/90 active:bg-white/80 text-xs font-bold flex items-center gap-2 transition shadow-md"
            aria-label="Share invite link"
          >
            {copied ? <IconCheck size={14} /> : <IconShare size={14} />}
            <span className="font-mono tracking-widest text-sm">{roomCode}</span>
          </button>

          <button
            onClick={() => setOpen((o) => (o === "settings" ? null : "settings"))}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
              open === "settings" ? "bg-white/25 text-white" : "bg-white/10 hover:bg-white/20 text-white/85"
            }`}
            aria-expanded={open === "settings"}
            aria-label={t("settings")}
          >
            <IconSettings size={16} />
          </button>
        </div>

        {open === "jurors" && (
          <div
            role="menu"
            className="absolute right-3 top-full mt-1.5 z-50 w-[240px] rounded-2xl bg-black/95 backdrop-blur border border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <p className="text-white/45 text-[10px] uppercase tracking-widest">{t("jurors")} · {voters.length}</p>
              <button onClick={() => setOpen(null)} className="text-white/45 hover:text-white" aria-label="Close">
                <IconClose size={14} />
              </button>
            </div>
            <div className="max-h-[260px] overflow-y-auto py-1">
              {voters.map((v) => (
                <div
                  key={v.id}
                  className={`px-3 py-1.5 text-sm flex items-center gap-2 ${
                    v.id === meId ? "text-white font-medium" : "text-white/80"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--pink)] shrink-0 opacity-80" />
                  <span className="truncate">{v.displayName}</span>
                  {v.id === meId && <span className="ml-auto text-[10px] text-white/45">{t("you")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {open === "settings" && (
          <div
            role="menu"
            className="absolute right-3 top-full mt-1.5 z-50 w-[220px] rounded-2xl bg-black/95 backdrop-blur border border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <p className="text-white/45 text-[10px] uppercase tracking-widest">{t("settings")}</p>
              <button onClick={() => setOpen(null)} className="text-white/45 hover:text-white" aria-label="Close">
                <IconClose size={14} />
              </button>
            </div>

            {/* Language switcher — always visible */}
            <div className="p-2 border-b border-white/10">
              <p className="text-white/40 text-[10px] uppercase tracking-widest px-1.5 mb-1">{t("language")}</p>
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-full bg-white/5">
                {(["en", "ru"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => startTransition(() => setLang(l))}
                    className={`h-7 rounded-full text-xs font-bold transition ${
                      lang === l ? "bg-white text-black" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-1.5 space-y-0.5">
              {realResultsReady && (
                <Link
                  href={`/r/${roomCode}/vs-reality`}
                  onClick={() => setOpen(null)}
                  className="block px-2.5 py-2 rounded-lg bg-[color:var(--gold)]/15 text-[color:var(--gold)] text-sm font-medium hover:bg-[color:var(--gold)]/25"
                >
                  {t("vs")}
                </Link>
              )}
              {isHost && (
                <>
                  <Link
                    href={`/admin/${roomCode}`}
                    onClick={() => setOpen(null)}
                    className="block px-2.5 py-2 rounded-lg hover:bg-white/10 text-white/85 text-sm"
                  >
                    {t("admin")}
                  </Link>
                  <Link
                    href={`/host/${roomCode}`}
                    onClick={() => setOpen(null)}
                    className="block px-2.5 py-2 rounded-lg hover:bg-white/10 text-white/85 text-sm"
                  >
                    {t("tv")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
