import { db, rooms, voters, douze, votes } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS } from "@/lib/contestants"
import { DouzePicker } from "@/components/DouzePicker"
import { RoomTabBar } from "@/components/RoomTabBar"
import Link from "next/link"

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

  const myDouze = await db.select().from(douze).where(eq(douze.voterId, me[0].id))
  const myVotes = await db.select().from(votes).where(eq(votes.voterId, me[0].id))

  const { lang, t } = await getT()

  return (
    <main className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/r/${code}`} className="text-white/70 hover:text-white text-sm shrink-0 font-medium">
            vienna<span className="text-[color:var(--pink)]">26</span>
          </Link>
          <span className="font-mono text-sm tracking-widest text-white/80 ml-auto">{code}</span>
        </div>
      </header>

      <section className="p-4 pt-5 max-w-2xl mx-auto space-y-5">
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
