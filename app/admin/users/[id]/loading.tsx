export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 bg-muted animate-pulse rounded" />
      <div className="h-48 bg-muted animate-pulse rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
