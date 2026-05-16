# vienna26

Home jury for the Eurovision 2026 grand final. Watch with friends, rate every
act on 4 axes, split your 12 points at the end, then compare your top to the
real ranking. Built in one evening with Next.js + Postgres.

Live: https://vienna26.vercel.app

## Stack

- Next.js 16 (App Router, Server Actions, RSC, Fluid Compute)
- Postgres via Drizzle ORM (works with Neon, Supabase, or any Postgres)
- Tailwind 3
- pnpm

## Run locally

```bash
pnpm install

# Option A: bring up a throwaway Postgres in Docker
docker run -d --name vienna26-pg \
  -e POSTGRES_PASSWORD=vienna -e POSTGRES_DB=vienna26 \
  -p 5433:5432 postgres:16-alpine

echo 'DATABASE_URL="postgres://postgres:vienna@localhost:5433/vienna26"' > .env.local

# Option B: use Neon (https://neon.tech) and paste the connection string into .env.local

pnpm db:push      # provision schema
pnpm dev          # http://localhost:4123
```

## Run tests

```bash
pnpm test
```

Covers the scoring math: per-axis aggregates, douze sums, Spearman rank
correlation, and top-K hit rate.

## Routes

| Path                       | What                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `/`                        | Landing — create or join a room                            |
| `/create`                  | Create a room, pick your name (room label optional)        |
| `/join?code=ABCD`          | Join an existing room                                      |
| `/r/[code]`                | Voting screen — one act per screen, one-tap scoring        |
| `/r/[code]/results`        | Live leaderboard, polled every 3s                          |
| `/r/[code]/douze`          | 12-point distribution (top-10 of the night)                |
| `/r/[code]/vs-reality`     | Per-juror top-10 vs the real ranking, Spearman accuracy    |
| `/host/[code]`             | TV view — big screen leaderboard for casting               |
| `/global`                  | Cross-room aggregation — every voter, every room           |

## Scoring

Per contestant:

```
base   = avg over voters of (vocal + performance + song + hotness) / 4   ∈ [0, 10]
douze  = sum over voters of their douze points (12, 10, 8, ..., 1)       ∈ [0, voters · 12]
total  = douze
```

`total` only counts the 12-points rounds (Eurovision-style). Per-act ratings
power the bonus boards on `/r/[code]/results` — hottest acts, best vocals,
best stage — but they don't move the main leaderboard. Someone has to spend
their 12 on you for you to win.

Real final ranking lives in `lib/real-results.ts` — a static file committed
to the repo. Update it the night of the final, push to `main`, Vercel redeploys
in ~30s and every room sees the comparison at `/r/[code]/vs-reality`.

## Offline behavior

Every vote is written to `localStorage` instantly on tap. The server sync runs
in parallel; if it fails, the local copy survives. When the browser fires the
`online` event, the queue flushes — your votes never get lost.

The leaderboard is server-backed and goes stale during outages (it can only
show what the DB has). Your own scoring keeps working.

## Design

The visual system is "Eurovision Spark" — a deep blue-to-pink radial gradient,
oversized rounded headlines, white pill cards floating over the gradient.
Fonts are Google substitutes for the licensed originals:

- `Sora` 700/800 — display headlines (substitute for "Singing Sans")
- `Inter` 400/500/600/700 — body and UI (substitute for "Neulis Neue")

Tokens live in `app/globals.css` (`--pink`, `--gold`, etc.) and
`tailwind.config.ts`.

## i18n

EN + RU. Cookie-backed (`v26_lang`), toggle floats in the top-right corner.
Translations live in `lib/i18n/dict.ts`.

## Database

```
rooms              — code (PK), name?, hostToken, hostName, isPrivate
voters             — id (UUID), roomCode, token, displayName
votes              — voterId × contestantId (unique), vocal/performance/song/hotness 0..10
douze              — voterId × contestantId (unique), voterId × points (unique)
ratelimit_events   — sliding-window rate limit log, cleaned periodically
```

`rooms.realResults` (JSONB) is a legacy column kept for backward compatibility.
Real-results data now lives in `lib/real-results.ts`, not in the DB. The column
will be dropped in a future migration.

Identity is per-room cookie (`v26_v_<CODE>`, `v26_h_<CODE>`). No accounts, no
emails. Tokens are 24-char nanoids — enough for a party app.

## Deploy

Push to GitHub, deploy on Vercel, set `DATABASE_URL` in project env. That's it.
Free tier of Neon + Vercel covers a one-night home jury comfortably.

## License

MIT.
