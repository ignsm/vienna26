import { test } from "node:test"
import assert from "node:assert/strict"
import { aggregate, leaderboard, spearman, topKHitRate } from "../lib/scoring"
import type { Vote, Douze } from "../lib/db/schema"

const baseVoteFields = {
  id: "v1",
  voterId: "u1",
  updatedAt: new Date(),
}

const mkVote = (voterId: string, contestantId: number, vocal: number, perf: number, song: number, hot: number): Vote => ({
  ...baseVoteFields,
  voterId,
  contestantId,
  vocal,
  performance: perf,
  song,
  hotness: hot,
})

const mkDouze = (voterId: string, contestantId: number, points: number): Douze => ({
  id: "d",
  voterId,
  contestantId,
  points,
})

test("aggregate averages axes per contestant across voters", () => {
  const votes: Vote[] = [
    mkVote("a", 1, 10, 8, 6, 4),
    mkVote("b", 1, 8, 6, 4, 2),
  ]
  const agg = aggregate(votes, [])
  const c1 = agg.get(1)!
  assert.equal(c1.voteCount, 2)
  assert.equal(c1.vocal, 9)
  assert.equal(c1.performance, 7)
  assert.equal(c1.song, 5)
  assert.equal(c1.hotness, 3)
  assert.equal(c1.base, (9 + 7 + 5 + 3) / 4) // = 6
})

test("aggregate sums douze points across voters", () => {
  const douze: Douze[] = [
    mkDouze("a", 1, 12),
    mkDouze("b", 1, 8),
    mkDouze("a", 2, 10),
  ]
  const agg = aggregate([], douze)
  assert.equal(agg.get(1)!.douze, 20)
  assert.equal(agg.get(2)!.douze, 10)
})

test("aggregate total = sum of 12-points only (Eurovision style)", () => {
  const votes: Vote[] = [mkVote("a", 1, 8, 8, 8, 8)]
  const douze: Douze[] = [mkDouze("a", 1, 12)]
  const agg = aggregate(votes, douze)
  const c1 = agg.get(1)!
  assert.equal(c1.base, 8) // per-act average still tracked for bonus rankings
  assert.equal(c1.voteCount, 1)
  assert.equal(c1.douze, 12)
  assert.equal(c1.douzeVoters, 1)
  assert.equal(c1.total, 12) // total is JUST douze
})

test("per-act ratings do not affect total", () => {
  // Contestant A: rated 9 by 6 jurors but NO douze
  const votesA: Vote[] = Array.from({ length: 6 }, (_, i) =>
    mkVote(`u${i}`, 1, 9, 9, 9, 9),
  )
  // Contestant B: rated 0, but two jurors gave 12 douze
  const votesB: Vote[] = [mkVote("u0", 2, 0, 0, 0, 0)]
  const douzeB: Douze[] = [mkDouze("u0", 2, 12), mkDouze("u1", 2, 10)]

  const aggA = aggregate(votesA, []).get(1)!
  const aggB = aggregate(votesB, douzeB).get(2)!
  assert.equal(aggA.total, 0) // no douze → no total, even with great ratings
  assert.equal(aggB.total, 22) // 12 + 10
  assert.ok(aggB.total > aggA.total)
})

test("leaderboard sorts by total desc (douze-driven)", () => {
  const votes: Vote[] = [
    mkVote("a", 1, 5, 5, 5, 5),
    mkVote("a", 2, 8, 8, 8, 8),
    mkVote("a", 3, 7, 7, 7, 7),
  ]
  const douze: Douze[] = [
    mkDouze("a", 2, 12),
    mkDouze("a", 3, 10),
    mkDouze("a", 1, 8),
  ]
  const board = leaderboard(votes, douze)
  assert.deepEqual(
    board.map((r) => r.contestantId),
    [2, 3, 1],
  )
})

test("spearman: perfect agreement is 1", () => {
  assert.equal(spearman([1, 2, 3, 4], [1, 2, 3, 4]), 1)
})

test("spearman: perfect reversal is -1", () => {
  assert.equal(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1)
})

test("spearman: partial disagreement is between -1 and 1", () => {
  const r = spearman([1, 3, 2, 4], [1, 2, 3, 4])
  assert.ok(r > 0 && r < 1, `expected 0<r<1, got ${r}`)
})

test("spearman: too short returns 0", () => {
  assert.equal(spearman([1], [1]), 0)
  assert.equal(spearman([], []), 0)
})

test("topKHitRate: identical top-3 = 1.0", () => {
  assert.equal(topKHitRate([1, 2, 3, 4, 5], [1, 2, 3, 6, 7], 3), 1)
})

test("topKHitRate: half overlap = 0.5", () => {
  assert.equal(topKHitRate([1, 2, 3, 4], [3, 4, 5, 6], 2), 0)
  // top-4 overlap on {3, 4} out of {1, 2, 3, 4} → 2/4
  assert.equal(topKHitRate([1, 2, 3, 4], [3, 4, 5, 6], 4), 0.5)
})

test("topKHitRate: empty predicted = 0", () => {
  assert.equal(topKHitRate([], [1, 2, 3], 3), 0)
})
