'use client'

import { useEffect, useState, useCallback } from 'react'

interface LoadBalancerMetrics {
  timestamp: string
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: {
      queue: {
        pending: number
        processing: number
        avgWaitTime: number
      }
      database: {
        poolSize: number
        totalActiveRequests: number
      }
      cache: {
        localCacheSize: number
        maxLocalSize: number
        utilizationPercent: number
      }
    }
  }
}

export function useLoadBalancerMetrics(refreshInterval: number = 5000) {
  const [metrics, setMetrics] = useState<LoadBalancerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/lb/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      const data = await response.json()
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, refreshInterval])

  return { metrics, loading, error, refetch: fetchMetrics }
}

interface CacheStats {
  localCacheSize: number
  maxLocalSize: number
  utilizationPercent: number
  redisEnabled: boolean
  tagCount: number
}

export function useCacheStats(refreshInterval: number = 10000) {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/lb/cache')
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats')
      }
      const data = await response.json()
      setStats(data.cache)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/lb/cache', { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to clear cache')
      }
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchStats])

  const invalidateTag = useCallback(async (tag: string) => {
    try {
      const response = await fetch('/api/lb/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      if (!response.ok) {
        throw new Error('Failed to invalidate cache tag')
      }
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchStats, refreshInterval])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    clearCache,
    invalidateTag,
  }
}

export function useQueueStatus(refreshInterval: number = 3000) {
  const [status, setStatus] = useState<{
    pending: number
    processing: number
    failed: number
    completed: number
    avgWaitTime: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/lb/queue')
      if (!response.ok) {
        throw new Error('Failed to fetch queue status')
      }
      const data = await response.json()
      setStatus(data.queue)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchStatus, refreshInterval])

  return { status, loading, error, refetch: fetchStatus }
}
