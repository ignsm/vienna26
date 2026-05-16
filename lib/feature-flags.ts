/**
 * App-wide read-only switch. When true:
 *  - no new rooms (createRoom, createSoloRoom)
 *  - no new room members (joinRoom)
 *  - no new votes (castVote)
 *  - no new douze submissions (submitDouze)
 *  - no flipping private rooms to public (openRoomToFriends)
 *
 * Existing rooms remain viewable — leaderboard, vs-reality, story.
 *
 * Toggle by editing this constant + push + redeploy (~30s on Vercel). Or
 * override via the VIENNA26_READ_ONLY env var ("1" forces on, "0" forces off).
 * The env var wins if set; otherwise the hardcoded default applies.
 */
const HARDCODED_DEFAULT = true

function resolve(): boolean {
  const v = process.env.VIENNA26_READ_ONLY
  if (v === "1") return true
  if (v === "0") return false
  return HARDCODED_DEFAULT
}

export const READ_ONLY = resolve()
