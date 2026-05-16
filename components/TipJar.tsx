"use client"

import { useState } from "react"

type Labels = {
  title: string
  coffee: string
  share: string
  shareText: string
  copied: string
}

const COFFEE_URL = "https://buymeacoffee.com/ignsm94c"

export function TipJar({ labels }: { labels: Labels }) {
  const [copied, setCopied] = useState(false)

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.origin : ""
    const data = { title: "vienna26", text: labels.shareText, url }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(data)
        return
      } catch {
        // user cancelled or share unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — no-op
    }
  }

  return (
    <section className="card-glass flex flex-col items-center gap-3 text-center">
      <p className="headline-lg text-lg text-white">{labels.title}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noreferrer"
          className="pill bg-[color:var(--gold)] text-black font-medium text-sm px-4 py-2 hover:opacity-90 transition"
        >
          ☕ {labels.coffee}
        </a>
        <button
          type="button"
          onClick={onShare}
          className="pill bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-4 py-2 hover:bg-white/15 transition"
        >
          {copied ? labels.copied : labels.share}
        </button>
      </div>
    </section>
  )
}
