import { CONTESTANTS } from "@/lib/contestants"

/**
 * Parse free-form "1. Sweden\n2. Italy\n..." text into a ranking map.
 * Country can be name or code (ISO alpha-2); matching is loose
 * (case-insensitive, substring tolerated).
 *
 * Returns { id -> rank } where rank is 1..N (1 = winner).
 */
export function parseRealResults(text: string): Record<string, number> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const out: Record<string, number> = {}
  let rank = 0
  for (const line of lines) {
    rank += 1
    const cleaned = line.replace(/^\d+[\.\):]?\s*/, "").trim()
    const found = CONTESTANTS.find((c) => {
      const lc = cleaned.toLowerCase()
      return (
        c.country.toLowerCase() === lc ||
        c.country.toLowerCase().includes(lc) ||
        lc.includes(c.country.toLowerCase()) ||
        c.countryCode.toLowerCase() === lc
      )
    })
    if (!found) {
      throw new Error(`UNRECOGNIZED_LINE:${line}`)
    }
    if (out[found.id]) {
      throw new Error(`DUPLICATE_COUNTRY:${found.country}`)
    }
    out[found.id] = rank
  }
  if (rank < 3) throw new Error("TOO_FEW_LINES")
  return out
}
