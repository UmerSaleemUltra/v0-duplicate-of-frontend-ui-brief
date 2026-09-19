/**
 * Load Balancer Export Hub
 * Centralizes all load balancing functionality
 */

// Queue Manager
export { queueManager } from './queue-manager'
export type { QueuedRequest } from './queue-manager'

// Database Connection Pool
export { connectionPool, getPooledDatabase, releaseDatabase } from './db-connection-pool'

// Advanced Caching
export { advancedCache } from './advanced-cache'

// Request Distribution
export { requestDistributor, withLoadBalancing } from './request-distributor'

// Enhanced Database Wrapper
export { enhancedDb } from './enhanced-db'

// Hooks for client-side monitoring
export { useLoadBalancerMetrics, useCacheStats, useQueueStatus } from './hooks'

// Initialize load balancer on import
import { queueManager } from './queue-manager'
import { connectionPool } from './db-connection-pool'
import { advancedCache } from './advanced-cache'

export const initializeLoadBalancer = async () => {
  console.log('[LoadBalancer] Initializing load balancing suite...')

  try {
    // Initialize queue manager
    await queueManager.getStats()
    console.log('[LoadBalancer] Queue manager initialized')

    // Initialize connection pool
    const poolStats = connectionPool.getStats()
    console.log('[LoadBalancer] Connection pool initialized with size:', poolStats.poolSize)

    // Initialize advanced cache
    const cacheStats = advancedCache.getStats()
    console.log('[LoadBalancer] Advanced cache initialized:', cacheStats)

    console.log('[LoadBalancer] Load balancing suite ready!')
  } catch (error) {
    console.error('[LoadBalancer] Failed to initialize:', error)
  }
}

// Auto-initialize on import
if (typeof window === 'undefined') {
  initializeLoadBalancer().catch(console.error)
}
