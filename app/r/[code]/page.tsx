import { db, rooms, voters, votes, douze } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { redirect, notFound } from "next/navigation"
import { getVoterToken, getHostToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS } from "@/lib/contestants"
import { RoomHeader } from "@/components/RoomHeader"
import { VoteList } from "@/components/VoteList"
import { RoomTabBar } from "@/components/RoomTabBar"
import { ProgressStrip } from "@/components/ProgressStrip"
import { RecentRoomsTracker } from "@/components/RecentRoomsTracker"
import { RoundBanner } from "@/components/RoundBanner"
import { Onboarding } from "@/components/Onboarding"

export const dynamic = "force-dynamic"

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const voterToken = await getVoterToken(code)
  const hostToken = await getHostToken(code)
  const isHost = hostToken === room[0].hostToken

  // Private (solo) rooms refuse non-host visitors. Show a generic 404 so the
  // existence of someone's solo session doesn't leak.
  if (room[0].isPrivate && !isHost) notFound()

  if (!voterToken) redirect(`/join?code=${code}`)

  const me = await db
    .select()
    .from(voters)
    .where(and(eq(voters.roomCode, code), eq(voters.token, voterToken)))
    .limit(1)
  if (me.length === 0) redirect(`/join?code=${code}`)

  const allVoters = await db.select().from(voters).where(eq(voters.roomCode, code))
  const myVotes = await db.select().from(votes).where(eq(votes.voterId, me[0].id))
  const myDouze = await db.select().from(douze).where(eq(douze.voterId, me[0].id))

  const { lang } = await getT()

  return (
    <main className="min-h-dvh pb-32">
      <RecentRoomsTracker code={code} roomName={room[0].name ?? null} meDisplayName={me[0].displayName} />
      <Onboarding lang={lang} />
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

      <ProgressStrip current={myVotes.length} total={CONTESTANTS.length} label={lang === "ru" ? "ваши оценки" : "your ratings"} />

      <section className="safe-x pt-4 max-w-2xl mx-auto space-y-4">
        <VoteList
          roomCode={code}
          contestants={CONTESTANTS}
          initialVotes={myVotes.map((v) => ({
            contestantId: v.contestantId,
            vocal: v.vocal,
            performance: v.performance,
            song: v.song,
            hotness: v.hotness,
          }))}
        />
        <RoundBanner
          roomCode={code}
          mySubmittedDouze={myDouze.length === 10}
          myVotesCount={myVotes.length}
          totalActs={CONTESTANTS.length}
          lang={lang}
        />
      </section>

      <RoomTabBar
        roomCode={code}
        active="vote"
        douzeSubmitted={myDouze.length === 10}
        douzePicks={myDouze.length}
        votesCount={myVotes.length}
        totalActs={CONTESTANTS.length}
        lang={lang}
      />
    </main>
  )
}
