import { db, rooms, voters, votes, douze } from "@/lib/db"
import { eq, and, inArray } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken, getHostToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS } from "@/lib/contestants"
import { leaderboard } from "@/lib/scoring"
import { PollingRefresh } from "@/components/PollingRefresh"
import { RoomTabBar } from "@/components/RoomTabBar"
import { RoomHeader } from "@/components/RoomHeader"
import { LeaderboardView } from "@/components/LeaderboardView"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const voterToken = await getVoterToken(code)
  if (!voterToken) redirect(`/join?code=${code}`)

  const me = await db
    .select()
    .from(voters)
    .where(and(eq(voters.roomCode, code), eq(voters.token, voterToken)))
    .limit(1)
  if (me.length === 0) redirect(`/join?code=${code}`)

  const allVoters = await db.select().from(voters).where(eq(voters.roomCode, code))
  const voterIdList = allVoters.map((v) => v.id)
  const hostToken = await getHostToken(code)
  const isHost = hostToken === room[0].hostToken

  // Scope to this room's voters only — never full-scan the votes/douze tables.
  const roomVotes = voterIdList.length
    ? await db.select().from(votes).where(inArray(votes.voterId, voterIdList))
    : []
  const roomDouze = voterIdList.length
    ? await db.select().from(douze).where(inArray(douze.voterId, voterIdList))
    : []

  const myVotes = roomVotes
  const myDouze = roomDouze
  const myOwnVotes = roomVotes.filter((v) => v.voterId === me[0].id)
  const myOwnDouze = roomDouze.filter((d) => d.voterId === me[0].id)

  const board = leaderboard(myVotes, myDouze)

  const { lang, t } = await getT()
  const hasAnyVotes = board.length > 0 && board[0].total > 0
  const douzeSubmissions = new Set(roomDouze.map((d) => d.voterId)).size

  return (
    <main className="min-h-dvh pb-32">
      <PollingRefresh intervalMs={3000} />

      <RoomHeader
        roomCode={code}
        roomName={room[0].name}
        meId={me[0].id}
        meName={me[0].displayName}
        voters={allVoters.map((v) => ({ id: v.id, displayName: v.displayName }))}
        isHost={isHost}
        isPrivate={room[0].isPrivate}
        realResultsReady={!!room[0].realResults}
        lang={lang}
      />

      <div className="safe-x pt-5 max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="headline-display text-4xl">{t("results.title")}</h1>
          <p className="text-white/60 text-xs">
            {allVoters.length} {lang === "ru" ? "в жюри" : "jurors"} · {myVotes.length}{" "}
            {lang === "ru" ? "оценок поставлено" : "ratings cast"} · {douzeSubmissions}{" "}
            {lang === "ru" ? "финалов отправлено" : "douze submitted"}
          </p>
        </div>

        {!hasAnyVotes ? (
          <div className="card-glass text-center py-12 space-y-2">
            <p className="text-3xl">🎤</p>
            <p className="text-white font-bold">{lang === "ru" ? "Голосов пока нет" : "No votes yet"}</p>
            <p className="text-white/60 text-sm">
              {lang === "ru" ? "Начни оценивать номера, и они появятся здесь" : "Start rating acts to see the board light up"}
            </p>
            <Link href={`/r/${code}`} className="inline-block pill-pink text-sm mt-3 px-5 py-2">
              {lang === "ru" ? "К голосованию →" : "Start voting →"}
            </Link>
          </div>
        ) : (
          <LeaderboardView board={board} lang={lang} />
        )}
      </div>

      <RoomTabBar
        roomCode={code}
        active="results"
        douzeSubmitted={myOwnDouze.length === 10}
        douzePicks={myOwnDouze.length}
        votesCount={myOwnVotes.length}
        totalActs={CONTESTANTS.length}
        lang={lang}
      />
    </main>
  )
}

