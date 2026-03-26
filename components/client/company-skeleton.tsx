function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

export function CompanySkeleton() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Shimmer className="h-8 w-48 mb-2" />
          <Shimmer className="h-4 w-64" />
        </div>
      </div>

      {/* Business Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 space-y-4">
        <Shimmer className="h-6 w-40" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 animate-in fade-in" 
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Shimmer className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Sections */}
      {[...Array(2)].map((_, sectionIdx) => (
        <div 
          key={sectionIdx}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4 animate-in fade-in" 
          style={{ animationDelay: `${(sectionIdx + 2) * 100}ms` }}
        >
          <Shimmer className="h-6 w-48" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Shimmer key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
