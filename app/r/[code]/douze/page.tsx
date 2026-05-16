import { db, rooms, voters, douze } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getVoterToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { CONTESTANTS } from "@/lib/contestants"
import { DouzePicker } from "@/components/DouzePicker"
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

  const { t } = await getT()

  return (
    <main className="min-h-dvh p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-2">
          <Link href={`/r/${code}`} className="text-white/70 hover:text-white text-sm">
            ← vienna<span className="text-[color:var(--pink)]">26</span> · {code}
          </Link>
        </header>

        <div className="space-y-1">
          <h1 className="headline-display text-4xl">{t("douze.title")}</h1>
          <p className="text-white/60 text-sm">{t("douze.hint")}</p>
        </div>

        {room[0].douzeOpen !== 1 ? (
          <div className="card-glass">
            <p className="text-[color:var(--gold)]">{t("room.douze_locked")}</p>
          </div>
        ) : (
          <DouzePicker
            roomCode={code}
            contestants={CONTESTANTS}
            initialPicks={myDouze.map((d) => ({ contestantId: d.contestantId, points: d.points }))}
          />
        )}
      </div>
    </main>
  )
}
