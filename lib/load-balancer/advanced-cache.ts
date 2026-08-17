/**
 * Advanced Caching Layer with Smart Invalidation
 * Supports Redis and local fallback with edge optimization
 */

import { Redis } from '@upstash/redis'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
  tags: string[]
}

interface CacheConfig {
  defaultTTL?: number
  maxLocalSize?: number
  useRedis?: boolean
}

class AdvancedCache {
  private redis: Redis | null = null
  private localCache: Map<string, CacheEntry<any>> = new Map()
  private config: Required<CacheConfig>
  private tagIndex: Map<string, Set<string>> = new Map()
  private initialized = false

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 3600000, // 1 hour
      maxLocalSize: config.maxLocalSize || 1000,
      useRedis: config.useRedis !== false,
    }

    this.initRedis()
  }

  private initRedis() {
    if (this.initialized) return

    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

    if (this.config.useRedis && url && token) {
      try {
        this.redis = new Redis({ url, token })
      } catch (error) {
        console.error('[AdvancedCache] Failed to initialize Redis:', error)
      }
    }
    this.initialized = true
  }

  async get<T>(key: string): Promise<T | null> {
    // Try local cache first
    const localEntry = this.localCache.get(key)
    if (localEntry) {
      if (Date.now() - localEntry.timestamp <= localEntry.expiresIn) {
        return localEntry.data as T
      } else {
        this.localCache.delete(key)
      }
    }

    // Try Redis
    if (this.redis) {
      try {
        const data = await this.redis.get(key)
        if (data) {
          const entry = (typeof data === "string" ? JSON.parse(data) : data) as CacheEntry<T>
          if (!entry || typeof entry !== "object" || !("data" in entry)) return null

          // Update local cache
          this.addToLocalCache(key, entry)

          return entry.data
        }
      } catch (error) {
        console.error('[AdvancedCache] Failed to get from Redis:', error)
      }
    }

    return null
  }

  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
    } = {}
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL
    const tags = options.tags || []

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
      tags,
    }

    // Add to local cache
    this.addToLocalCache(key, entry)

    // Add to tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }

    // Add to Redis
    if (this.redis) {
      try {
        await this.redis.setex(
          key,
          Math.ceil(ttl / 1000),
          JSON.stringify(entry)
        )
      } catch (error) {
        console.error('[AdvancedCache] Failed to set in Redis:', error)
      }
    }
  }

  private addToLocalCache<T>(key: string, entry: CacheEntry<T>) {
    // Implement LRU eviction
    if (this.localCache.size >= this.config.maxLocalSize) {
      let oldestKey: string | null = null
      let oldestTime = Date.now()

      for (const [k, v] of this.localCache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp
          oldestKey = k
        }
      }

      if (oldestKey) {
        this.localCache.delete(oldestKey)
      }
    }

    this.localCache.set(key, entry)
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag)

    if (keys) {
      for (const key of keys) {
        this.localCache.delete(key)

        if (this.redis) {
          try {
            await this.redis.del(key)
          } catch (error) {
            console.error('[AdvancedCache] Failed to invalidate in Redis:', error)
          }
        }
      }

      this.tagIndex.delete(tag)
    }
  }

  async delete(key: string): Promise<void> {
    this.localCache.delete(key)

    if (this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        console.error('[AdvancedCache] Failed to delete from Redis:', error)
      }
    }
  }

  async clear(): Promise<void> {
    this.localCache.clear()
    this.tagIndex.clear()

    if (this.redis) {
      try {
        const keys = await this.redis.keys('*')
        if (keys.length > 0) {
          await this.redis.del(...(keys as string[]))
        }
      } catch (error) {
        console.error('[AdvancedCache] Failed to clear Redis:', error)
      }
    }
  }

  getStats() {
    return {
      localCacheSize: this.localCache.size,
      maxLocalSize: this.config.maxLocalSize,
      redisEnabled: this.redis !== null,
      tagCount: this.tagIndex.size,
    }
  }
}

export const advancedCache = new AdvancedCache()
