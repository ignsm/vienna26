import type { Vote, Douze } from "@/lib/db/schema"

/**
 * Per-contestant aggregates and final score.
 *
 * base   = AVG over voters of ((vocal + performance + song + hotness) / 4)         scale: 0..10
 * douze  = SUM over voters of their douze points for this contestant               scale: 0..(voters * 12)
 * total  = base * 10 + douze                                                       scale: 0..100 + 0..72
 *
 * The 10x weight on base keeps both axes roughly comparable in magnitude, so the
 * leaderboard is a real blend of "everyone liked it" + "someone loved it enough
 * to spend 12 points".
 */

export type Aggregate = {
  contestantId: number
  vocal: number
  performance: number
  song: number
  hotness: number
  base: number
  douze: number
  total: number
  voteCount: number
}

export function aggregate(votes: Vote[], douze: Douze[]): Map<number, Aggregate> {
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
        douze: 0,
        total: 0,
        voteCount: 0,
      }
      byContestant.set(id, agg)
    }
    return agg
  }

  // Sum then we'll divide for averages.
  for (const v of votes) {
    const a = ensure(v.contestantId)
    a.vocal += v.vocal
    a.performance += v.performance
    a.song += v.song
    a.hotness += v.hotness
    a.voteCount += 1
  }

  for (const [, a] of byContestant) {
    if (a.voteCount > 0) {
      a.vocal /= a.voteCount
      a.performance /= a.voteCount
      a.song /= a.voteCount
      a.hotness /= a.voteCount
      a.base = (a.vocal + a.performance + a.song + a.hotness) / 4
    }
  }

  for (const d of douze) {
    const a = ensure(d.contestantId)
    a.douze += d.points
  }

  for (const [, a] of byContestant) {
    a.total = a.base * 10 + a.douze
  }

  return byContestant
}

export function leaderboard(votes: Vote[], douze: Douze[]): Aggregate[] {
  return [...aggregate(votes, douze).values()].sort((a, b) => b.total - a.total)
}

/**
 * Spearman rank correlation between two orderings of contestant ids.
 * Returns -1..1. 1 = perfect agreement, 0 = uncorrelated, -1 = reversed.
 *
 * `predicted` and `truth` should each be arrays of contestant ids ordered
 * from best (rank 1) to worst (rank N). They MUST cover the same set of
 * contestants — we only compare items present in both.
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

/**
 * "Accuracy" surfaced to users: how many of their top-K picks made the real top-K
 * (set intersection), expressed as a fraction.
 */
export function topKHitRate(predicted: number[], truth: number[], k = 10): number {
  const p = new Set(predicted.slice(0, k))
  const t = new Set(truth.slice(0, k))
  let hits = 0
  for (const id of p) if (t.has(id)) hits += 1
  return p.size === 0 ? 0 : hits / p.size
}
