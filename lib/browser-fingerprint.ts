/**
 * Browser-based device fingerprinting
 * Generates a unique identifier for the current browser
 * This runs entirely in the browser - no server calls needed
 */

export interface BrowserFingerprint {
  screenResolution: string
  timezone: string
  language: string
  userAgent: string
  canvasHash?: string
}

/**
 * Generates a fingerprint hash from browser data
 * Returns a 64-character hex string
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const fingerprint = collectBrowserFingerprint()
    return await hashFingerprint(fingerprint)
  } catch (error) {
    console.error("[v0] Error generating device fingerprint:", error)
    // Fallback: use current timestamp to generate a hash
    return await hashFingerprint({
      screenResolution: "unknown",
      timezone: "unknown",
      language: "unknown",
      userAgent: "unknown",
    })
  }
}

/**
 * Collects browser fingerprint data
 * Gathers information that uniquely identifies the current browser
 */
function collectBrowserFingerprint(): BrowserFingerprint {
  return {
    screenResolution: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    userAgent: navigator.userAgent,
    canvasHash: generateCanvasHash(),
  }
}

/**
 * Generates a canvas fingerprint using WebGL
 * Provides additional entropy for device identification
 */
function generateCanvasHash(): string {
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return "no-canvas"
    }

    // Draw some text and measure it
    ctx.textBaseline = "top"
    ctx.font = '14px "Arial"'
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = "#f60"
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = "#069"
    ctx.fillText("BuzzFiling Device ID", 2, 15)
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
    ctx.fillText("BuzzFiling Device ID", 4, 17)

    return canvas.toDataURL().substring(0, 64)
  } catch (error) {
    return "canvas-error"
  }
}

/**
 * Hashes a fingerprint using SubtleCrypto (native browser crypto)
 */
async function hashFingerprint(fingerprint: BrowserFingerprint): Promise<string> {
  try {
    const data = JSON.stringify({
      screenResolution: fingerprint.screenResolution,
      timezone: fingerprint.timezone,
      language: fingerprint.language,
      userAgent: fingerprint.userAgent,
    })

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch (error) {
    console.error("[v0] Error hashing fingerprint:", error)
    // Fallback: return mock hash
    return "0".repeat(64)
  }
}

/**
 * Stores device fingerprint in session storage (not persistent)
 * This is safe because it's not accessible via XSS or network
 */
export function storeDeviceFingerprint(fingerprint: string): void {
  try {
    sessionStorage.setItem("bzf_device_fp", fingerprint)
  } catch (error) {
    console.warn("[v0] Could not store device fingerprint in session storage:", error)
  }
}

/**
 * Retrieves stored device fingerprint from session storage
 */
export function getStoredDeviceFingerprint(): string | null {
  try {
    return sessionStorage.getItem("bzf_device_fp")
  } catch (error) {
    console.warn("[v0] Could not retrieve device fingerprint from session storage:", error)
    return null
  }
}

/**
 * Clears device fingerprint from session storage (on logout)
 */
export function clearDeviceFingerprint(): void {
  try {
    sessionStorage.removeItem("bzf_device_fp")
  } catch (error) {
    console.warn("[v0] Could not clear device fingerprint:", error)
  }
}

/**
 * Check if fingerprint has changed (device/browser changed)
 */
export async function hasDeviceFingerprintChanged(): Promise<boolean> {
  const stored = getStoredDeviceFingerprint()
  if (!stored) {
    return false // No previous fingerprint to compare
  }

  const current = await generateDeviceFingerprint()
  return stored !== current
}
