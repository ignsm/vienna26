type Props = {
  className?: string
}

/**
 * Small unobtrusive credit. Rendered on the landing page and /global —
 * places where users land before entering a room.
 * URL is hardcoded; swap if Fabrique Futur lives elsewhere.
 */
export function MadeAt({ className = "" }: Props) {
  return (
    <p className={`text-white/30 text-[10px] uppercase tracking-[0.2em] ${className}`}>
      Made at{" "}
      <a
        href="https://fabriquefutur.com"
        target="_blank"
        rel="noreferrer"
        className="text-white/55 hover:text-white underline underline-offset-2 transition"
      >
        Fabrique Futur
      </a>
    </p>
  )
}
