'use client'

import React from 'react'
import { useLoadBalancerMetrics, useCacheStats, useQueueStatus } from '@/lib/load-balancer/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LoadBalancerDashboard() {
  const { metrics, loading: metricsLoading } = useLoadBalancerMetrics(5000)
  const { stats: cacheStats, loading: cacheLoading, clearCache, invalidateTag } = useCacheStats()
  const { status: queueStatus, loading: queueLoading } = useQueueStatus()

  if (metricsLoading || cacheLoading || queueLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading load balancer metrics...</p>
      </div>
    )
  }

  const healthColor =
    metrics?.health.status === 'healthy'
      ? 'bg-green-100 text-green-800'
      : metrics?.health.status === 'degraded'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Load Balancer Dashboard</h1>
        <Badge className={healthColor}>
          {metrics?.health.status.toUpperCase() || 'UNKNOWN'}
        </Badge>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold">{queueStatus?.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing</span>
              <span className="font-semibold">{queueStatus?.processing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Wait Time</span>
              <span className="font-semibold">{queueStatus?.avgWaitTime || 0}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Database Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pool Size</span>
              <span className="font-semibold">
                {metrics?.health.checks.database.poolSize || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Requests</span>
              <span className="font-semibold">
                {metrics?.health.checks.database.totalActiveRequests || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-semibold">
                {metrics?.health.checks.cache.localCacheSize || 0}/
                {metrics?.health.checks.cache.maxLocalSize || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilization</span>
              <span className="font-semibold">
                {metrics?.health.checks.cache.utilizationPercent || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{
                  width: `${metrics?.health.checks.cache.utilizationPercent || 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Details */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Completed</span>
              <span className="font-semibold">{queueStatus?.completed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed</span>
              <span className="font-semibold text-red-600">{queueStatus?.failed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending + Processing</span>
              <span className="font-semibold">
                {(queueStatus?.pending || 0) + (queueStatus?.processing || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Redis Enabled: {cacheStats?.redisEnabled ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-muted-foreground">
              Tags Tracked: {cacheStats?.tagCount || 0}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Cache
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Last updated: {metrics?.timestamp}
      </p>
    </div>
  )
}
