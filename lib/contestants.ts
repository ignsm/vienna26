/**
 * Eurovision 2026 finalists, in running order.
 * Source: eurovision.com Vienna 2026 grand final article (May 16, 2026).
 *
 * The running order is the order songs were performed on the night.
 * Country code is ISO 3166-1 alpha-2 (used for flag emoji rendering).
 */

export type Contestant = {
  id: number // running order
  countryCode: string
  country: string
  flag: string
  artist: string
  song: string
}

export const CONTESTANTS: Contestant[] = [
  { id: 1, countryCode: "DK", country: "Denmark", flag: "🇩🇰", artist: "Søren Torpegaard Lund", song: "Før Vi Går Hjem" },
  { id: 2, countryCode: "DE", country: "Germany", flag: "🇩🇪", artist: "Sarah Engels", song: "Fire" },
  { id: 3, countryCode: "IL", country: "Israel", flag: "🇮🇱", artist: "Noam Bettan", song: "Michelle" },
  { id: 4, countryCode: "BE", country: "Belgium", flag: "🇧🇪", artist: "ESSYLA", song: "Dancing on the Ice" },
  { id: 5, countryCode: "AL", country: "Albania", flag: "🇦🇱", artist: "Alis", song: "Nân" },
  { id: 6, countryCode: "GR", country: "Greece", flag: "🇬🇷", artist: "Akylas", song: "Ferto" },
  { id: 7, countryCode: "UA", country: "Ukraine", flag: "🇺🇦", artist: "LELÉKA", song: "Ridnym" },
  { id: 8, countryCode: "AU", country: "Australia", flag: "🇦🇺", artist: "Delta Goodrem", song: "Eclipse" },
  { id: 9, countryCode: "RS", country: "Serbia", flag: "🇷🇸", artist: "LAVINA", song: "Kraj Mene" },
  { id: 10, countryCode: "MT", country: "Malta", flag: "🇲🇹", artist: "AIDAN", song: "Bella" },
  { id: 11, countryCode: "CZ", country: "Czechia", flag: "🇨🇿", artist: "Daniel Zizka", song: "CROSSROADS" },
  { id: 12, countryCode: "BG", country: "Bulgaria", flag: "🇧🇬", artist: "DARA", song: "Bangaranga" },
  { id: 13, countryCode: "HR", country: "Croatia", flag: "🇭🇷", artist: "LELEK", song: "Andromeda" },
  { id: 14, countryCode: "GB", country: "United Kingdom", flag: "🇬🇧", artist: "LOOK MUM NO COMPUTER", song: "Eins, Zwei, Drei" },
  { id: 15, countryCode: "FR", country: "France", flag: "🇫🇷", artist: "Monroe", song: "Regarde !" },
  { id: 16, countryCode: "MD", country: "Moldova", flag: "🇲🇩", artist: "Satoshi", song: "Viva, Moldova!" },
  { id: 17, countryCode: "FI", country: "Finland", flag: "🇫🇮", artist: "Linda Lampenius x Pete Parkkonen", song: "Liekinheitin" },
  { id: 18, countryCode: "PL", country: "Poland", flag: "🇵🇱", artist: "ALICJA", song: "Pray" },
  { id: 19, countryCode: "LT", country: "Lithuania", flag: "🇱🇹", artist: "Lion Ceccah", song: "Sólo Quiero Más" },
  { id: 20, countryCode: "SE", country: "Sweden", flag: "🇸🇪", artist: "FELICIA", song: "My System" },
  { id: 21, countryCode: "CY", country: "Cyprus", flag: "🇨🇾", artist: "Antigoni", song: "JALLA" },
  { id: 22, countryCode: "IT", country: "Italy", flag: "🇮🇹", artist: "Sal Da Vinci", song: "Per Sempre Sì" },
  { id: 23, countryCode: "NO", country: "Norway", flag: "🇳🇴", artist: "JONAS LOVV", song: "YA YA YA" },
  { id: 24, countryCode: "RO", country: "Romania", flag: "🇷🇴", artist: "Alexandra Căpitănescu", song: "Choke Me" },
  { id: 25, countryCode: "AT", country: "Austria", flag: "🇦🇹", artist: "COSMÓ", song: "Tanzschein" },
]

export function getContestant(id: number): Contestant | undefined {
  return CONTESTANTS.find((c) => c.id === id)
}
