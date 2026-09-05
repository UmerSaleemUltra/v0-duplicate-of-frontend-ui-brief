export default function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-lg animate-pulse">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
            <div className="space-y-3">
              <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
              <div className="h-5 bg-slate-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
