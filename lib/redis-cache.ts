import { createClient } from 'redis'

let redisClient: any = null
let isConnecting = false

/**
 * Get or create Redis client connection
 * Falls back to in-memory cache if Redis is not available
 */
export async function getRedisClient() {
  // If already connected, return existing client
  if (redisClient) {
    return redisClient
  }

  // If connecting, wait for connection
  if (isConnecting) {
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (redisClient) {
          clearInterval(checkConnection)
          resolve(redisClient)
        }
      }, 100)
    })
  }

  // Try to connect to Redis
  try {
    isConnecting = true
    const redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('[v0] Redis reconnection attempts exceeded, falling back to memory cache')
            return new Error('Max retries exceeded')
          }
          return retries * 100
        },
      },
    })

    redis.on('error', (err: any) => {
      console.warn('[v0] Redis error, using memory cache:', err.message)
    })

    await redis.connect()
    console.log('[v0] Redis connected successfully')
    isConnecting = false
    redisClient = redis
    return redisClient
  } catch (error) {
    console.warn('[v0] Redis connection failed, using memory cache:', error instanceof Error ? error.message : String(error))
    isConnecting = false
    return null
  }
}

/**
 * Cache interface for unified cache operations
 */
export class RedisCache {
  private memoryCache: Map<string, { data: any; expires: number }> = new Map()

  async set<T>(key: string, data: T, expiresIn: number = 300): Promise<void> {
    try {
      const client = await getRedisClient()
      if (client) {
        // Store in Redis with expiration in seconds
        await client.setEx(key, expiresIn, JSON.stringify(data))
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, {
          data,
          expires: Date.now() + expiresIn * 1000,
        })
      }
    } catch (error) {
      console.warn('[v0] Cache set failed:', error instanceof Error ? error.message : String(error))
      // Fallback to memory cache
      this.memoryCache.set(key, {
        data,
        expires: Date.now() + expiresIn * 1000,
      })
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient()
      if (client) {
        const data = await client.get(key)
        if (data) {
          return JSON.parse(data) as T
        }
      }
    } catch (error) {
      console.warn('[v0] Cache get from Redis failed:', error instanceof Error ? error.message : String(error))
    }

    // Check memory cache
    const entry = this.memoryCache.get(key)
    if (entry) {
      if (Date.now() < entry.expires) {
        return entry.data as T
      }
      this.memoryCache.delete(key)
    }

    return null
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient()
      if (client) {
        await client.del(key)
      }
    } catch (error) {
      console.warn('[v0] Cache delete failed:', error instanceof Error ? error.message : String(error))
    }
    this.memoryCache.delete(key)
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = await getRedisClient()
      if (client) {
        const keys = await client.keys(pattern)
        if (keys.length > 0) {
          await client.del(keys)
        }
      }
    } catch (error) {
      console.warn('[v0] Cache pattern invalidation failed:', error instanceof Error ? error.message : String(error))
    }

    // Memory cache pattern invalidation
    const memKeys = Array.from(this.memoryCache.keys())
    const regex = new RegExp(pattern.replace('*', '.*'))
    memKeys.forEach((key) => {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
      }
    })
  }

  async clear(): Promise<void> {
    try {
      const client = await getRedisClient()
      if (client) {
        await client.flushDb()
      }
    } catch (error) {
      console.warn('[v0] Cache clear failed:', error instanceof Error ? error.message : String(error))
    }
    this.memoryCache.clear()
  }
}

export const redisCache = new RedisCache()
