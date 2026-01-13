export function MailroomSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
