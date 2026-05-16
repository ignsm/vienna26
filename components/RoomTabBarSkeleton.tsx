/**
 * Visual placeholder matching RoomTabBar's fixed-bottom shape. Used inside
 * room sub-route `loading.tsx` files so the tab bar doesn't disappear during
 * navigation — same `fixed bottom-0 z-40` so it stacks above scrolling content
 * just like the real one.
 */
export function RoomTabBarSkeleton() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/95 via-black/80 to-black/30 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-hidden="true"
    >
      <div className="safe-x-tight pt-2 max-w-2xl mx-auto grid grid-cols-3 gap-2 animate-pulse">
        <div className="h-14 rounded-2xl bg-white/[0.08]" />
        <div className="h-14 rounded-2xl bg-white/[0.08]" />
        <div className="h-14 rounded-2xl bg-white/[0.08]" />
      </div>
    </nav>
  )
}
