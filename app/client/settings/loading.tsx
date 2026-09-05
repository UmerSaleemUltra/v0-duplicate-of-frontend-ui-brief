import { ClientShell } from "@/components/client/client-shell"

export default function SettingsLoading() {
  return (
    <ClientShell>
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-9 w-32 bg-slate-200 rounded" />
          <div className="h-5 w-64 bg-slate-200 rounded mt-2" />
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-200 rounded-lg" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-64 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </ClientShell>
  )
}
