import "./globals.css"
import { Inter, Sora } from "next/font/google"
import type { Metadata } from "next"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "vienna26 — домашнее жюри Евровидения",
  description: "Голосуй с друзьями за номера финала Eurovision 2026 и сравни свой топ с реальностью.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
