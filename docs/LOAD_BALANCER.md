# Load Balancer Implementation Guide

## Overview

This comprehensive load balancing suite optimizes your Vercel-deployed Next.js app across four key areas:

### 1. **Request Queue System** (`queue-manager.ts`)
- Handles burst traffic by queuing requests when the system is under heavy load
- Uses Upstash Redis for distributed queue management
- Implements priority-based request handling
- Automatic retry with exponential backoff for failed requests
- Tracks queue metrics (pending, processing, failed, completed)

**Key Features:**
- Priority levels: Payment (3) > Auth (2) > Writes (1) > Reads (0)
- Automatic retry with exponential backoff
- Redis-backed for persistence across instances
- Graceful fallback to in-memory processing if Redis unavailable

### 2. **Database Connection Pooling** (`db-connection-pool.ts`)
- Maintains a pool of MongoDB connections (max 5)
- Implements load distribution across connections
- Automatic health checks every 10 seconds
- Removes unhealthy connections and replaces them
- Tracks active requests per connection

**Key Features:**
- Intelligent connection selection (least busy)
- Automatic pool expansion up to max size
- Health monitoring with auto-recovery
- Connection metadata tracking

### 3. **Advanced Caching Layer** (`advanced-cache.ts`)
- Two-tier cache: Local (fast) + Redis (distributed)
- Smart tag-based invalidation
- LRU eviction for local cache (max 1000 entries by default)
- Configurable TTL per cache entry
- Automatic sync between local and Redis

**Key Features:**
- Tag-based cache invalidation for related data
- Exponential TTL configuration
- Local cache with LRU eviction
- Redis fallback for distributed caching

### 4. **Request Distribution** (`request-distributor.ts`)
- Monitors system load and queues requests accordingly
- Implements circuit breaker pattern for failing endpoints
- Tracks per-endpoint metrics (response time, errors)
- Automatic cache headers for optimized responses
- Prevents cascading failures

**Key Features:**
- Circuit breaker pattern for resilience
- Per-endpoint metrics tracking
- Automatic response time monitoring
- System load assessment

## Installation

### Prerequisites

Ensure you have Upstash Redis set up in your Vercel project:

\`\`\`bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
\`\`\`

### Usage

#### 1. Use Enhanced Database Wrapper

Instead of direct MongoDB access, use the enhanced wrapper:

\`\`\`typescript
import { enhancedDb } from '@/lib/load-balancer/enhanced-db'

// Find one with cache
const user = await enhancedDb.findOne('users', { email }, {
  cache: true,
  ttl: 3600000, // 1 hour
  tags: ['user', `user:${email}`]
})

// Insert with cache invalidation
const id = await enhancedDb.insertOne('users', userData, ['users', 'user-list'])

// Update with cache invalidation
await enhancedDb.updateOne('users', { id }, updates, ['users', `user:${id}`])
\`\`\`

#### 2. Use Caching in API Routes

\`\`\`typescript
import { advancedCache } from '@/lib/load-balancer'

export async function GET(req: NextRequest) {
  const cacheKey = 'products:all'
  
  // Try cache first
  let products = await advancedCache.get(cacheKey)
  
  if (!products) {
    // Fetch from database
    products = await db.collection('products').find({}).toArray()
    
    // Cache with tags for smart invalidation
    await advancedCache.set(cacheKey, products, {
      ttl: 3600000,
      tags: ['products', 'public']
    })
  }
  
  return NextResponse.json(products)
}
\`\`\`

#### 3. Monitor Load Balancer

Access the dashboard or metrics endpoints:

\`\`\`bash
# Get all metrics
curl https://your-app.vercel.app/api/lb/metrics

# Get queue status
curl https://your-app.vercel.app/api/lb/queue

# Get cache stats
curl https://your-app.vercel.app/api/lb/cache

# Clear cache
curl -X DELETE https://your-app.vercel.app/api/lb/cache

# Invalidate cache tag
curl -X POST https://your-app.vercel.app/api/lb/cache \
  -H "Content-Type: application/json" \
  -d '{"tag": "products"}'
\`\`\`

#### 4. Use Dashboard Component

Add to an admin page:

\`\`\`typescript
import LoadBalancerDashboard from '@/components/load-balancer-dashboard'

export default function AdminPage() {
  return <LoadBalancerDashboard />
}
\`\`\`

#### 5. Use Client Hooks

Monitor metrics in your components:

\`\`\`typescript
'use client'

import { useLoadBalancerMetrics, useCacheStats, useQueueStatus } from '@/lib/load-balancer/hooks'

export function MyComponent() {
  const { metrics } = useLoadBalancerMetrics(5000)
  const { stats: cacheStats } = useCacheStats()
  const { status: queueStatus } = useQueueStatus()

  return (
    <div>
      <p>Queue pending: {queueStatus?.pending}</p>
      <p>Cache utilization: {cacheStats?.utilizationPercent}%</p>
      <p>Health: {metrics?.health.status}</p>
    </div>
  )
}
\`\`\`

## API Endpoints

### `GET /api/lb/metrics`
Returns comprehensive system metrics including queue, database, and cache stats.

### `GET /api/lb/queue` | `POST /api/lb/queue`
Get queue status or process next queued request.

### `GET /api/lb/cache` | `DELETE /api/lb/cache` | `POST /api/lb/cache`
Get cache stats, clear all cache, or invalidate by tag.

## Performance Tips

1. **Use cache tags** - Organize related data with tags for efficient invalidation
2. **Set appropriate TTLs** - Balance freshness with performance
3. **Monitor metrics** - Regular check of dashboard to identify bottlenecks
4. **Batch operations** - Reduce database queries by fetching related data together
5. **Invalidate smartly** - Use tag-based invalidation instead of clearing entire cache

## Environment Variables

\`\`\`bash
# Required for distributed queue and caching
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=your_database
\`\`\`

## Troubleshooting

### Queue not processing
- Check Upstash Redis connection
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check `/api/lb/queue` endpoint

### High cache memory usage
- Check utilization percentage in dashboard
- Clear cache if > 90%
- Reduce TTL values if appropriate
- Monitor tag count for unused tags

### Database connection errors
- Check MongoDB connection string
- Verify network access rules
- Monitor connection pool health
- Check active request count

## Architecture Diagram

\`\`\`
Request → Load Balancer → Distribute → Queue (if busy)
           ↓
      Monitor Load → Decision
      ↓
      Process Request
      ↓
      Cache Layer (Local + Redis)
      ↓
      Connection Pool
      ↓
      MongoDB
\`\`\`
