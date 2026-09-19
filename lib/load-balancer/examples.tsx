/**
 * Example: How to integrate Load Balancer into existing API routes
 * This file demonstrates best practices for using the load balancing suite
 */

// ============ EXAMPLE 1: Simple API Route with Load Balancing ============

import { NextRequest, NextResponse } from 'next/server'
import { withLoadBalancing } from '@/lib/load-balancer/request-distributor'
import { enhancedDb } from '@/lib/load-balancer/enhanced-db'

// Wrap your handler with load balancing
const handler = async (req: NextRequest) => {
  if (req.method === 'GET') {
    // Get companies with caching
    const companies = await enhancedDb.find(
      'companies',
      {},
      {
        cache: true,
        ttl: 3600000, // 1 hour
        tags: ['companies', 'public'],
        limit: 100,
      }
    )

    return NextResponse.json(companies)
  }

  if (req.method === 'POST') {
    // Create new company and invalidate related cache
    const data = await req.json()

    const id = await enhancedDb.insertOne('companies', data, [
      'companies', // Invalidate company list
      'company-list', // Any other related caches
    ])

    return NextResponse.json({ id }, { status: 201 })
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export const GET = withLoadBalancing(handler)
export const POST = withLoadBalancing(handler)

// ============ EXAMPLE 2: User Retrieval with Smart Caching ============

import { advancedCache } from '@/lib/load-balancer'

export async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`

  // Check cache first
  let user = await advancedCache.get(cacheKey)

  if (!user) {
    // Fetch from database if not cached
    user = await enhancedDb.findOne(
      'users',
      { id: userId },
      {
        cache: false, // We handle caching manually here
      }
    )

    if (user) {
      // Cache with multiple tags for flexible invalidation
      await advancedCache.set(cacheKey, user, {
        ttl: 3600000, // 1 hour
        tags: ['user', `user:${userId}`, 'user-list'],
      })
    }
  }

  return user
}

// ============ EXAMPLE 3: Order Processing with Priority Queueing ============

import { queueManager } from '@/lib/load-balancer'

export async function processOrderCreation(req: NextRequest) {
  const data = await req.json()

  // Check current load
  const queueStats = await queueManager.getStats()

  // If system is busy, queue the order for later processing
  if (queueStats.pending > 10) {
    const requestId = await queueManager.enqueue({
      endpoint: '/api/orders',
      method: 'POST',
      priority: 3, // High priority for payments
      maxRetries: 3,
      data,
    })

    return NextResponse.json(
      {
        queued: true,
        requestId,
        message: 'Your order is being processed',
      },
      { status: 202 } // Accepted
    )
  }

  // Process immediately if system is not busy
  const orderId = await enhancedDb.insertOne(
    'orders',
    {
      ...data,
      createdAt: new Date(),
      status: 'pending',
    },
    ['orders', 'order-list', `user:${data.userId}`]
  )

  return NextResponse.json({ orderId }, { status: 201 })
}

// ============ EXAMPLE 4: Batch Update with Cache Invalidation ============

export async function batchUpdateProducts(
  productIds: string[],
  updates: Record<string, any>
) {
  const db = await enhancedDb // This uses connection pool internally

  // Batch update
  for (const productId of productIds) {
    await enhancedDb.updateOne(
      'products',
      { id: productId },
      updates,
      [
        'products', // Invalidate product list
        `product:${productId}`, // Invalidate specific product
        'product-search', // Invalidate search results
      ]
    )
  }

  return { updated: productIds.length }
}

// ============ EXAMPLE 5: Monitoring with Metrics Hook (Client Component) ============

'use client'

import { useLoadBalancerMetrics, useCacheStats } from '@/lib/load-balancer/hooks'

export function PerformanceMonitor() {
  const { metrics, refetch } = useLoadBalancerMetrics(10000) // Update every 10s
  const { stats: cacheStats, clearCache } = useCacheStats()

  if (!metrics) return <div>Loading metrics...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-blue-50 rounded">
        <h3>Queue Status</h3>
        <p>Pending: {metrics.health.checks.queue.pending}</p>
        <p>Processing: {metrics.health.checks.queue.processing}</p>
      </div>

      <div className="p-4 bg-green-50 rounded">
        <h3>Database Pool</h3>
        <p>Pool Size: {metrics.health.checks.database.poolSize}</p>
        <p>Active: {metrics.health.checks.database.totalActiveRequests}</p>
      </div>

      <div className="p-4 bg-purple-50 rounded">
        <h3>Cache Utilization</h3>
        <p>{metrics.health.checks.cache.utilizationPercent}% used</p>
        <button onClick={clearCache} className="mt-2 px-2 py-1 bg-red-500 text-white rounded">
          Clear Cache
        </button>
      </div>
    </div>
  )
}

// ============ EXAMPLE 6: Circuit Breaker Pattern (Automatic Fallback) ============

import { requestDistributor } from '@/lib/load-balancer'

export async function fetchDataWithFallback(endpoint: string) {
  const isOpen = requestDistributor.isCircuitBreakerOpen(endpoint)

  if (isOpen) {
    // Return cached/fallback data instead
    console.log(`Circuit breaker open for ${endpoint}, using fallback data`)
    return { fallback: true, data: [] }
  }

  try {
    const response = await fetch(endpoint)
    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    // Error will be recorded and circuit breaker may open
    throw error
  }
}

// ============ EXAMPLE 7: Integration with Existing Route Handler ============

// app/api/admin/dashboard/route.ts
export async function GET(req: NextRequest) {
  return withLoadBalancing(async (req) => {
    // This handler automatically gets:
    // - Request queuing when system is busy
    // - Circuit breaker protection
    // - Response time tracking
    // - Automatic cache headers

    const stats = await Promise.all([
      enhancedDb.find('companies', {}, { cache: true, ttl: 300000 }),
      enhancedDb.find('users', {}, { cache: true, ttl: 300000 }),
      enhancedDb.find('orders', {}, { cache: true, ttl: 60000 }),
    ])

    return NextResponse.json({
      companies: stats[0].length,
      users: stats[1].length,
      orders: stats[2].length,
    })
  })(req)
}

// ============ USAGE SUMMARY ============

/**
 * Key Integration Points:
 * 
 * 1. Database Access:
 *    - Use enhancedDb instead of direct MongoDB
 *    - Automatic connection pooling and health checks
 *    - Built-in cache layer with tag-based invalidation
 * 
 * 2. Request Handling:
 *    - Wrap handlers with withLoadBalancing()
 *    - Automatic queue management under load
 *    - Circuit breaker protection
 * 
 * 3. Caching:
 *    - Use advancedCache for fine-grained control
 *    - Tag-based invalidation for related data
 *    - Automatic Redis sync if available
 * 
 * 4. Monitoring:
 *    - Use client-side hooks to display metrics
 *    - Access /api/lb/* endpoints for programmatic access
 *    - Check dashboard for system health
 * 
 * 5. Error Handling:
 *    - Circuit breaker prevents cascading failures
 *    - Queued requests automatically retry
 *    - Graceful degradation when Redis unavailable
 */
