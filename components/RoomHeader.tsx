"use client"

import Link from "next/link"
import { useState } from "react"
import { useTransition } from "react"
import { openDouzeRound } from "@/lib/actions/rooms"

type Props = {
  roomCode: string
  meId: string
  meName: string
  voters: { id: string; displayName: string }[]
  isHost: boolean
  douzeOpen: boolean
  realResultsReady: boolean
}

export function RoomHeader({ roomCode, meId, meName, voters, isHost, douzeOpen, realResultsReady }: Props) {
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  const onCopy = async () => {
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : ""
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white text-sm">
          vienna<span className="text-[color:var(--pink)]">26</span>
        </Link>

        <button
          onClick={onCopy}
          className="ml-auto flex items-center gap-2 rounded-pill bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm transition"
          title="Copy invite link"
        >
          <span className="font-mono text-base tracking-widest text-white">{roomCode}</span>
          <span className="text-xs text-white/60">{copied ? "✓" : "📋"}</span>
        </button>
      </div>

      <div className="px-4 pb-3 max-w-2xl mx-auto flex flex-wrap gap-2 items-center">
        <span className="text-xs text-white/50">{voters.length}:</span>
        {voters.map((v) => (
          <span
            key={v.id}
            className={`text-xs rounded-pill px-2.5 py-1 ${
              v.id === meId ? "bg-[color:var(--pink)] text-white" : "bg-white/10 text-white/80"
            }`}
          >
            {v.displayName}
          </span>
        ))}
      </div>

      <nav className="px-4 pb-3 max-w-2xl mx-auto flex flex-wrap gap-2 text-xs">
        <Link href={`/r/${roomCode}/results`} className="pill bg-white/10 hover:bg-white/20 text-white px-3 py-1.5">
          Leaderboard
        </Link>

        {douzeOpen ? (
          <Link href={`/r/${roomCode}/douze`} className="pill bg-[color:var(--pink)] hover:brightness-110 text-white px-3 py-1.5">
            12 points
          </Link>
        ) : (
          <span className="pill bg-white/5 text-white/40 px-3 py-1.5 cursor-not-allowed">12 points · locked</span>
        )}

        {realResultsReady && (
          <Link href={`/r/${roomCode}/vs-reality`} className="pill bg-[color:var(--gold)] text-black px-3 py-1.5 font-medium">
            vs Reality
          </Link>
        )}

        {isHost && (
          <>
            <Link href={`/admin/${roomCode}`} className="pill bg-white/10 hover:bg-white/20 text-white px-3 py-1.5">
              Admin
            </Link>
            <Link href={`/host/${roomCode}`} className="pill bg-white/10 hover:bg-white/20 text-white px-3 py-1.5">
              TV view
            </Link>
            {!douzeOpen && (
              <button
                onClick={() => start(() => openDouzeRound(roomCode))}
                disabled={pending}
                className="pill bg-[color:var(--gold)] text-black px-3 py-1.5 font-medium disabled:opacity-50"
              >
                Open 12-pt round
              </button>
            )}
          </>
        )}
      </nav>
    </header>
  )
}
