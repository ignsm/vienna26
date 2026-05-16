import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Eurovision Spark tokens — see app/globals.css for runtime values
        brand: {
          pink: "#FF1770",
          deepblue: "#000c54",
          midblue: "#010a41",
          purple: "#4c0a54",
          hotpink: "#ff0178",
          gold: "#FFD93B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
      spacing: {
        gutter: "18px",
        section: "64px",
      },
    },
  },
  plugins: [],
}

export default config
