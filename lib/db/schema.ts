import { pgTable, text, integer, timestamp, jsonb, uuid, uniqueIndex, smallint, bigserial, index } from "drizzle-orm/pg-core"

/**
 *  rooms
 *    └─ voters (many)
 *         ├─ votes (per contestant, 4 axes)
 *         └─ douze (10 picks per voter, distinct points)
 *
 *  realResults: { "1": ranking_of_contestant_1, ... } — vbed by host on /admin
 */

export const rooms = pgTable("rooms", {
  code: text("code").primaryKey(),
  name: text("name"), // optional friendly label; room is always identified by `code`
  hostToken: text("host_token").notNull(),
  hostName: text("host_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  realResults: jsonb("real_results").$type<Record<string, number> | null>(),
})

export const voters = pgTable(
  "voters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    token: text("token").notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("voters_token_idx").on(t.token),
  }),
)

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => voters.id, { onDelete: "cascade" }),
    contestantId: integer("contestant_id").notNull(),
    vocal: smallint("vocal").notNull(),
    performance: smallint("performance").notNull(),
    song: smallint("song").notNull(),
    hotness: smallint("hotness").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    voterContestantIdx: uniqueIndex("votes_voter_contestant_idx").on(t.voterId, t.contestantId),
  }),
)

export const douze = pgTable(
  "douze",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => voters.id, { onDelete: "cascade" }),
    contestantId: integer("contestant_id").notNull(),
    points: smallint("points").notNull(), // one of 1,2,3,4,5,6,7,8,10,12
  },
  (t) => ({
    voterContestantIdx: uniqueIndex("douze_voter_contestant_idx").on(t.voterId, t.contestantId),
    voterPointsIdx: uniqueIndex("douze_voter_points_idx").on(t.voterId, t.points),
  }),
)

/**
 * Lightweight in-DB rate limit log. One row per protected action invocation.
 * Periodic cleanup keeps the table bounded.
 */
export const ratelimitEvents = pgTable(
  "ratelimit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    key: text("key").notNull(), // e.g. "createRoom:1.2.3.4"
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    keyTimeIdx: index("ratelimit_key_time_idx").on(t.key, t.occurredAt),
  }),
)

export type Room = typeof rooms.$inferSelect
export type Voter = typeof voters.$inferSelect
export type Vote = typeof votes.$inferSelect
export type Douze = typeof douze.$inferSelect

export const DOUZE_POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] as const
export type DouzeValue = (typeof DOUZE_POINTS)[number]
