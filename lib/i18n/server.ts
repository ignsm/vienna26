import { cookies } from "next/headers"
import { LANGS, DEFAULT_LANG, type Lang, tr as trDict } from "./dict"

export const LANG_COOKIE = "v26_lang"

export async function getLang(): Promise<Lang> {
  const c = await cookies()
  const v = c.get(LANG_COOKIE)?.value
  return (LANGS as readonly string[]).includes(v ?? "") ? (v as Lang) : DEFAULT_LANG
}

export async function getT() {
  const lang = await getLang()
  return { lang, t: (key: string) => trDict(lang, key) }
}
