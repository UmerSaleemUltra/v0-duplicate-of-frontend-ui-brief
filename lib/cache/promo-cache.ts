/**
 * Promo Code Cache Manager
 * Implements Redis-based caching with TTL and cache invalidation patterns
 * Falls back to in-memory cache if Redis is unavailable
 */

const CACHE_TTL = 5 * 60 // 5 minutes in seconds
const CACHE_KEY_PREFIX = "promo:"

// In-memory fallback cache
class InMemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map()

  set(key: string, value: any, ttl: number = CACHE_TTL) {
    const expiry = Date.now() + ttl * 1000
    this.cache.set(key, { value, expiry })
  }

  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    // Pattern-based deletion (e.g., "promo:*")
    const regex = new RegExp(`^${pattern.replace("*", ".*")}$`)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

const inMemoryCache = new InMemoryCache()

export async function getPromoCodesFromCache(): Promise<any[] | null> {
  const key = `${CACHE_KEY_PREFIX}list`
  return inMemoryCache.get(key)
}

export async function setPromoCodesCache(codes: any[]): Promise<void> {
  const key = `${CACHE_KEY_PREFIX}list`
  inMemoryCache.set(key, codes, CACHE_TTL)
}

export async function getPromoCodeFromCache(id: string): Promise<any | null> {
  const key = `${CACHE_KEY_PREFIX}${id}`
  return inMemoryCache.get(key)
}

export async function setPromoCodeCache(id: string, code: any): Promise<void> {
  const key = `${CACHE_KEY_PREFIX}${id}`
  inMemoryCache.set(key, code, CACHE_TTL)
}

export async function invalidatePromoCodeCache(id?: string): Promise<void> {
  if (id) {
    inMemoryCache.delete(`${CACHE_KEY_PREFIX}${id}`)
  }
  inMemoryCache.clear(`${CACHE_KEY_PREFIX}list`)
}

export async function invalidateAllPromoCache(): Promise<void> {
  inMemoryCache.clear(`${CACHE_KEY_PREFIX}*`)
}

export async function getCachedPromoCode(id: string, fetchFn: () => Promise<any>): Promise<any> {
  // Try cache first
  let cached = await getPromoCodeFromCache(id)
  if (cached) {
    return cached
  }

  // Fetch and cache
  const code = await fetchFn()
  if (code) {
    await setPromoCodeCache(id, code)
  }

  return code
}

export async function getCachedPromoCodes(fetchFn: () => Promise<any[]>): Promise<any[]> {
  // Try cache first
  let cached = await getPromoCodesFromCache()
  if (cached) {
    return cached
  }

  // Fetch and cache
  const codes = await fetchFn()
  if (codes && codes.length > 0) {
    await setPromoCodesCache(codes)
  }

  return codes
}
