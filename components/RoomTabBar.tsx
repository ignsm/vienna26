import Link from "next/link"
import type { Route } from "next"
import { IconStar, IconChart, IconTrophy } from "@/components/icons"

type Tab = "vote" | "results" | "douze"

type Props = {
  roomCode: string
  active: Tab
  douzeSubmitted: boolean
  douzePicks: number
  votesCount: number
  totalActs: number
  lang: "en" | "ru"
}

const COPY = {
  en: { vote: "Rate", results: "Top", douze: "12 pts" },
  ru: { vote: "Оценки", results: "Топ", douze: "12 б." },
} as const

const ICONS: Record<Tab, React.ComponentType<{ size?: number; className?: string }>> = {
  vote: IconStar,
  results: IconChart,
  douze: IconTrophy,
}

export function RoomTabBar({
  roomCode,
  active,
  douzeSubmitted,
  douzePicks,
  votesCount,
  totalActs,
  lang,
}: Props) {
  const c = COPY[lang]
  const tabs: { id: Tab; href: Route; label: string; badge?: string }[] = [
    {
      id: "vote",
      href: `/r/${roomCode}` as Route,
      label: c.vote,
      badge: votesCount > 0 ? `${votesCount}/${totalActs}` : undefined,
    },
    {
      id: "douze",
      href: `/r/${roomCode}/douze` as Route,
      label: c.douze,
      badge: douzeSubmitted ? "✓" : douzePicks > 0 ? `${douzePicks}/10` : undefined,
    },
    { id: "results", href: `/r/${roomCode}/results` as Route, label: c.results },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/95 via-black/80 to-black/30 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-label="Room sections"
    >
      <div className="safe-x-tight pt-2 max-w-2xl mx-auto grid grid-cols-3 gap-2">
        {tabs.map((t) => {
          const Icon = ICONS[t.id]
          const isActive = t.id === active
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl transition active:scale-95 ${
                isActive
                  ? "bg-[color:var(--pink)] text-white shadow-md shadow-[color:var(--pink)]/30"
                  : "bg-white/[0.08] text-white/85 hover:bg-white/[0.15]"
              }`}
            >
              <Icon size={18} />
              <span className="flex items-center gap-1 leading-none">
                <span className="text-[11px] font-bold tracking-wide">{t.label}</span>
                {t.badge && (
                  <span
                    className={`text-[9px] font-mono leading-none px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/25 text-white" : "bg-white/15 text-white/70"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
