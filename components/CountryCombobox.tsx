"use client"

import { Command } from "cmdk"
import { useEffect, useRef, useState } from "react"
import type { Contestant } from "@/lib/contestants"
import { IconChevronRight, IconClose } from "@/components/icons"

type Props = {
  value: number | null
  onChange: (id: number | null) => void
  contestants: Contestant[]
  disabledIds?: number[]
  placeholder?: string
  lang?: "en" | "ru"
}

export function CountryCombobox({
  value,
  onChange,
  contestants,
  disabledIds = [],
  placeholder,
  lang = "en",
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = value !== null ? contestants.find((c) => c.id === value) : null
  const disabledSet = new Set(disabledIds)

  useEffect(() => {
    if (!open) return
    const outside = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", outside)
    document.addEventListener("touchstart", outside)
    document.addEventListener("keydown", esc)
    // focus search after opening, with a tick so the animation/scroll settles
    setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      document.removeEventListener("mousedown", outside)
      document.removeEventListener("touchstart", outside)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const pick = (id: number) => {
    onChange(id)
    setOpen(false)
    setQuery("")
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="relative w-full" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-12 rounded-xl flex items-center gap-2.5 px-3 transition border ${
          selected
            ? "bg-white border-black/10 text-black"
            : "bg-black/[0.04] border-dashed border-black/15 text-black/60 hover:bg-black/[0.07]"
        }`}
      >
        {selected ? (
          <>
            <span className="text-xl shrink-0">{selected.flag}</span>
            <span className="flex-1 min-w-0 text-left">
              <span className="text-sm font-semibold text-black truncate block">{selected.country}</span>
              <span className="text-[11px] text-black/55 truncate block">{selected.artist}</span>
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-black/35 hover:text-black/80 px-1.5 shrink-0"
              aria-label="Clear"
            >
              <IconClose size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-left text-sm font-medium">
              {placeholder ?? (lang === "ru" ? "Выбери страну" : "Select country")}
            </span>
            <IconChevronRight size={14} className="text-black/40" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl bg-white border border-black/10 shadow-2xl overflow-hidden">
          <Command label="Country" shouldFilter={false}>
            <div className="px-3 pt-3 pb-2 border-b border-black/[0.06]">
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder={lang === "ru" ? "Найти страну или артиста…" : "Search country or artist…"}
                className="w-full bg-transparent outline-none text-sm text-black placeholder:text-black/40"
              />
            </div>
            <Command.List className="max-h-[260px] overflow-y-auto py-1">
              <Command.Empty className="px-3 py-6 text-center text-sm text-black/40">
                {lang === "ru" ? "Ничего не найдено" : "No matches"}
              </Command.Empty>
              {contestants
                .filter((c) => {
                  if (!query) return true
                  const q = query.toLowerCase()
                  return (
                    c.country.toLowerCase().includes(q) ||
                    c.artist.toLowerCase().includes(q) ||
                    c.song.toLowerCase().includes(q) ||
                    String(c.id) === q
                  )
                })
                .map((c) => {
                  const isDisabled = disabledSet.has(c.id) && c.id !== value
                  const isSelected = c.id === value
                  return (
                    <Command.Item
                      key={c.id}
                      value={`${c.country} ${c.artist} ${c.song} ${c.id}`}
                      disabled={isDisabled}
                      onSelect={() => !isDisabled && pick(c.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "bg-[color:var(--pink)]/15"
                            : "data-[selected=true]:bg-black/[0.05]"
                      }`}
                    >
                      <span className="text-[10px] font-mono tabular-nums w-5 text-right text-black/45">
                        {String(c.id).padStart(2, "0")}
                      </span>
                      <span className="text-xl shrink-0">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black truncate">{c.country}</div>
                        <div className="text-[11px] text-black/55 truncate">
                          {c.artist} · <em>{c.song}</em>
                        </div>
                      </div>
                      {isDisabled && (
                        <span className="text-[10px] text-black/40 italic shrink-0">
                          {lang === "ru" ? "занято" : "taken"}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[color:var(--pink)] text-xs font-bold shrink-0">✓</span>
                      )}
                    </Command.Item>
                  )
                })}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  )
}
