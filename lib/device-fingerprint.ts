import crypto from "crypto"
import type { NextRequest } from "next/server"

export interface DeviceFingerprint {
  id: string
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platformName: string
  hash: string
}

export interface ClientDeviceInfo {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
}

/**
 * Generates a hash from device fingerprint data
 * Used to identify unique devices
 */
export function generateDeviceFingerprintHash(clientInfo: ClientDeviceInfo): string {
  const fingerprint = `${clientInfo.userAgent}|${clientInfo.screenResolution}|${clientInfo.timezone}|${clientInfo.language}`
  return crypto.createHash("sha256").update(fingerprint).digest("hex")
}

/**
 * Extracts device info from client request
 * Called from frontend with browser fingerprint data
 */
export function parseClientDeviceInfo(userAgent: string, clientData: any): ClientDeviceInfo {
  return {
    userAgent: userAgent || "",
    screenResolution: clientData?.screenResolution || "unknown",
    timezone: clientData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: clientData?.language || "en",
  }
}

/**
 * Extracts IP address from NextRequest
 * Handles X-Forwarded-For header for proxied requests
 */
export function getClientIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // Get the first IP if multiple are present (format: "client, proxy1, proxy2")
    return forwardedFor.split(",")[0].trim()
  }

  const clientIp = request.headers.get("x-real-ip")
  if (clientIp) {
    return clientIp
  }

  // Fallback to connection remote address if available
  return (request as any).socket?.remoteAddress || "0.0.0.0"
}

/**
 * Generates a unique device ID from fingerprint
 * This ID helps identify the same device across sessions
 */
export function generateDeviceId(): string {
  return crypto.randomBytes(16).toString("hex")
}

/**
 * Creates a complete device fingerprint object
 */
export function createDeviceFingerprint(clientInfo: ClientDeviceInfo): DeviceFingerprint {
  const hash = generateDeviceFingerprintHash(clientInfo)
  return {
    id: generateDeviceId(),
    userAgent: clientInfo.userAgent,
    screenResolution: clientInfo.screenResolution,
    timezone: clientInfo.timezone,
    language: clientInfo.language,
    platformName: extractPlatformName(clientInfo.userAgent),
    hash,
  }
}

/**
 * Extracts browser/platform info from user agent
 */
function extractPlatformName(userAgent: string): string {
  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "macOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("iPhone")) return "iOS"
  if (userAgent.includes("Android")) return "Android"
  return "Unknown"
}

/**
 * Compares two device fingerprints
 * Returns true if they match (same device)
 */
export function compareFingerprints(fingerprint1: DeviceFingerprint, fingerprint2: DeviceFingerprint): boolean {
  return fingerprint1.hash === fingerprint2.hash && fingerprint1.platformName === fingerprint2.platformName
}

/**
 * Validates if a device fingerprint is still valid
 * Returns false if fingerprint seems spoofed or tampered
 */
export function isValidFingerprint(fingerprint: DeviceFingerprint): boolean {
  if (!fingerprint.hash || fingerprint.hash.length !== 64) {
    return false
  }

  if (!fingerprint.userAgent || fingerprint.userAgent.length === 0) {
    return false
  }

  if (!fingerprint.platformName || fingerprint.platformName === "Unknown") {
    return false
  }

  return true
}
