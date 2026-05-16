/** Inline SVG icons. Lucide-derived paths, stroke-based, currentColor-friendly. */

type IconProps = { className?: string; size?: number; "aria-label"?: string }

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
})

export function IconUsers({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconShare({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export function IconLink({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

export function IconSettings({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconCheck({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconChevronLeft({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function IconChevronRight({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconStar({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function IconTrophy({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

export function IconChart({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  )
}

export function IconClose({ className, size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={!rest["aria-label"]} {...rest}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
