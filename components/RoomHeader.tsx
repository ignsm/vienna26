"use client"

import Link from "next/link"
import { useState } from "react"

type Props = {
  roomCode: string
  roomName: string | null
  meId: string
  meName: string
  voters: { id: string; displayName: string }[]
  isHost: boolean
  douzeOpen: boolean
  realResultsReady: boolean
}

export function RoomHeader({ roomCode, roomName, meId, meName, voters, isHost, douzeOpen, realResultsReady }: Props) {
  const [copied, setCopied] = useState(false)

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
        <Link href="/" className="text-white/70 hover:text-white text-sm shrink-0">
          vienna<span className="text-[color:var(--pink)]">26</span>
        </Link>
        {roomName && (
          <span className="text-white/80 text-sm font-medium truncate">{roomName}</span>
        )}

        <button
          onClick={onCopy}
          className="ml-auto flex items-center gap-2 rounded-pill bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm transition shrink-0"
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
        <Link href={`/r/${roomCode}/douze`} className="pill bg-white/10 hover:bg-white/20 text-white px-3 py-1.5">
          12 points
        </Link>

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
          </>
        )}
      </nav>
    </header>
  )
}
