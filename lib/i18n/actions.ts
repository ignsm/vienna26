"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { LANGS, type Lang } from "./dict"
import { LANG_COOKIE } from "./server"

export async function setLang(lang: Lang) {
  if (!(LANGS as readonly string[]).includes(lang)) return
  const c = await cookies()
  c.set(LANG_COOKIE, lang, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  revalidatePath("/", "layout")
}
