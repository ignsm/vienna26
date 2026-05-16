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

const MOBILE_BREAKPOINT = "(max-width: 639px)" // matches Tailwind's sm:

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
  const [isMobile, setIsMobile] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = value !== null ? contestants.find((c) => c.id === value) : null
  const disabledSet = new Set(disabledIds)

  // Detect viewport once on mount and keep in sync on resize / orientation flip.
  // Mobile path uses a fullscreen modal so the picker doesn't get covered by the
  // virtual keyboard or clipped at the bottom of the page.
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(MOBILE_BREAKPOINT)
    setIsMobile(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Outside-click + Escape for desktop popover. Mobile modal owns Escape via its
  // own keydown listener (below) so we don't double-handle.
  useEffect(() => {
    if (!open || isMobile) return
    const outside = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", outside)
    document.addEventListener("touchstart", outside)
    document.addEventListener("keydown", esc)
    setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      document.removeEventListener("mousedown", outside)
      document.removeEventListener("touchstart", outside)
      document.removeEventListener("keydown", esc)
    }
  }, [open, isMobile])

  // Mobile modal: lock body scroll, focus input, listen for Escape.
  useEffect(() => {
    if (!open || !isMobile) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", esc)
    // Slight delay lets the modal mount + transition before keyboard pops up.
    const timer = setTimeout(() => inputRef.current?.focus(), 80)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", esc)
      clearTimeout(timer)
    }
  }, [open, isMobile])

  // When the modal closes, clear the search query so the next open starts fresh.
  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const pick = (id: number) => {
    onChange(id)
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
  }

  const filtered = contestants.filter((c) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      c.country.toLowerCase().includes(q) ||
      c.artist.toLowerCase().includes(q) ||
      c.song.toLowerCase().includes(q) ||
      String(c.id) === q
    )
  })

  // Reusable list row — same markup for desktop popover and mobile modal so the
  // visual treatment of selected / disabled stays in sync.
  const renderItem = (c: Contestant) => {
    const isDisabled = disabledSet.has(c.id) && c.id !== value
    const isSelected = c.id === value
    return (
      <Command.Item
        key={c.id}
        value={`${c.country} ${c.artist} ${c.song} ${c.id}`}
        disabled={isDisabled}
        onSelect={() => !isDisabled && pick(c.id)}
        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer ${
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
  }

  return (
    <div className="relative w-full" ref={wrapRef}>
      <div
        className={`w-full h-12 rounded-xl flex items-center transition border ${
          selected
            ? "bg-white border-black/10 text-black"
            : "bg-black/[0.04] border-dashed border-black/15 text-black/60 hover:bg-black/[0.07]"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 h-full flex items-center gap-2.5 px-3 text-left"
        >
          {selected ? (
            <>
              <span className="text-xl shrink-0">{selected.flag}</span>
              <span className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-black truncate block">{selected.country}</span>
                <span className="text-[11px] text-black/55 truncate block">{selected.artist}</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">
                {placeholder ?? (lang === "ru" ? "Выбери страну" : "Select country")}
              </span>
              <IconChevronRight size={14} className="text-black/40" />
            </>
          )}
        </button>
        {selected && (
          <button
            type="button"
            onClick={clear}
            className="text-black/35 hover:text-black/80 px-3 h-full shrink-0"
            aria-label="Clear"
          >
            <IconClose size={14} />
          </button>
        )}
      </div>

      {/* Desktop popover: positioned under the trigger, max ~260px tall. */}
      {open && !isMobile && (
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
              {filtered.map(renderItem)}
            </Command.List>
          </Command>
        </div>
      )}

      {/* Mobile: fullscreen modal with sticky search header + scrollable list.
          Survives virtual keyboard (uses dvh so layout reflows when keyboard
          shows). Body scroll is locked while open. */}
      {open && isMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "ru" ? "Выбор страны" : "Country picker"}
          className="fixed inset-0 z-50 bg-white text-black flex flex-col"
          style={{ height: "100dvh" }}
        >
          <Command label="Country" shouldFilter={false} className="flex flex-col h-full">
            <header
              className="shrink-0 border-b border-black/10 bg-white"
              style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-black/55 hover:bg-black/[0.06]"
                  aria-label={lang === "ru" ? "Закрыть" : "Close"}
                >
                  <IconClose size={18} />
                </button>
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder={lang === "ru" ? "Найти страну или артиста…" : "Search country or artist…"}
                  className="flex-1 h-10 bg-black/[0.04] rounded-xl px-3 outline-none text-base text-black placeholder:text-black/40 focus:bg-black/[0.06]"
                  autoFocus
                />
              </div>
            </header>
            <Command.List
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),8px)]"
            >
              <Command.Empty className="px-3 py-10 text-center text-sm text-black/40">
                {lang === "ru" ? "Ничего не найдено" : "No matches"}
              </Command.Empty>
              {filtered.map(renderItem)}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  )
}
