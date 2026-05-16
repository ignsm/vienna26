export default function CreateLoading() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="card-glass w-full max-w-md space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-md bg-white/20" />
          <div className="h-4 w-64 rounded-md bg-white/10" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-md bg-white/15" />
            <div className="h-12 w-full rounded-pill bg-white/30" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-md bg-white/15" />
            <div className="h-12 w-full rounded-pill bg-white/20" />
          </div>
          <div className="h-12 w-full rounded-pill bg-[color:var(--pink)]/60" />
        </div>
      </div>
    </main>
  )
}
