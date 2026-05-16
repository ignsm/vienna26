import { db, rooms } from "@/lib/db"
import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getHostToken } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"
import { saveRealResults } from "@/lib/actions/admin"
import { CONTESTANTS } from "@/lib/contestants"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) notFound()

  const hostToken = await getHostToken(code)
  if (!hostToken || hostToken !== room[0].hostToken) {
    redirect(`/r/${code}`)
  }

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
          <h1 className="headline-display text-4xl">{t("admin.title")}</h1>
          <p className="text-white/60 text-sm">Host-only controls.</p>
        </div>

        <section className="card-glass space-y-4">
          <h2 className="headline-lg text-xl text-white">{t("admin.title")}</h2>
          <p className="text-white/60 text-sm">{t("admin.hint")}</p>

          <form action={saveRealResults} className="space-y-3">
            <input type="hidden" name="code" value={code} />
            <textarea
              name="results"
              required
              rows={14}
              placeholder={t("admin.placeholder")}
              defaultValue={
                room[0].realResults
                  ? Object.entries(room[0].realResults)
                      .sort(([, a], [, b]) => (a as number) - (b as number))
                      .map(([cid, rank]) => {
                        const c = CONTESTANTS.find((x) => x.id === Number(cid))
                        return `${rank}. ${c?.country ?? cid}`
                      })
                      .join("\n")
                  : ""
              }
              className="w-full rounded-xl bg-white text-black px-4 py-3 outline-none focus:ring-2 ring-[color:var(--pink)] font-mono text-sm"
            />
            <button type="submit" className="pill-pink text-sm px-4 py-2">
              {t("admin.submit")}
            </button>
          </form>

          {room[0].realResults && (
            <p className="text-[color:var(--gold)] text-xs">{t("admin.saved")}</p>
          )}
        </section>
      </div>
    </main>
  )
}
