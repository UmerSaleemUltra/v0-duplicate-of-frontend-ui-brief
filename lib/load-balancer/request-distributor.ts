/**
 * Request Distributor Middleware
 * Balances load across available resources and monitors health
 */

import { NextRequest, NextResponse } from 'next/server'
import { queueManager } from './queue-manager'
import { advancedCache } from './advanced-cache'

interface RequestMetrics {
  totalRequests: number
  activeRequests: number
  averageResponseTime: number
  errorCount: number
  cacheHitRate: number
  lastUpdated: number
}

class RequestDistributor {
  private metrics: Map<string, RequestMetrics> = new Map()
  private circuitBreakers: Map<string, { failures: number; lastFailure: number }> = new Map()
  private readonly failureThreshold = 5
  private readonly circuitBreakerWindow = 60000 // 1 minute

  async distributeRequest(req: NextRequest): Promise<{ shouldQueue: boolean; priority: number }> {
    const endpoint = new URL(req.url).pathname
    const currentLoad = await this.getCurrentLoad()

    // If load is high, queue request
    if (currentLoad > 0.8) {
      return {
        shouldQueue: true,
        priority: this.calculatePriority(req),
      }
    }

    return {
      shouldQueue: false,
      priority: 0,
    }
  }

  private calculatePriority(req: NextRequest): number {
    const url = new URL(req.url)
    const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(req.method)
    const isAuthRequest = url.pathname.includes('/auth/')
    const isPaymentRequest = url.pathname.includes('/payment') || url.pathname.includes('/checkout')

    // Prioritize: payment > auth > other writes > reads
    if (isPaymentRequest) return 3
    if (isAuthRequest) return 2
    if (isWriteOperation) return 1
    return 0
  }

  private async getCurrentLoad(): Promise<number> {
    const stats = await queueManager.getStats()
    const totalRequests = stats.pending + stats.processing
    const maxConcurrent = 100 // Vercel limit

    return Math.min(totalRequests / maxConcurrent, 1)
  }

  recordMetric(endpoint: string, responseTime: number, success: boolean) {
    const metrics = this.metrics.get(endpoint) || {
      totalRequests: 0,
      activeRequests: 0,
      averageResponseTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
      lastUpdated: Date.now(),
    }

    metrics.totalRequests++
    if (!success) {
      metrics.errorCount++
      this.updateCircuitBreaker(endpoint)
    }

    // Update average response time
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) /
      metrics.totalRequests
    metrics.lastUpdated = Date.now()

    this.metrics.set(endpoint, metrics)
  }

  private updateCircuitBreaker(endpoint: string) {
    const breaker = this.circuitBreakers.get(endpoint) || { failures: 0, lastFailure: Date.now() }

    breaker.failures++
    breaker.lastFailure = Date.now()

    if (breaker.failures >= this.failureThreshold) {
      // Circuit is open
      this.circuitBreakers.set(endpoint, breaker)
    }
  }

  isCircuitBreakerOpen(endpoint: string): boolean {
    const breaker = this.circuitBreakers.get(endpoint)

    if (!breaker) return false

    // Check if circuit should reset
    if (Date.now() - breaker.lastFailure > this.circuitBreakerWindow) {
      this.circuitBreakers.delete(endpoint)
      return false
    }

    return breaker.failures >= this.failureThreshold
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      return this.metrics.get(endpoint) || null
    }

    const allMetrics = Array.from(this.metrics.entries()).map(([ep, metrics]) => ({
      endpoint: ep,
      ...metrics,
    }))

    return {
      endpoints: allMetrics,
      globalAverageResponseTime:
        allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length || 0,
      totalErrors: allMetrics.reduce((sum, m) => sum + m.errorCount, 0),
    }
  }

  resetMetrics() {
    this.metrics.clear()
    this.circuitBreakers.clear()
  }
}

export const requestDistributor = new RequestDistributor()

export async function withLoadBalancing(handler: Function) {
  return async function (req: NextRequest) {
    const startTime = Date.now()
    const endpoint = new URL(req.url).pathname

    // Check circuit breaker
    if (requestDistributor.isCircuitBreakerOpen(endpoint)) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    try {
      // Check if should queue
      const { shouldQueue, priority } = await requestDistributor.distributeRequest(req)

      if (shouldQueue) {
        const requestId = await queueManager.enqueue({
          endpoint,
          method: req.method,
          priority,
          maxRetries: 3,
          data: await req.json().catch(() => ({})),
        })

        return NextResponse.json(
          {
            queued: true,
            requestId,
            message: 'Your request has been queued. Check back soon.',
          },
          { status: 202 } // Accepted
        )
      }

      // Execute handler
      const response = await handler(req)
      const responseTime = Date.now() - startTime

      requestDistributor.recordMetric(endpoint, responseTime, response.status < 400)

      // Add cache headers
      if (response.status === 200) {
        const headers = new Headers(response.headers)
        headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600')
        headers.set('X-Response-Time', `${responseTime}ms`)

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      requestDistributor.recordMetric(endpoint, responseTime, false)

      console.error('[LoadBalancer] Error:', error)

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
