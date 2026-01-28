/**
 * Request Queue Manager for Vercel
 * Uses Upstash Redis for distributed request queuing
 */

import { Redis } from '@upstash/redis'

interface QueuedRequest {
  id: string
  endpoint: string
  method: string
  priority: number
  timestamp: number
  retries: number
  maxRetries: number
  data?: any
}

interface QueueStats {
  pending: number
  processing: number
  failed: number
  completed: number
  avgWaitTime: number
}

class QueueManager {
  private redis: Redis | null = null
  private initialized = false
  private stats = {
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    totalWaitTime: 0,
    requestCount: 0,
  }

  private async initRedis() {
    if (this.initialized) return
    
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
        this.initialized = true
      }
    } catch (error) {
      console.error('[QueueManager] Failed to initialize Redis:', error)
    }
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<string> {
    await this.initRedis()
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retries: 0,
    }

    if (!this.redis) {
      // Fallback: process immediately if Redis unavailable
      return id
    }

    try {
      const key = `queue:${request.priority}:${id}`
      await this.redis.setex(
        key,
        3600, // 1 hour TTL
        JSON.stringify(queuedRequest)
      )
      
      // Update stats
      await this.redis.incr('stats:queue:pending')
      this.stats.pending++
      
      return id
    } catch (error) {
      console.error('[QueueManager] Failed to enqueue request:', error)
      return id
    }
  }

  async dequeue(priority: number = 0): Promise<QueuedRequest | null> {
    await this.initRedis()
    
    if (!this.redis) return null

    try {
      // Get highest priority request
      const keys = await this.redis.keys(`queue:${priority}:*`)
      
      if (keys.length === 0) {
        return null
      }

      const key = keys[0] as string
      const data = await this.redis.get(key)
      
      if (!data) return null

      const request = JSON.parse(data as string) as QueuedRequest
      
      // Move to processing
      await this.redis.del(key)
      await this.redis.decr('stats:queue:pending')
      await this.redis.incr('stats:queue:processing')
      
      return request
    } catch (error) {
      console.error('[QueueManager] Failed to dequeue request:', error)
      return null
    }
  }

  async markComplete(requestId: string, waitTime: number): Promise<void> {
    await this.initRedis()
    
    if (!this.redis) return

    try {
      await this.redis.decr('stats:queue:processing')
      await this.redis.incr('stats:queue:completed')
      
      // Track average wait time
      const totalWaitKey = 'stats:queue:totalWaitTime'
      const countKey = 'stats:queue:requestCount'
      
      await this.redis.incrby(totalWaitKey, waitTime)
      await this.redis.incr(countKey)
      
      this.stats.completed++
      this.stats.totalWaitTime += waitTime
      this.stats.requestCount++
    } catch (error) {
      console.error('[QueueManager] Failed to mark request complete:', error)
    }
  }

  async markFailed(requestId: string, request: QueuedRequest): Promise<boolean> {
    await this.initRedis()
    
    if (!this.redis) return false

    try {
      if (request.retries < request.maxRetries) {
        // Re-queue with exponential backoff
        const backoffMs = Math.pow(2, request.retries) * 1000
        const key = `queue:${request.priority}:${requestId}`
        
        await this.redis.setex(
          key,
          3600,
          JSON.stringify({
            ...request,
            retries: request.retries + 1,
          })
        )
        
        return true // Will retry
      } else {
        await this.redis.incr('stats:queue:failed')
        this.stats.failed++
        return false // Max retries exceeded
      }
    } catch (error) {
      console.error('[QueueManager] Failed to mark request as failed:', error)
      return false
    }
  }

  async getStats(): Promise<QueueStats> {
    await this.initRedis()
    
    if (!this.redis) {
      return {
        pending: this.stats.pending,
        processing: this.stats.processing,
        failed: this.stats.failed,
        completed: this.stats.completed,
        avgWaitTime: 0,
      }
    }

    try {
      const [pending, processing, failed, completed, totalWait, count] = await Promise.all([
        this.redis.get('stats:queue:pending'),
        this.redis.get('stats:queue:processing'),
        this.redis.get('stats:queue:failed'),
        this.redis.get('stats:queue:completed'),
        this.redis.get('stats:queue:totalWaitTime'),
        this.redis.get('stats:queue:requestCount'),
      ])

      const avgWaitTime = count && totalWait 
        ? (Number(totalWait) / Number(count)) 
        : 0

      return {
        pending: Number(pending || 0),
        processing: Number(processing || 0),
        failed: Number(failed || 0),
        completed: Number(completed || 0),
        avgWaitTime,
      }
    } catch (error) {
      console.error('[QueueManager] Failed to get queue stats:', error)
      return {
        pending: 0,
        processing: 0,
        failed: 0,
        completed: 0,
        avgWaitTime: 0,
      }
    }
  }

  async clearQueue(): Promise<void> {
    await this.initRedis()
    
    if (!this.redis) return

    try {
      const keys = await this.redis.keys('queue:*')
      if (keys.length > 0) {
        await this.redis.del(...(keys as string[]))
      }
    } catch (error) {
      console.error('[QueueManager] Failed to clear queue:', error)
    }
  }
}

export const queueManager = new QueueManager()
