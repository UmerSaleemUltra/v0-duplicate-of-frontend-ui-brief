import { NextRequest, NextResponse } from 'next/server'
import {
  queueManager,
  connectionPool,
  advancedCache,
  requestDistributor,
} from '@/lib/load-balancer'

/**
 * Load Balancer Metrics Endpoint
 * GET /api/lb/metrics
 */
export async function GET(req: NextRequest) {
  try {
    const [queueStats, dbStats, cacheStats, metrics] = await Promise.all([
      queueManager.getStats(),
      Promise.resolve(connectionPool.getStats()),
      Promise.resolve(advancedCache.getStats()),
      Promise.resolve(requestDistributor.getMetrics()),
    ])

    const response = {
      timestamp: new Date().toISOString(),
      health: {
        status: 'healthy',
        checks: {
          queue: {
            pending: queueStats.pending,
            processing: queueStats.processing,
            avgWaitTime: Math.round(queueStats.avgWaitTime),
          },
          database: {
            poolSize: dbStats.poolSize,
            totalActiveRequests: dbStats.totalActiveRequests,
            connections: dbStats.connections,
          },
          cache: {
            localCacheSize: cacheStats.localCacheSize,
            maxLocalSize: cacheStats.maxLocalSize,
            utilizationPercent: Math.round((cacheStats.localCacheSize / cacheStats.maxLocalSize) * 100),
            redisEnabled: cacheStats.redisEnabled,
          },
        },
      },
      metrics: {
        ...metrics,
        load: {
          queueLoad: queueStats.pending + queueStats.processing,
          avgResponseTime: Math.round(metrics.globalAverageResponseTime),
        },
      },
    }

    // Calculate overall health
    const cacheUtilization =
      (cacheStats.localCacheSize / cacheStats.maxLocalSize) * 100
    const queueLoad = queueStats.pending + queueStats.processing
    const errorRate = metrics.endpoints.length
      ? metrics.totalErrors / metrics.endpoints.reduce((sum, e) => sum + e.totalRequests, 0)
      : 0

    if (cacheUtilization > 90 || queueLoad > 50 || errorRate > 0.1) {
      response.health.status = 'degraded'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[LoadBalancer Metrics] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
