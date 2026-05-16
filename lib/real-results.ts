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
export const REAL_FINAL_RANKING: readonly number[] = [
  12, // 1  Bulgaria — DARA · Bangaranga (516)
  3,  // 2  Israel — Noam Bettan · Michelle (343)
  24, // 3  Romania — Alexandra Căpitănescu · Choke Me (296)
  8,  // 4  Australia — Delta Goodrem · Eclipse (287)
  22, // 5  Italy — Sal Da Vinci · Per Sempre Sì (281)
  17, // 6  Finland — Linda Lampenius x Pete Parkkonen · Liekinheitin (279)
  1,  // 7  Denmark — Søren Torpegaard Lund · Før Vi Går Hjem (243)
  16, // 8  Moldova — Satoshi · Viva, Moldova! (226)
  7,  // 9  Ukraine — LELÉKA · Ridnym (221)
  6,  // 10 Greece — Akylas · Ferto (220)
  15, // 11 France — Monroe · Regarde ! (158)
  18, // 12 Poland — ALICJA · Pray (150)
  5,  // 13 Albania — Alis · Nân (145)
  23, // 14 Norway — JONAS LOVV · YA YA YA (134)
  13, // 15 Croatia — LELEK · Andromeda (124)
  11, // 16 Czechia — Daniel Zizka · CROSSROADS (113)
  9,  // 17 Serbia — LAVINA · Kraj Mene (90)
  10, // 18 Malta — AIDAN · Bella (89)
  21, // 19 Cyprus — Antigoni · JALLA (75)
  20, // 20 Sweden — FELICIA · My System (51)
  4,  // 21 Belgium — ESSYLA · Dancing on the Ice (36)
  19, // 22 Lithuania — Lion Ceccah · Sólo Quiero Más (22)
  2,  // 23 Germany — Sarah Engels · Fire (12)
  25, // 24 Austria — COSMÓ · Tanzschein (6)
  14, // 25 United Kingdom — LOOK MUM NO COMPUTER · Eins, Zwei, Drei (1)
]

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
