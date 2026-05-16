type Props = {
  current: number
  total: number
  label?: string
}

export function ProgressStrip({ current, total, label }: Props) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100))
  return (
    <div className="sticky top-[56px] z-20 bg-gradient-to-b from-[#000c54]/85 to-transparent backdrop-blur-sm">
      <div className="safe-x py-2 max-w-2xl mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] uppercase tracking-widest text-white/45">
            {label ?? "progress"}
          </span>
          <span className="text-xs tabular-nums text-white/70 font-mono">
            <span className="text-white font-bold">{current}</span>
            <span className="text-white/30"> / {total}</span>
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[color:var(--pink)] to-[color:var(--hotpink)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
