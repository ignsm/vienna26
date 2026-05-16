import { RoomTabBarSkeleton } from "@/components/RoomTabBarSkeleton"

export default function ResultsLoading() {
  return (
    <main className="min-h-dvh pb-32">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="safe-x py-2.5 max-w-2xl mx-auto h-14 flex items-center" />
      </div>

      <div className="safe-x pt-5 max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-9 w-44 rounded-md bg-white/20" />
          <div className="h-3 w-72 rounded-md bg-white/10" />
        </div>

        {/* Leaderboard rows */}
        <div className="card-light !p-3 space-y-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 h-11 rounded-lg px-3">
              <div className="w-5 h-3 rounded bg-black/15" />
              <div className="w-6 h-6 rounded-full bg-black/15" />
              <div className="flex-1 h-3 rounded bg-black/10" />
              <div className="w-12 h-3 rounded bg-black/15" />
            </div>
          ))}
        </div>
      </div>

      <RoomTabBarSkeleton />
    </main>
  )
}
