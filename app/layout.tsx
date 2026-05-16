import "./globals.css"
import { Inter, Sora } from "next/font/google"
import type { Metadata } from "next"
import { getLang } from "@/lib/i18n/server"
import { LangToggle } from "@/components/LangToggle"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
})

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "vienna26 — home jury for Eurovision",
  description: "Vote with friends on Eurovision 2026 grand final acts, then compare your top to reality.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang} className={`${sora.variable} ${inter.variable}`}>
      <body>
        <div className="fixed top-3 right-3 z-50">
          <LangToggle current={lang} />
        </div>
        {children}
      </body>
    </html>
  )
}
