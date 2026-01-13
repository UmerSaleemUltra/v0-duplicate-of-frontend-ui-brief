export function CompanySkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
