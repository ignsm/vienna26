import Link from "next/link"
import { getT } from "@/lib/i18n/server"
import { RecentRoomsList } from "@/components/RecentRoomsList"
import { SubmitButton } from "@/components/SubmitButton"
import { createSoloRoom } from "@/lib/actions/rooms"
import { IconChart } from "@/components/icons"
import { READ_ONLY } from "@/lib/feature-flags"

export default async function HomePage() {
  const { lang, t } = await getT()
  return (
    <main className="min-h-dvh flex flex-col items-center safe-x pt-16 pb-6 gap-8 text-center">
      <div className="space-y-3">
        <p className="text-white/70 text-sm tracking-[0.2em] uppercase">{t("brand.tagline")}</p>
        <h1 className="headline-display text-5xl md:text-7xl">
          <span className="text-[color:var(--pink)]">Banga</span>
          <span className="text-white">ranga</span>
        </h1>
        <p className="text-white/80 max-w-md mx-auto text-lg">{t("home.subtitle")}</p>
      </div>

      {READ_ONLY ? (
        <div className="w-full max-w-sm rounded-2xl bg-white/[0.06] border border-white/15 px-5 py-4 text-center space-y-3">
          <div className="space-y-1">
            <p className="text-white/90 text-sm font-semibold">
              {lang === "ru" ? "Голосование закрыто" : "Voting closed"}
            </p>
            <p className="text-white/60 text-xs leading-snug">
              {lang === "ru"
                ? "Уже зашёл в комнату? Открой её по своей ссылке — твой топ и сравнение с реальностью будут видны."
                : "Already in a room? Open your room link — your top and reality comparison are live."}
            </p>
          </div>
          <Link
            href="/global"
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 px-4 py-2 text-white/85 hover:text-white text-xs font-medium transition"
          >
            <IconChart size={14} className="text-[color:var(--pink)]" />
            <span>{lang === "ru" ? "Глобальный лидерборд" : "Global leaderboard"}</span>
          </Link>
        </div>
      ) : (
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
            <SubmitButton className="w-full text-white/55 hover:text-white text-xs underline underline-offset-2 py-1">
              {t("home.solo")}
            </SubmitButton>
          </form>
        </div>
      )}

      <RecentRoomsList lang={lang} />

      {/* Footer area: browse + brand. Spacer pushes them to viewport bottom. */}
      <div className="mt-auto w-full flex flex-col items-center gap-4">
        <p className="text-white/40 text-xs">{t("home.footer")}</p>

        {!READ_ONLY && (
          // Global leaderboard is a BROWSE action, not a creation one — give
          // it its own bordered-pill language so it doesn't read as a third
          // tier of the "I'm alone →" action text right above. When READ_ONLY
          // the same link lives inside the closed-state card instead.
          <Link
            href="/global"
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-4 py-2 text-white/85 hover:text-white text-xs font-medium transition"
          >
            <IconChart size={14} className="text-[color:var(--pink)]" />
            <span>{lang === "ru" ? "Глобальный лидерборд" : "Global leaderboard"}</span>
          </Link>
        )}
      </div>
    </main>
  )
}
