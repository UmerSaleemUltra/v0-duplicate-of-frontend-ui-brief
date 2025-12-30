export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/50 backdrop-blur-lg border border-red-500/50 rounded-2xl p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600/20 rounded-full mb-4">
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
          <h2 className="text-lg font-semibold text-white mb-3">Your IP has been blocked due to:</h2>
          <ul className="text-left text-red-200 space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Excessive request rate detected (DDoS protection triggered)</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Suspicious activity pattern identified</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Automated attack behavior recognized</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 text-sm">
            <strong>Temporary Block:</strong> Your IP will be automatically unblocked after 30 minutes of no activity.
          </p>
          <p className="text-yellow-200 text-sm mt-2">
            <strong>Permanent Block:</strong> If you believe this is an error, contact the administrator.
          </p>
        </div>

        <div className="text-sm text-gray-400">
          <p>Request ID: {Date.now()}</p>
          <p className="mt-1">Timestamp: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
