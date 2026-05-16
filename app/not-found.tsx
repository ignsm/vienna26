import Link from "next/link"
import { getT } from "@/lib/i18n/server"

export default async function NotFound() {
  const { lang } = await getT()
  const copy =
    lang === "ru"
      ? {
          line: "Этот номер не дошёл до финала.",
          hint: "Может, ты ввёл неверный код комнаты — или страница уехала на бэкстейдж.",
          home: "На главную →",
        }
      : {
          line: "This act didn't make the final.",
          hint: "Maybe the room code is wrong — or this page slipped backstage.",
          home: "Back to the landing →",
        }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center safe-x text-center gap-8 p-6">
      <div className="space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-medium">
          {lang === "ru" ? "Ошибка" : "Error"}
        </p>
        <h1 className="headline-display text-7xl md:text-8xl">
          <span className="text-[color:var(--pink)]">4</span>
          <span className="text-white">0</span>
          <span className="text-[color:var(--gold)]">4</span>
        </h1>
        <p className="text-white text-lg font-bold max-w-md mx-auto">{copy.line}</p>
        <p className="text-white/55 text-sm max-w-md mx-auto leading-snug">{copy.hint}</p>
      </div>

      <Link href="/" className="pill-pink text-base px-6 py-3">
        {copy.home}
      </Link>
    </main>
  )
}
