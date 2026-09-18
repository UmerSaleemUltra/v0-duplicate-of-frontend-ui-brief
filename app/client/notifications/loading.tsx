import { ClientShell } from "@/components/client/client-shell"

export default function NotificationsLoading() {
  return (
    <ClientShell>
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded" />
            <div className="h-5 w-96 bg-slate-200 rounded mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-32 bg-slate-200 rounded" />
          </div>
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-slate-200 rounded" />
                <div className="h-5 w-full bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ClientShell>
  )
}
