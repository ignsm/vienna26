import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 gap-10 text-center">
      <div className="space-y-3">
        <p className="text-white/70 text-sm tracking-[0.2em] uppercase">Eurovision · Vienna 2026</p>
        <h1 className="headline-display text-5xl md:text-7xl">
          <span className="text-[color:var(--pink)]">vienna</span>
          <span className="text-white">26</span>
        </h1>
        <p className="text-white/80 max-w-md mx-auto text-lg">
          Домашнее жюри финала. Голосуй с друзьями. В конце раздай <em>douze points</em>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link href="/create" className="pill-pink flex-1 text-base">
          Создать комнату
        </Link>
        <Link href="/join" className="pill-outline flex-1 text-base">
          Войти по коду
        </Link>
      </div>

      <p className="text-white/40 text-xs">
        Финал — 16 мая 2026, 21:00 CET. Поехали.
      </p>
    </main>
  )
}
