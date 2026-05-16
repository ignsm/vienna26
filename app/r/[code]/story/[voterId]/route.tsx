import { ImageResponse } from "next/og"
import { db, rooms, voters, douze, votes } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { getContestant, CONTESTANTS } from "@/lib/contestants"
import { DOUZE_POINTS } from "@/lib/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const W = 1080
const H = 1920

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string; voterId: string }> },
) {
  const { code: raw, voterId } = await params
  const code = raw.toUpperCase()

  const room = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
  if (room.length === 0) return new Response("Not found", { status: 404 })

  const voter = await db
    .select()
    .from(voters)
    .where(and(eq(voters.roomCode, code), eq(voters.id, voterId)))
    .limit(1)
  if (voter.length === 0) return new Response("Not found", { status: 404 })

  const [picks, myVotes] = await Promise.all([
    db.select().from(douze).where(eq(douze.voterId, voterId)),
    db.select().from(votes).where(eq(votes.voterId, voterId)),
  ])

  // Build the top 10 — prefer douze picks (ordered by points desc), otherwise fall back to Rate ranking
  let ranked: { id: number; points: number | null }[] = []
  if (picks.length === 10) {
    ranked = [...picks]
      .sort((a, b) => b.points - a.points)
      .map((p) => ({ id: p.contestantId, points: p.points }))
  } else if (myVotes.length > 0) {
    ranked = [...myVotes]
      .sort(
        (a, b) =>
          b.vocal + b.performance + b.song + b.hotness -
          (a.vocal + a.performance + a.song + a.hotness),
      )
      .slice(0, 10)
      .map((v, i) => ({ id: v.contestantId, points: DOUZE_POINTS[i] ?? null }))
  }

  const rows = ranked.map((r) => ({ ...r, c: getContestant(r.id) })).filter((r) => r.c)
  const totalRated = myVotes.length

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(120% 150% at 90% -3%, #2200ff, #000c54 22.49%, #010a41 33.26% 64.14%, #4c0a54 85.82%, #ff0178)",
          padding: 80,
          color: "white",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 36, letterSpacing: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
            Eurovision · Vienna 2026
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ fontSize: 140, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
              <span style={{ color: "#ff1770" }}>vienna</span>
              <span>26</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "white",
                padding: "10px 22px",
                fontSize: 32,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: 6,
                borderRadius: 9999,
              }}
            >
              {code}
            </div>
            <div style={{ fontSize: 36, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {voter[0].displayName}&apos;s top {rows.length}
            </div>
          </div>
        </div>

        {/* divider */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.15)", margin: "44px 0 36px" }} />

        {/* picks list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {rows.map((r, i) => {
            const isTwelve = r.points === 12
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  padding: "16px 28px",
                  borderRadius: 28,
                  background: isTwelve
                    ? "linear-gradient(90deg, rgba(255,217,59,0.35), rgba(255,217,59,0.05))"
                    : "rgba(0,0,0,0.35)",
                  border: isTwelve ? "2px solid rgba(255,217,59,0.65)" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isTwelve ? 96 : 76,
                    height: isTwelve ? 96 : 76,
                    borderRadius: 9999,
                    background: isTwelve ? "#FFD93B" : "#000",
                    color: isTwelve ? "#000" : "#fff",
                    fontSize: isTwelve ? 50 : 38,
                    fontWeight: 800,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {r.points ?? i + 1}
                </div>
                <div style={{ fontSize: 78, lineHeight: 1, display: "flex" }}>{r.c!.flag}</div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: "white" }}>{r.c!.country}</div>
                  <div style={{ fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
                    {r.c!.artist}
                  </div>
                </div>
              </div>
            )
          })}
          {rows.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 18 }}>
              <div style={{ fontSize: 100 }}>🎤</div>
              <div style={{ fontSize: 40, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
                No picks yet
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 40,
            color: "rgba(255,255,255,0.5)",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>
            {totalRated} acts rated · {picks.length}/10 douze
          </div>
          <div style={{ display: "flex" }}>vienna26.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
