export default function BlockedPage({
  searchParams,
}: {
  searchParams: { reason?: string; until?: string; ip?: string; permanent?: string }
}) {
  const reason = searchParams.reason || "Security policy violation"
  const until = searchParams.until
  const ip = searchParams.ip || "Unknown"
  const isPermanent = searchParams.permanent === "true"

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/50 backdrop-blur-lg border border-red-500/50 rounded-2xl p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600/20 rounded-full mb-4 animate-pulse">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-red-500 mb-2">Access Blocked</h1>
          <p className="text-xl text-red-300">Security System Activated</p>
        </div>

        <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Block Reason:</h2>
          <p className="text-red-200 text-left">{reason}</p>

          <div className="mt-4 pt-4 border-t border-red-500/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Your IP:</span>
              <span className="text-white font-mono">{ip}</span>
            </div>
            {until && !isPermanent && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">Blocked Until:</span>
                <span className="text-white">{new Date(until).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`${isPermanent ? "bg-red-950/30 border-red-500/30" : "bg-yellow-950/30 border-yellow-500/30"} border rounded-lg p-4 mb-6`}
        >
          {isPermanent ? (
            <div className="text-red-200">
              <p className="font-semibold mb-2">Permanent Block</p>
              <p className="text-sm">
                Your IP has been permanently blocked due to severe security violations. Contact the administrator if you
                believe this is an error.
              </p>
            </div>
          ) : (
            <div className="text-yellow-200">
              <p className="font-semibold mb-2">Temporary Block</p>
              <p className="text-sm">
                Your IP will be automatically unblocked after the specified time. Please wait and try again later.
              </p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400">
          <p>Request ID: {Date.now()}</p>
          <p className="mt-1">Timestamp: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
