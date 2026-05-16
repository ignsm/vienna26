import Link from "next/link"
import { joinRoom } from "@/lib/actions/rooms"
import { getT } from "@/lib/i18n/server"

export default async function JoinRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { lang, t } = await getT()
  const sp = await searchParams
  const presetCode = sp.code?.toUpperCase() ?? ""
  const errorMsg =
    sp.error === "not_found"
      ? lang === "ru"
        ? `Комната ${sp.code ?? ""} не найдена. Проверь код.`
        : `Room ${sp.code ?? ""} not found. Check the code.`
      : sp.error === "invalid"
        ? lang === "ru"
          ? "Неверный формат кода или имени."
          : "Invalid code or name format."
        : null

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="card-glass w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="headline-lg text-3xl text-white">{t("join.title")}</h1>
          <p className="text-white/70 text-sm">{t("join.hint")}</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-3 py-2">
            {errorMsg}
          </div>
        )}

        <form action={joinRoom} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-white/80 text-sm font-medium">{t("join.code.label")}</span>
            <input
              name="code"
              required
              minLength={3}
              maxLength={8}
              defaultValue={presetCode}
              placeholder={t("join.code.placeholder")}
              autoFocus={!presetCode}
              className="w-full rounded-pill bg-white text-black px-5 py-3 outline-none focus:ring-2 ring-[color:var(--pink)] uppercase tracking-widest text-center font-mono text-lg"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-white/80 text-sm font-medium">{t("join.name.label")}</span>
            <input
              name="name"
              required
              minLength={1}
              maxLength={32}
              placeholder={t("join.name.placeholder")}
              autoFocus={!!presetCode}
              className="w-full rounded-pill bg-white text-black px-5 py-3 outline-none focus:ring-2 ring-[color:var(--pink)]"
            />
          </label>

          <button type="submit" className="pill-pink w-full text-base py-3">
            {t("join.submit")}
          </button>
        </form>

        <Link href="/" className="text-white/50 hover:text-white text-xs block text-center">
          ← Back
        </Link>
      </div>
    </main>
  )
}
