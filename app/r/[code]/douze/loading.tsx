import { RoomTabBarSkeleton } from "@/components/RoomTabBarSkeleton"

export default function DouzeLoading() {
  return (
    <main className="min-h-dvh pb-32">
      {/* Sticky header placeholder — matches RoomHeader height */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="safe-x py-2.5 max-w-2xl mx-auto h-14 flex items-center" />
      </div>

      <section className="safe-x pt-5 max-w-2xl mx-auto space-y-5 animate-pulse">
        <div className="space-y-2">
          <div className="h-9 w-72 rounded-md bg-white/20" />
          <div className="h-4 w-80 rounded-md bg-white/10" />
        </div>

        {/* 10 rows: points pill + country combobox */}
        <div className="card-light !p-3 md:!p-4 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 p-1.5">
              <div
                className={`shrink-0 rounded-full ${
                  i === 0 ? "w-11 h-11 bg-black/15" : "w-10 h-10 bg-black/10"
                }`}
              />
              <div className="flex-1 h-12 rounded-xl bg-black/[0.06]" />
            </div>
          ))}
        </div>

        <div className="h-14 w-full rounded-2xl bg-[color:var(--pink)]/40" />
      </section>

      <RoomTabBarSkeleton />
    </main>
  )
}
