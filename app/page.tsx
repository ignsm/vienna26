import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { RecentRoomsList } from "@/components/RecentRoomsList"
import { createSoloRoom } from "@/lib/actions/rooms"

export default async function HomePage() {
  const { lang, t } = await getT()
  return (
    <main className="min-h-dvh flex flex-col items-center safe-x pt-16 pb-6 gap-8 text-center">
      <div className="space-y-3">
        <p className="text-white/70 text-sm tracking-[0.2em] uppercase">{t("brand.tagline")}</p>
        <h1 className="headline-display text-5xl md:text-7xl">
          <span className="text-[color:var(--pink)]">vienna</span>
          <span className="text-white">26</span>
        </h1>
        <p className="text-white/80 max-w-md mx-auto text-lg">{t("home.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/create" className="pill-pink flex-1 text-base">
            {t("home.create")}
          </Link>
          <Link href="/join" className="pill-outline flex-1 text-base">
            {t("home.join")}
          </Link>
        </div>
        <form action={createSoloRoom}>
          <button type="submit" className="w-full text-white/55 hover:text-white text-xs underline underline-offset-2 py-1">
            {t("home.solo")}
          </button>
        </form>
      </div>

      <RecentRoomsList lang={lang} />

      <p className="text-white/40 text-xs">{t("home.footer")}</p>

      <Link href="/global" className="text-white/40 hover:text-white text-xs underline underline-offset-2">
        Global leaderboard →
      </Link>
    </main>
  )
}
