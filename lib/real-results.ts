/**
 * Eurovision 2026 real final results.
 *
 * Order is the official ranking: first element = 1st place, last = 25th.
 * IDs come from lib/contestants.ts.
 *
 * Empty array = "results not loaded yet". /r/[code]/vs-reality renders the
 * locked-state placeholder until this is populated.
 *
 * Update flow: edit this file, commit, push to main. Vercel auto-deploys in
 * ~30-60s and every room sees the comparison.
 */
export const REAL_FINAL_RANKING: readonly number[] = []

export function isRealResultsReady(): boolean {
  return REAL_FINAL_RANKING.length > 0
}

/**
 * Convert the ordered ranking into the rank-by-id map shape that scoring code
 * already understands: { contestantId: rank, ... } where rank is 1-based.
 */
export function realResultsAsRankMap(): Record<string, number> {
  const out: Record<string, number> = {}
  REAL_FINAL_RANKING.forEach((cid, idx) => {
    out[String(cid)] = idx + 1
  })
  return out
}
