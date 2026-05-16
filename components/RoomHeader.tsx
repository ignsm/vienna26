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

export function RoomHeader({ roomCode, roomName, meId, meName, voters, isHost, realResultsReady }: Props) {
  const [copied, setCopied] = useState(false)
  const [openVoters, setOpenVoters] = useState(false)

  const onCopy = async () => {
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : ""
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
        <Link href="/" className="text-white/70 hover:text-white text-sm shrink-0 font-medium">
          vienna<span className="text-[color:var(--pink)]">26</span>
        </Link>
        {roomName && <span className="text-white/80 text-sm font-medium truncate">{roomName}</span>}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setOpenVoters((v) => !v)}
            className="relative rounded-pill bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs transition flex items-center gap-1"
            aria-label="Show jurors"
          >
            <span className="text-white/90 font-medium">👥 {voters.length}</span>
            {openVoters && (
              <div className="absolute right-0 top-full mt-1.5 min-w-[180px] rounded-xl bg-black/90 backdrop-blur border border-white/15 shadow-2xl p-2 z-50 text-left">
                <p className="text-white/40 text-[10px] uppercase tracking-widest px-2 pb-1">Jurors</p>
                {voters.map((v) => (
                  <div
                    key={v.id}
                    className={`px-2 py-1 rounded-md text-xs ${
                      v.id === meId ? "bg-[color:var(--pink)]/30 text-white font-medium" : "text-white/80"
                    }`}
                  >
                    {v.displayName} {v.id === meId && <span className="text-white/50 text-[10px]">· you</span>}
                  </div>
                ))}
              </div>
            )}
          </button>

          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-pill bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs transition"
            title="Copy invite link"
          >
            <span className="font-mono text-sm tracking-widest text-white">{roomCode}</span>
            <span className="text-xs text-white/60">{copied ? "✓" : "📋"}</span>
          </button>
        </div>
      </div>

      {(isHost || realResultsReady) && (
        <nav className="px-4 pb-2 max-w-2xl mx-auto flex flex-wrap gap-1.5 text-xs">
          {realResultsReady && (
            <Link
              href={`/r/${roomCode}/vs-reality`}
              className="pill bg-[color:var(--gold)] text-black px-3 py-1 font-medium"
            >
              vs Reality
            </Link>
          )}
          {isHost && (
            <>
              <Link
                href={`/admin/${roomCode}`}
                className="pill bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1"
              >
                Admin
              </Link>
              <Link
                href={`/host/${roomCode}`}
                className="pill bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1"
              >
                TV view
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
