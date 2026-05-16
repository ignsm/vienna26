import type { Vote, Douze } from "@/lib/db/schema"

/**
 * Per-contestant aggregates and final score.
 *
 * Eurovision-style: total is only the sum of 12-point picks across jurors.
 * Per-act ratings (Rate) drive the bonus rankings and the auto-fill suggestion,
 * but do NOT add to total. This mirrors how the real contest scores: only the
 * 12/10/8/.../1 distribution from each jury counts toward the winner.
 *
 * base         avg of (vocal+performance+song+hotness)/4 across jurors who rated this act    0..10
 * voteCount    how many jurors gave a per-act rating to this contestant
 * douzeVoters  how many jurors put this contestant in their 12-point top-10
 * douze        sum of 12-point picks across jurors                                           0..(jurors * 12)
 * total        = douze
 */

export type Aggregate = {
  contestantId: number
  vocal: number
  performance: number
  song: number
  hotness: number
  base: number
  voteCount: number
  douze: number
  douzeVoters: number
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
        douze: 0,
        douzeVoters: 0,
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
    a.douzeVoters += 1
  }

  // Eurovision-style: only 12-point picks drive the leaderboard total.
  for (const [, a] of byContestant) {
    a.total = a.douze
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
