function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_0.8s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6 pb-8">
      {/* Welcome heading */}
      <div className="space-y-2">
        <Shimmer className="h-8 w-56" />
        <Shimmer className="h-4 w-80" />
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <Shimmer className="h-12 w-12 rounded-full" />
              <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-7 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between">
          <Shimmer className="h-6 w-48" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
        <Shimmer className="h-2 w-full rounded-full" />
        <div className="space-y-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
              <Shimmer className="h-4 flex-1" />
              <Shimmer className="h-5 w-5 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
