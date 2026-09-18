export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="h-10 w-64 bg-muted/50 rounded-lg animate-pulse" />
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="h-32 bg-muted/50 rounded animate-pulse" />
      </div>
    </div>
  )
}
