import type { Vote, Douze } from "@/lib/db/schema"

/**
 * Per-contestant aggregates and final score.
 *
 * base       avg of (vocal+performance+song+hotness)/4 across voters who scored this act    0..10
 * voteCount  how many jurors gave any per-act score to this contestant
 * raw        sum of all per-act scores. equals base * 4 * voteCount, but stored explicitly. larger when more jurors voted
 * douze      sum of douze points across jurors                                              0..(jurors * 12)
 * total      raw/4 + douze    — i.e. (base * voteCount) + douze
 *
 * Why this total: breadth + depth.
 *   - A country rated 7 by 6 jurors → base 7, total ≥ 42 — broad appeal counts.
 *   - A country rated 10 by 1 juror → base 10, total = 10 — narrow love doesn't dominate.
 *   - A 12-point pick gives a juror 12 points to the act they loved → real signal, not magic constants.
 * douze and per-act stay roughly comparable in magnitude per juror (each juror contributes up to 10 base + up to 12 douze).
 */

export type Aggregate = {
  contestantId: number
  vocal: number
  performance: number
  song: number
  hotness: number
  base: number
  voteCount: number
  raw: number
  douze: number
  total: number
}

export function aggregate(votes: Vote[], douzeRows: Douze[]): Map<number, Aggregate> {
  const byContestant = new Map<number, Aggregate>()

  const ensure = (id: number): Aggregate => {
    let agg = byContestant.get(id)
    if (!agg) {
      agg = {
        contestantId: id,
        vocal: 0,
        performance: 0,
        song: 0,
        hotness: 0,
        base: 0,
        voteCount: 0,
        raw: 0,
        douze: 0,
        total: 0,
      }
      byContestant.set(id, agg)
    }
    return agg
  }

  for (const v of votes) {
    const a = ensure(v.contestantId)
    a.vocal += v.vocal
    a.performance += v.performance
    a.song += v.song
    a.hotness += v.hotness
    a.voteCount += 1
  }

  for (const [, a] of byContestant) {
    a.raw = a.vocal + a.performance + a.song + a.hotness // pre-average sum across all jurors, all axes
    if (a.voteCount > 0) {
      a.vocal /= a.voteCount
      a.performance /= a.voteCount
      a.song /= a.voteCount
      a.hotness /= a.voteCount
      a.base = (a.vocal + a.performance + a.song + a.hotness) / 4
    }
  }

  for (const d of douzeRows) {
    const a = ensure(d.contestantId)
    a.douze += d.points
  }

  for (const [, a] of byContestant) {
    a.total = a.raw / 4 + a.douze
  }

  return byContestant
}

export function leaderboard(votes: Vote[], douzeRows: Douze[]): Aggregate[] {
  return [...aggregate(votes, douzeRows).values()].sort((a, b) => b.total - a.total)
}

/**
 * Spearman rank correlation between two orderings of contestant ids.
 * Returns -1..1. 1 = perfect agreement, 0 = uncorrelated, -1 = reversed.
 */
export function spearman(predicted: number[], truth: number[]): number {
  const inBoth = predicted.filter((id) => truth.includes(id))
  const n = inBoth.length
  if (n < 2) return 0

  const rankIn = (list: number[], id: number) => list.indexOf(id) + 1

  let sumDsq = 0
  for (const id of inBoth) {
    const d = rankIn(predicted, id) - rankIn(truth, id)
    sumDsq += d * d
  }

  return 1 - (6 * sumDsq) / (n * (n * n - 1))
}

/** "Accuracy": fraction of your top-K picks that made the real top-K. */
export function topKHitRate(predicted: number[], truth: number[], k = 10): number {
  const p = new Set(predicted.slice(0, k))
  const t = new Set(truth.slice(0, k))
  let hits = 0
  for (const id of p) if (t.has(id)) hits += 1
  return p.size === 0 ? 0 : hits / p.size
}
