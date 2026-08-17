"use client"

import { useEffect } from "react"

/**
 * Narrowly-scoped guard for a known third-party (Google Tag Manager) crash.
 *
 * A tag configured inside the GTM container reads `config.properties.M_ID`
 * (and `.M_TYPE`) without guarding `properties`, throwing
 * `TypeError: Cannot read properties of undefined (reading 'M_ID')`
 * on hover and route changes. The faulty code lives in GTM's minified bundle,
 * not in this app, so it can only be fixed in the GTM dashboard.
 *
 * This guard suppresses ONLY that exact error signature so it stops surfacing
 * as an uncaught error. Every other error is left completely untouched.
 */

const SIGNATURE = /Cannot read properties of undefined \(reading 'M_(ID|TYPE)'\)/

function isKnownThirdPartyError(message: unknown, error: unknown): boolean {
  const text =
    typeof message === "string"
      ? message
      : error instanceof Error
        ? error.message
        : ""
  return SIGNATURE.test(text)
}

export function ThirdPartyErrorGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isKnownThirdPartyError(event.message, event.error)) {
        // Prevent this specific third-party error from bubbling as uncaught.
        event.preventDefault()
        event.stopImmediatePropagation()
        console.log("[v0] Suppressed known GTM M_ID/M_TYPE third-party error")
      }
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (isKnownThirdPartyError(undefined, reason)) {
        event.preventDefault()
        console.log("[v0] Suppressed known GTM M_ID/M_TYPE promise rejection")
      }
    }

    // Capture phase so we intercept before it is reported as uncaught.
    window.addEventListener("error", onError, true)
    window.addEventListener("unhandledrejection", onRejection, true)

    return () => {
      window.removeEventListener("error", onError, true)
      window.removeEventListener("unhandledrejection", onRejection, true)
    }
  }, [])

  return null
}
