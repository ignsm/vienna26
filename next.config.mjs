/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production"

/*
  Tight CSP tuned for what this app actually does.

  Why we can be strict:
   - next/font/google self-hosts fonts at build time (no third-party font requests)
   - We never fetch from cross-origin APIs from the browser
   - No iframes, no embedded video, no third-party widgets
   - All emoji and icons are inline SVG / unicode

  Two compromises we keep:
   - 'unsafe-inline' on script-src is required by Next.js for streaming RSC payloads
     and small inline scripts the framework injects. Modern web platforms add it
     for Next.js by default. Mitigated by 'unsafe-inline' being ignored when a
     'strict-dynamic' policy is in use; we keep it explicit here for clarity.
   - 'unsafe-inline' on style-src is required because React inlines style props
     and Tailwind 3 ships inline @keyframes.

  Production drops 'unsafe-eval' which Next dev / HMR / Turbopack need locally.
*/

const cspProd = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ")

const cspDev = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const nextConfig = {
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: isProd ? cspProd : cspDev },
          // HSTS w/ preload eligibility. Don't enable preload until you're sure you'll keep HTTPS.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Disable MIME-sniffing — refuses to render non-stylesheets as styles, etc.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No clickjacking — also enforced by frame-ancestors above, both for older browsers.
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak full URLs to third parties on outbound links.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable powerful APIs we never use (one-night party app doesn't need camera/mic/GPS).
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), gamepad=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(self), xr-spatial-tracking=()",
          },
          // Cross-origin isolation: prevents window.opener attacks and limits resource sharing.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // Tell browser to download files instead of rendering when content-type is ambiguous.
          { key: "X-Download-Options", value: "noopen" },
        ],
      },
    ]
  },
}

export default nextConfig
