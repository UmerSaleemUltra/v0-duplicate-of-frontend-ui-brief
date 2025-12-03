export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-modal rounded-3xl p-8 animate-pulse">
          <div className="h-12 bg-muted rounded-xl mb-8" />
          <div className="h-8 bg-muted rounded-xl mb-2" />
          <div className="h-4 bg-muted rounded-xl mb-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-11 bg-muted rounded-xl" />
            <div className="h-11 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
