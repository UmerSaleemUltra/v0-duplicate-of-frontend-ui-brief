/**
 * Geolocation utilities for security checks
 * Uses IP geolocation to detect impossible travel and suspicious activity
 */

export interface GeoLocation {
  ip: string
  country: string
  city: string
  latitude: number
  longitude: number
}

/**
 * Caches geolocation data to avoid repeated API calls
 */
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Gets geolocation for an IP address
 * Uses IP geolocation service (can be replaced with any provider)
 * For demo: returns mock data
 */
export async function getGeoLocation(ipAddress: string): Promise<GeoLocation> {
  // Check cache first
  const cached = geoCache.get(ipAddress)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    // Using ip-api.com free tier (no key required for 45 req/min)
    // In production, use paid service or your own database
    const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=query,country,city,lat,lon`, {
      headers: { "User-Agent": "BuzzFiling-Security/1.0" },
    })

    if (!response.ok) {
      return getMockGeoLocation(ipAddress)
    }

    const data = await response.json()

    if (data.status === "fail") {
      return getMockGeoLocation(ipAddress)
    }

    const geoLocation: GeoLocation = {
      ip: data.query,
      country: data.country || "Unknown",
      city: data.city || "Unknown",
      latitude: data.lat || 0,
      longitude: data.lon || 0,
    }

    // Cache the result
    geoCache.set(ipAddress, { data: geoLocation, timestamp: Date.now() })

    return geoLocation
  } catch (error) {
    console.error("[v0] Geolocation fetch error:", error)
    return getMockGeoLocation(ipAddress)
  }
}

/**
 * Mock geolocation for testing or when service is unavailable
 */
function getMockGeoLocation(ipAddress: string): GeoLocation {
  return {
    ip: ipAddress,
    country: "Unknown",
    city: "Unknown",
    latitude: 0,
    longitude: 0,
  }
}

/**
 * Calculates distance between two coordinates (in kilometers)
 * Uses Haversine formula for great-circle distance
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Detects impossible travel between two locations
 * Returns true if travel between locations is physically impossible
 *
 * Assumes average human travel speed of ~900 km/h (airplane speed)
 * If someone logs in from NYC, then London in < 6 hours = impossible
 */
export function isImpossibleTravel(
  location1: GeoLocation,
  location2: GeoLocation,
  timeGapMinutes: number,
): boolean {
  // Same location = not impossible
  if (location1.country === location2.country && location1.city === location2.city) {
    return false
  }

  // Unknown locations = cannot determine
  if (
    location1.country === "Unknown" ||
    location2.country === "Unknown" ||
    (location1.latitude === 0 && location1.longitude === 0) ||
    (location2.latitude === 0 && location2.longitude === 0)
  ) {
    return false
  }

  const distance = calculateDistance(location1.latitude, location1.longitude, location2.latitude, location2.longitude)
  const maxPossibleDistance = (timeGapMinutes / 60) * 900 // 900 km/h average plane speed

  // If distance > maxPossibleDistance, it's impossible travel
  return distance > maxPossibleDistance
}

/**
 * Formats geolocation for display
 */
export function formatGeoLocation(geo: GeoLocation): string {
  if (geo.city && geo.country) {
    return `${geo.city}, ${geo.country}`
  }
  if (geo.country) {
    return geo.country
  }
  return geo.ip
}

/**
 * Checks if two locations are in the same country
 */
export function isSameCountry(location1: GeoLocation, location2: GeoLocation): boolean {
  return location1.country === location2.country && location1.country !== "Unknown"
}
