"use client"

import { useEffect } from "react"

type Props = {
  code: string
  roomName: string | null
  meDisplayName: string
}

const KEY = "v26:recent-rooms"
const MAX = 8

type Entry = {
  code: string
  name: string | null
  meName: string
  lastVisitedAt: number
}

export function RecentRoomsTracker({ code, roomName, meDisplayName }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const list: Entry[] = raw ? JSON.parse(raw) : []
      const filtered = list.filter((e) => e.code !== code)
      const next: Entry[] = [
        { code, name: roomName, meName: meDisplayName, lastVisitedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [code, roomName, meDisplayName])

  return null
}
