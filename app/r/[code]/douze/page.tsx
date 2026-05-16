import { db, rooms, voters, douze, votes } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken, getHostToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS } from "@/lib/contestants"
import { DouzePicker } from "@/components/DouzePicker"
import { RoomTabBar } from "@/components/RoomTabBar"
import { RoomHeader } from "@/components/RoomHeader"

export const dynamic = "force-dynamic"

export default async function DouzePage({ params }: { params: Promise<{ code: string }> }) {
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
  const myDouze = await db.select().from(douze).where(eq(douze.voterId, me[0].id))
  const myVotes = await db.select().from(votes).where(eq(votes.voterId, me[0].id))
  const hostToken = await getHostToken(code)
  const isHost = hostToken === room[0].hostToken

  const { lang, t } = await getT()

  return (
    <main className="min-h-dvh pb-32">
      <RoomHeader
        roomCode={code}
        roomName={room[0].name}
        meId={me[0].id}
        meName={me[0].displayName}
        voters={allVoters.map((v) => ({ id: v.id, displayName: v.displayName }))}
        isHost={isHost}
        douzeOpen={true}
        realResultsReady={!!room[0].realResults}
        lang={lang}
      />

      <section className="safe-x pt-5 max-w-2xl mx-auto space-y-5">
        <div className="space-y-1.5">
          <h1 className="headline-display text-4xl md:text-5xl">{t("douze.title")}</h1>
          <p className="text-white/70 text-sm">{t("douze.hint")}</p>
        </div>

        <DouzePicker
          roomCode={code}
          contestants={CONTESTANTS}
          initialPicks={myDouze.map((d) => ({ contestantId: d.contestantId, points: d.points }))}
        />
      </section>

      <RoomTabBar
        roomCode={code}
        active="douze"
        douzeSubmitted={myDouze.length === 10}
        douzePicks={myDouze.length}
        votesCount={myVotes.length}
        totalActs={CONTESTANTS.length}
        lang={lang}
      />
    </main>
  )
}
