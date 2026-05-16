export default function VsRealityLoading() {
  return (
    <main className="min-h-dvh p-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-32 rounded-md bg-white/15" />
        <div className="h-10 w-72 rounded-md bg-white/20" />

        {/* Real top-10 card */}
        <div className="card-glass space-y-3">
          <div className="h-5 w-28 rounded-md bg-white/20" />
          <div className="space-y-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 h-6">
                <div className="w-5 h-3 rounded bg-white/15" />
                <div className="w-6 h-5 rounded bg-white/15" />
                <div className="flex-1 h-3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Prophets card */}
        <div className="card-light !p-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 h-9 rounded-lg px-3">
              <div className="w-4 h-3 rounded bg-black/15" />
              <div className="flex-1 h-3 rounded bg-black/15" />
              <div className="w-14 h-3 rounded bg-black/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
