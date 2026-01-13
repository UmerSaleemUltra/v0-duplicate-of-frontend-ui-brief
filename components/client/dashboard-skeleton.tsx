export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
