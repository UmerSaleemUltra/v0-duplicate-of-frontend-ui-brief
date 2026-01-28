# Load Balancer Quick Reference

## 📋 File Structure

\`\`\`
/lib/load-balancer/
├── index.ts                 # Main exports
├── queue-manager.ts         # Request queueing (Upstash Redis)
├── db-connection-pool.ts    # MongoDB pooling
├── advanced-cache.ts        # Two-tier caching
├── request-distributor.ts   # Load distribution
├── enhanced-db.ts           # DB wrapper
├── hooks.ts                 # React hooks
└── examples.ts              # Code examples

/app/api/lb/
├── metrics/route.ts         # GET /api/lb/metrics
├── queue/route.ts           # GET/POST /api/lb/queue
└── cache/route.ts           # GET/DELETE/POST /api/lb/cache

/docs/
├── LOAD_BALANCER.md              # Feature guide
├── LOAD_BALANCER_SETUP.md        # Setup guide
└── LOAD_BALANCER_ARCHITECTURE.md # Architecture
\`\`\`

## 🚀 Quick Start (60 seconds)

\`\`\`bash
# 1. Set environment variables in Vercel
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# 2. Initialize in your app (app/layout.tsx)
import { initializeLoadBalancer } from '@/lib/load-balancer'
await initializeLoadBalancer()

# 3. Use in API routes
import { enhancedDb, withLoadBalancing } from '@/lib/load-balancer'

const handler = async (req) => {
  const data = await enhancedDb.find('collection', query, {
    cache: true,
    tags: ['collection']
  })
  return NextResponse.json(data)
}

export const GET = withLoadBalancing(handler)
\`\`\`

## 💾 Database Access

### Old Way (Don't use)
\`\`\`typescript
import { connectDB } from '@/config/database'
const { db } = await connectDB()
const user = await db.collection('users').findOne({ id })
\`\`\`

### New Way (Use this)
\`\`\`typescript
import { enhancedDb } from '@/lib/load-balancer'

const user = await enhancedDb.findOne('users', { id }, {
  cache: true,
  ttl: 3600000,
  tags: ['user', `user:${id}`]
})
\`\`\`

## 📊 Available Methods

### enhancedDb Methods
\`\`\`typescript
// Read operations (with optional caching)
await enhancedDb.findOne(collection, query, options)
await enhancedDb.find(collection, query, options)

// Write operations (with cache invalidation)
await enhancedDb.insertOne(collection, doc, invalidateTags)
await enhancedDb.updateOne(collection, query, update, invalidateTags)
await enhancedDb.deleteOne(collection, query, invalidateTags)

// Options
{
  cache: boolean,           // Enable caching
  ttl: number,              // TTL in ms (default 1 hour)
  tags: string[],           // Cache tags
  limit?: number,           // For find()
  skip?: number             // For find()
}
\`\`\`

### Queue Manager
\`\`\`typescript
import { queueManager } from '@/lib/load-balancer'

// Enqueue request
const id = await queueManager.enqueue({
  endpoint: '/api/orders',
  method: 'POST',
  priority: 3,        // 0-3, higher = more important
  maxRetries: 3,
  data: {...}
})

// Get queue stats
const stats = await queueManager.getStats()
// {
//   pending: 5,
//   processing: 2,
//   failed: 0,
//   completed: 100,
//   avgWaitTime: 250
// }

// Dequeue
const request = await queueManager.dequeue(priority)

// Mark request complete
await queueManager.markComplete(requestId, waitTimeMs)
\`\`\`

### Advanced Cache
\`\`\`typescript
import { advancedCache } from '@/lib/load-balancer'

// Get
const value = await advancedCache.get('key')

// Set
await advancedCache.set('key', value, {
  ttl: 3600000,
  tags: ['tag1', 'tag2']
})

// Delete
await advancedCache.delete('key')

// Invalidate by tag
await advancedCache.invalidateByTag('tag1')

// Clear all
await advancedCache.clear()

// Stats
advancedCache.getStats()
// {
//   localCacheSize: 45,
//   maxLocalSize: 1000,
//   redisEnabled: true,
//   tagCount: 12
// }
\`\`\`

## 🔌 API Endpoints

### Metrics
\`\`\`bash
# Get all metrics
curl https://your-app.vercel.app/api/lb/metrics

# Response
{
  "timestamp": "2024-01-29T...",
  "health": {
    "status": "healthy",
    "checks": {
      "queue": {...},
      "database": {...},
      "cache": {...}
    }
  },
  "metrics": {...}
}
\`\`\`

### Queue
\`\`\`bash
# Get queue status
curl https://your-app.vercel.app/api/lb/queue

# Process next request
curl -X POST https://your-app.vercel.app/api/lb/queue
\`\`\`

### Cache
\`\`\`bash
# Get cache stats
curl https://your-app.vercel.app/api/lb/cache

# Clear all cache
curl -X DELETE https://your-app.vercel.app/api/lb/cache

# Invalidate tag
curl -X POST https://your-app.vercel.app/api/lb/cache \
  -H "Content-Type: application/json" \
  -d '{"tag": "products"}'
\`\`\`

## 🪝 React Hooks

\`\`\`typescript
'use client'
import {
  useLoadBalancerMetrics,
  useCacheStats,
  useQueueStatus
} from '@/lib/load-balancer/hooks'

// Usage
function MyComponent() {
  const { metrics, loading, error, refetch } = useLoadBalancerMetrics(5000)
  const { stats, clearCache, invalidateTag } = useCacheStats()
  const { status, refetch: refetchQueue } = useQueueStatus(3000)

  return (
    <div>
      <p>Queue: {status?.pending} pending</p>
      <p>Cache: {stats?.utilizationPercent}%</p>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  )
}
\`\`\`

## ⚙️ Configuration

### Default Values
\`\`\`typescript
// Queue
maxRetries: 3
retryBackoffMs: exponential (2^n)

// Database Pool
maxPoolSize: 5
connectionTimeout: 30000 ms
healthCheckInterval: 10000 ms

// Cache
defaultTTL: 3600000 ms (1 hour)
maxLocalCacheSize: 1000 entries

// Request Distribution
loadThreshold: 0.8 (80%)
circuitBreakerFailureThreshold: 5
circuitBreakerWindow: 60000 ms (1 minute)
\`\`\`

### Customize
\`\`\`typescript
// Create custom cache instance
import { AdvancedCache } from '@/lib/load-balancer/advanced-cache'

const customCache = new AdvancedCache({
  defaultTTL: 7200000,    // 2 hours
  maxLocalSize: 2000,     // Bigger cache
  useRedis: true
})
\`\`\`

## 🎯 Common Patterns

### Product Listing
\`\`\`typescript
const products = await enhancedDb.find('products', {}, {
  cache: true,
  ttl: 3600000,
  tags: ['products', 'product-list']
})
\`\`\`

### User Profile
\`\`\`typescript
const user = await enhancedDb.findOne('users', { id: userId }, {
  cache: true,
  ttl: 1800000,  // 30 min
  tags: ['user', `user:${userId}`]
})
\`\`\`

### High-Priority Operation (Payment)
\`\`\`typescript
const id = await queueManager.enqueue({
  endpoint: '/api/orders',
  method: 'POST',
  priority: 3,  // Highest priority
  maxRetries: 5,
  data: orderData
})
\`\`\`

### Cache Invalidation on Update
\`\`\`typescript
await enhancedDb.updateOne(
  'products',
  { id: productId },
  { price: newPrice },
  ['products', `product:${productId}`, 'product-list']
)
// All related caches automatically invalidated
\`\`\`

## 📈 Monitoring

### Check Health
\`\`\`typescript
// Get metrics programmatically
const response = await fetch('/api/lb/metrics')
const data = await response.json()
console.log(data.health.status) // 'healthy', 'degraded', or 'unhealthy'
\`\`\`

### Alerts (Recommended)
\`\`\`typescript
// High cache usage
if (cacheStats.utilizationPercent > 90) {
  // Alert
}

// Queue building up
if (queueStats.pending > 20) {
  // Alert
}

// Service degraded
if (metrics.health.status !== 'healthy') {
  // Alert
}
\`\`\`

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Queue not working | Check UPSTASH_REDIS_* env vars |
| High memory | Clear cache, reduce TTL |
| DB connection errors | Verify MONGODB_URI, check pool |
| Circuit breaker open | Wait 1 min or fix underlying issue |
| Cache not invalidating | Check tag names match |

## 📚 Documentation

- **Full Feature Guide** → `/docs/LOAD_BALANCER.md`
- **Setup & Migration** → `/docs/LOAD_BALANCER_SETUP.md`
- **Architecture** → `/docs/LOAD_BALANCER_ARCHITECTURE.md`
- **Code Examples** → `/lib/load-balancer/examples.ts`

## 💡 Best Practices

✅ Always use tags for cache invalidation
✅ Set appropriate TTLs (balance freshness vs performance)
✅ Monitor dashboard regularly
✅ Use `enhancedDb` for all DB access
✅ Wrap critical routes with `withLoadBalancing`
✅ Test cache invalidation in staging first
✅ Alert on high queue depth or cache usage
✅ Review metrics periodically

## 🔑 Key Concepts

| Concept | Description |
|---------|-------------|
| **Queue** | Stores requests during high load, processes when capacity available |
| **Priority** | 3=Payment, 2=Auth, 1=Writes, 0=Reads |
| **Connection Pool** | 2-5 MongoDB connections, auto-selects least busy |
| **Cache Layer** | Local (fast) + Redis (distributed) |
| **Tags** | Labels for cache entries, enables smart invalidation |
| **TTL** | Time-to-live, when cache expires |
| **Circuit Breaker** | Prevents cascading failures, auto-recovery |
| **Metrics** | Real-time system health and performance data |

---

**Version:** 1.0 | **Last Updated:** 2024-01-29 | **Status:** Production Ready ✅
