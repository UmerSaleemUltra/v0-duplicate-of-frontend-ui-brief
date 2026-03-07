import { redirect } from "next/navigation"

export default async function BlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; until?: string; ip?: string; permanent?: string; vpn?: string }>
}) {
  const params = await searchParams

  // Guard: only the middleware redirects here with an `ip` param.
  // If someone navigates directly without that param, send them home.
  if (!params.ip) {
    redirect("/")
  }

  const reason = params.reason || "Security policy violation"
  const until = params.until
  const ip = params.ip
  const isPermanent = params.permanent === "true"
  const isVpn = params.vpn === "true"

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-600/20 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <svg className="w-14 h-14 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-red-500 mb-3 animate-pulse">Access Blocked</h1>
          <p className="text-2xl text-red-300 font-medium">Security System Activated</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Block Reason:
            </h2>
            <p className="text-red-100 text-lg leading-relaxed">{reason}</p>

            <div className="mt-6 pt-6 border-t border-red-500/20 space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-900/30 rounded-lg">
                <span className="text-gray-300 font-medium">Your IP Address:</span>
                <span className="text-white font-mono font-bold">{ip}</span>
              </div>
              {until && !isPermanent && (
                <div className="flex justify-between items-center p-3 bg-red-900/30 rounded-lg">
                  <span className="text-gray-300 font-medium">Access Restored At:</span>
                  <span className="text-white font-semibold">{new Date(until).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`${isPermanent ? "bg-gradient-to-r from-red-950/60 to-red-900/60 border-red-400/40" : "bg-gradient-to-r from-yellow-950/60 to-orange-900/60 border-yellow-400/40"} border-2 rounded-xl p-6 mb-6`}
          >
            {isPermanent ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-200 font-bold text-lg mb-2">Permanent Block Active</p>
                <p className="text-red-300 text-sm leading-relaxed">
                  Your IP has been permanently blocked due to severe security violations. If you believe this is an
                  error, please contact the system administrator with the request ID below.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-yellow-200 font-bold text-lg mb-2">Temporary Block</p>
                <p className="text-yellow-300 text-sm leading-relaxed">
                  Your access has been temporarily restricted. The block will be automatically lifted after the
                  specified time. Please wait and try again later.
                </p>
              </div>
            )}
          </div>

          {isVpn && (
            <div className="bg-orange-950/50 border border-orange-500/40 rounded-xl p-5 mb-6 flex gap-4 items-start">
              <div className="shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-orange-200 font-bold text-sm mb-1">VPN / Proxy Detected</p>
                <p className="text-orange-300 text-sm leading-relaxed">
                  A VPN or proxy connection was detected on your request. Your IP has been blocked and using a
                  VPN or proxy will not bypass this restriction. All routed IP addresses associated with this
                  session have been logged.
                </p>
              </div>
            </div>
          )}

          <div className="text-center space-y-2 pt-4 border-t border-red-500/20">
            <p className="text-gray-400 text-sm font-mono">Request ID: {Date.now()}</p>
            <p className="text-gray-500 text-xs">Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6 animate-in fade-in duration-1000 delay-500">
          Security powered by Buzz Filing Advanced Protection System
        </p>
      </div>
    </div>
  )
}
