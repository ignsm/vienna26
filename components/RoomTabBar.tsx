import Link from "next/link"

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
  en: { vote: "Vote", results: "Top", douze: "12 pts" },
  ru: { vote: "Голос", results: "Топ", douze: "12 б." },
} as const

export function RoomTabBar({ roomCode, active, douzeSubmitted, douzePicks, votesCount, totalActs, lang }: Props) {
  const c = COPY[lang]
  const tabs: { id: Tab; href: string; label: string; badge?: string }[] = [
    {
      id: "vote",
      href: `/r/${roomCode}`,
      label: c.vote,
      badge: votesCount > 0 ? `${votesCount}/${totalActs}` : undefined,
    },
    {
      id: "results",
      href: `/r/${roomCode}/results`,
      label: c.results,
    },
    {
      id: "douze",
      href: `/r/${roomCode}/douze`,
      label: c.douze,
      badge: douzeSubmitted ? "✓" : douzePicks > 0 ? `${douzePicks}/10` : undefined,
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-label="Room sections"
    >
      <div className="max-w-2xl mx-auto px-3 pt-2 grid grid-cols-3 gap-2">
        {tabs.map((t) => {
          const isActive = t.id === active
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`relative flex items-center justify-center gap-1.5 h-11 rounded-2xl transition ${
                isActive
                  ? "bg-[color:var(--pink)] text-white shadow-md shadow-[color:var(--pink)]/30"
                  : "bg-white/8 text-white/80 hover:bg-white/15"
              }`}
            >
              <span className="text-sm font-bold tracking-wide leading-none">{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[10px] font-mono leading-none px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/25 text-white" : "bg-white/15 text-white/70"
                  }`}
                >
                  {t.badge}
                </span>
              )}
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
