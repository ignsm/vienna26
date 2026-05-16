"use client"

import { useEffect, useState } from "react"

const KEY = "v26:onboarding-seen"

type Props = { lang: "en" | "ru" }

const COPY = {
  en: {
    skip: "Skip",
    next: "Next →",
    done: "Got it 🎤",
    s1Title: "Two ways to vote",
    s1Body:
      "Two scoring systems run side by side. Per-act ratings power the bonus boards (hottest, best vocals, best stage). Your 12-points decide the actual winner, Eurovision-style.",
    s2Title: "1 · Rate every act",
    s2Body:
      "While the show is on, tap one of 5 buttons per song (1 = nope, 5 = iconic). One tap scores all 4 axes (vocal / stage / song / hotness) at once. Switch to ‘Detail’ if you want them separate.",
    s3Title: "2 · Give your 12 points",
    s3Body:
      "After all 25 acts, distribute Eurovision-style points to your top 10: 12 to your favourite, then 10, 8, 7, 6, 5, 4, 3, 2, 1. The drama happens here.",
    s4Title: "How the total works",
    s4Body:
      "Final score = sum of everyone’s 12-points. Per-act ratings don’t touch the total, they just rank the bonus boards (hottest / best vocals / best stage). Eurovision is a 12-point game.",
  },
  ru: {
    skip: "Пропустить",
    next: "Дальше →",
    done: "Поехали 🎤",
    s1Title: "Два способа голосовать",
    s1Body:
      "Две системы параллельно. Поактные оценки кормят бонусные топы (самые горячие, лучший вокал, лучшее шоу). 12 баллов решают победителя — как на настоящем Евровидении.",
    s2Title: "1 · Оцениваешь каждый номер",
    s2Body:
      "Пока идёт шоу, тапаешь одну из 5 кнопок (1 — мимо, 5 — икона). Один тап ставит балл сразу по 4 осям (вокал / шоу / песня / секс). Хочешь развести их отдельно — переключи на «Детально».",
    s3Title: "2 · Раздаёшь свои 12 баллов",
    s3Body:
      "После всех 25 номеров раздаёшь баллы по правилам Евровидения своему топ-10: 12 фавориту, дальше 10, 8, 7, 6, 5, 4, 3, 2, 1. Главная драма ночи.",
    s4Title: "Как считается итог",
    s4Body:
      "Итог = сумма 12-баллов всего жюри. Пять кнопок per-act на итог не влияют, они только ранжируют бонусные топы (горячие / вокал / шоу). Евровидение — игра 12-балльной шкалы.",
  },
} as const

export function Onboarding({ lang }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const c = COPY[lang]

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (!localStorage.getItem(KEY)) setOpen(true)
    } catch {}
  }, [])

  if (!open) return null

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1")
    } catch {}
    setOpen(false)
  }

  const slides = [
    { title: c.s1Title, body: c.s1Body, art: <ArtOverview lang={lang} /> },
    { title: c.s2Title, body: c.s2Body, art: <ArtRate lang={lang} /> },
    { title: c.s3Title, body: c.s3Body, art: <ArtDouze /> },
    { title: c.s4Title, body: c.s4Body, art: <ArtFormula /> },
  ]
  const isLast = step === slides.length - 1

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white text-black overflow-hidden shadow-2xl">
        <div className="p-5 space-y-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "bg-[color:var(--pink)] w-6" : "bg-black/15 w-2"
                }`}
              />
            ))}
            <button
              onClick={dismiss}
              className="ml-auto text-black/40 hover:text-black/70 text-xs underline underline-offset-2"
            >
              {c.skip}
            </button>
          </div>

          <div className="flex justify-center pt-1">{slides[step].art}</div>

          <div className="space-y-2 pt-1">
            <h2 className="font-bold text-xl leading-tight">{slides[step].title}</h2>
            <p className="text-black/65 text-sm leading-snug">{slides[step].body}</p>
          </div>

          <button
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
            className="w-full mt-2 py-3.5 rounded-2xl bg-[color:var(--pink)] text-white font-bold text-base hover:brightness-110 transition shadow-md shadow-[color:var(--pink)]/30"
          >
            {isLast ? c.done : c.next}
          </button>
        </div>
      </div>
    </div>
  )
}

function ArtOverview({ lang }: { lang: "en" | "ru" }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-black/[0.04] flex items-center justify-center text-3xl">📊</div>
        <p className="text-[10px] uppercase tracking-widest text-black/40 mt-1">
          {lang === "ru" ? "Оценки" : "Rate"}
        </p>
      </div>
      <span className="text-black/30">+</span>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[color:var(--gold)]/30 flex items-center justify-center text-3xl">🏆</div>
        <p className="text-[10px] uppercase tracking-widest text-black/40 mt-1">
          {lang === "ru" ? "12 баллов" : "12 pts"}
        </p>
      </div>
    </div>
  )
}

function ArtRate({ lang }: { lang: "en" | "ru" }) {
  const items = [
    { e: "💀", l: lang === "ru" ? "Мимо" : "Nope", n: 1 },
    { e: "😐", l: lang === "ru" ? "Так себе" : "Meh", n: 2 },
    { e: "🙂", l: lang === "ru" ? "Норм" : "Good", n: 3 },
    { e: "🤩", l: lang === "ru" ? "Огонь" : "Great", n: 4 },
    { e: "🔥", l: lang === "ru" ? "Икона" : "Iconic", n: 5 },
  ]
  return (
    <div className="grid grid-cols-5 gap-1.5 w-full">
      {items.map((i, idx) => (
        <div
          key={i.n}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 ${
            idx === 4 ? "bg-[color:var(--pink)] text-white" : "bg-black/[0.05] text-black/75"
          }`}
        >
          <span className="text-xl leading-none">{i.e}</span>
          <span className="text-[10px] font-bold leading-none">{i.n}</span>
        </div>
      ))}
    </div>
  )
}

function ArtDouze() {
  const slots = [12, 10, 8, 7, 6, 5]
  return (
    <div className="flex items-center gap-1.5">
      {slots.map((p) => (
        <span
          key={p}
          className={`shrink-0 rounded-full flex items-center justify-center font-bold tabular-nums ${
            p === 12 ? "w-12 h-12 bg-[color:var(--gold)] text-black text-base shadow" : "w-8 h-8 bg-black text-white text-xs"
          }`}
        >
          {p}
        </span>
      ))}
      <span className="text-black/40 text-xs">…</span>
    </div>
  )
}

function ArtFormula() {
  return (
    <div className="font-mono text-xs text-black/75 bg-black/[0.04] rounded-xl px-3 py-2.5 text-center space-y-0.5">
      <div>
        <span className="text-black/55">total</span> = Σ{" "}
        <span className="text-[color:var(--gold)] font-bold">12pts</span>
      </div>
      <div className="text-black/40 text-[10px]">
        ratings → bonus boards
      </div>
    </div>
  )
}
