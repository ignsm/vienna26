import "./globals.css"
import { Inter, Sora } from "next/font/google"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getLang } from "@/lib/i18n/server"
import { GlobalLangToggle } from "@/components/GlobalLangToggle"

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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#000c54",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang} className={`${sora.variable} ${inter.variable}`}>
      <body>
        <GlobalLangToggle current={lang} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
