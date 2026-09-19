export function AddonsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-5 w-64 bg-slate-100 rounded animate-pulse"></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="h-10 w-24 bg-slate-200 rounded-md animate-pulse"></div>
          ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                {Array(3)
                  .fill(null)
                  .map((_, j) => (
                    <div key={j} className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                  ))}
              </div>

              <div className="h-10 w-full bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
      </div>
    </div>
  )
}
