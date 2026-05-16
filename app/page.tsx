import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { RecentRoomsList } from "@/components/RecentRoomsList"

export default async function HomePage() {
  const { lang, t } = await getT()
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center safe-x py-10 gap-8 text-center">
      <div className="space-y-3">
        <p className="text-white/70 text-sm tracking-[0.2em] uppercase">{t("brand.tagline")}</p>
        <h1 className="headline-display text-5xl md:text-7xl">
          <span className="text-[color:var(--pink)]">vienna</span>
          <span className="text-white">26</span>
        </h1>
        <p className="text-white/80 max-w-md mx-auto text-lg">{t("home.subtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link href="/create" className="pill-pink flex-1 text-base">
          {t("home.create")}
        </Link>
        <Link href="/join" className="pill-outline flex-1 text-base">
          {t("home.join")}
        </Link>
      </div>

      <RecentRoomsList lang={lang} />

      <p className="text-white/40 text-xs">{t("home.footer")}</p>

      <Link href="/global" className="text-white/40 hover:text-white text-xs underline underline-offset-2">
        Global leaderboard →
      </Link>
    </main>
  )
}
