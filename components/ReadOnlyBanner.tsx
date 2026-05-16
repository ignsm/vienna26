import { READ_ONLY } from "@/lib/feature-flags"
import type { Lang } from "@/lib/i18n/dict"

/**
 * Site-wide notice when voting is closed. Server-rendered so it appears even
 * if JS hasn't loaded yet. Positioned at the top of <body>, sticky under any
 * fixed chrome via z-index above content but below modals.
 */
export function ReadOnlyBanner({ lang }: { lang: Lang }) {
  if (!READ_ONLY) return null
  const msg =
    lang === "ru"
      ? "Голосование закрыто · скоро покажем как реальный финал лёг на твой топ"
      : "Voting closed · we'll line up your top against the real final shortly"
  return (
    <div className="sticky top-0 z-[55] bg-[color:var(--gold)]/95 text-black text-xs font-medium px-4 py-2 text-center backdrop-blur-sm border-b border-black/10">
      {msg}
    </div>
  )
}
