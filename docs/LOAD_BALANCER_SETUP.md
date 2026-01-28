# Load Balancer Setup Guide

## Quick Start

### Step 1: Set Up Upstash Redis (Vercel)

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy the REST URL and Token
4. In Vercel dashboard, go to Settings → Environment Variables
5. Add these variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 2: Initialize Load Balancer

The load balancer auto-initializes on app startup. It's triggered when `/lib/load-balancer` is imported.

Add to your main layout or app initialization:

\`\`\`typescript
// app/layout.tsx
import { initializeLoadBalancer } from '@/lib/load-balancer'

export default async function RootLayout() {
  // Initialize on app start
  await initializeLoadBalancer()

  return (
    <html>
      {/* ... */}
    </html>
  )
}
\`\`\`

### Step 3: Use in Your API Routes

Replace your existing database calls:

\`\`\`typescript
// Before
import { getDatabase } from '@/lib/db'
const db = await getDatabase()
const user = await db.collection('users').findOne({ id: userId })

// After
import { enhancedDb } from '@/lib/load-balancer'
const user = await enhancedDb.findOne('users', { id: userId }, {
  cache: true,
  ttl: 3600000,
  tags: ['user', `user:${userId}`]
})
\`\`\`

## Migration Guide

### Converting Existing Routes

**Old Pattern:**
\`\`\`typescript
import { connectDB } from '@/config/database'

export async function GET(req: NextRequest) {
  const { db } = await connectDB()
  const data = await db.collection('products').find({}).toArray()
  return NextResponse.json(data)
}
\`\`\`

**New Pattern:**
\`\`\`typescript
import { enhancedDb, withLoadBalancing } from '@/lib/load-balancer'

const handler = async (req: NextRequest) => {
  const data = await enhancedDb.find('products', {}, {
    cache: true,
    ttl: 3600000,
    tags: ['products']
  })
  return NextResponse.json(data)
}

export const GET = withLoadBalancing(handler)
\`\`\`

## Configuration

### Customize Load Balancer Settings

Create a configuration file:

\`\`\`typescript
// lib/load-balancer/config.ts
export const LB_CONFIG = {
  // Queue settings
  queueMaxRetries: 3,
  retryBackoffMs: 1000,
  
  // Database pool settings
  maxPoolSize: 5,
  connectionTimeout: 30000,
  healthCheckInterval: 10000,
  
  // Cache settings
  defaultTTL: 3600000, // 1 hour
  maxLocalCacheSize: 1000,
  
  // Load distribution
  loadThreshold: 0.8, // Queue at 80% load
  circuitBreakerFailureThreshold: 5,
  circuitBreakerWindow: 60000, // 1 minute
}
\`\`\`

### Advanced Cache Configuration

\`\`\`typescript
import { AdvancedCache } from '@/lib/load-balancer/advanced-cache'

const cache = new AdvancedCache({
  defaultTTL: 7200000, // 2 hours
  maxLocalSize: 2000,
  useRedis: true
})
\`\`\`

## Monitoring

### Access Dashboard

1. Create an admin route:

\`\`\`typescript
// app/admin/load-balancer/page.tsx
import LoadBalancerDashboard from '@/components/load-balancer-dashboard'

export default function AdminPage() {
  return <LoadBalancerDashboard />
}
\`\`\`

2. Add authentication (e.g., with middleware):

\`\`\`typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add auth check here
  }
}
\`\`\`

### API Metrics Endpoints

All metrics are available via REST API:

\`\`\`bash
# Get all metrics
curl https://your-app.vercel.app/api/lb/metrics

# Get queue status
curl https://your-app.vercel.app/api/lb/queue

# Get cache stats
curl https://your-app.vercel.app/api/lb/cache
\`\`\`

### Client-Side Monitoring

Use hooks in your components:

\`\`\`typescript
'use client'

import { useLoadBalancerMetrics } from '@/lib/load-balancer/hooks'

export function StatusBar() {
  const { metrics, loading } = useLoadBalancerMetrics(5000)

  if (loading) return <div>Loading...</div>

  return (
    <div>
      Status: {metrics?.health.status}
      Queue: {metrics?.health.checks.queue.pending} pending
      Cache: {metrics?.health.checks.cache.utilizationPercent}% used
    </div>
  )
}
\`\`\`

## Cache Strategies

### Strategy 1: User-Specific Data

\`\`\`typescript
const user = await enhancedDb.findOne('users', { id: userId }, {
  cache: true,
  ttl: 3600000, // 1 hour
  tags: ['user', `user:${userId}`]
})

// Invalidate when user updates
await advancedCache.invalidateByTag(`user:${userId}`)
\`\`\`

### Strategy 2: Public Data

\`\`\`typescript
const products = await enhancedDb.find('products', {}, {
  cache: true,
  ttl: 86400000, // 24 hours
  tags: ['products', 'public']
})

// Invalidate entire catalog on product change
await advancedCache.invalidateByTag('products')
\`\`\`

### Strategy 3: Time-Critical Data

\`\`\`typescript
const stats = await enhancedDb.findOne('stats', { metric: 'sales' }, {
  cache: true,
  ttl: 60000, // 1 minute - refresh frequently
  tags: ['stats', 'sales']
})
\`\`\`

## Performance Tuning

### Monitor Performance

1. Check dashboard regularly
2. Review metrics endpoint
3. Look for patterns:
   - High cache utilization → increase maxLocalCacheSize
   - High queue depth → increase maxPoolSize
   - High error rate → check circuit breaker stats

### Optimization Tips

1. **Batch Operations**
\`\`\`typescript
// Bad: N+1 queries
for (const id of userIds) {
  const user = await enhancedDb.findOne('users', { id })
}

// Good: Single batched query
const users = await enhancedDb.find('users', { id: { $in: userIds } })
\`\`\`

2. **Smart Caching**
\`\`\`typescript
// Cache lists with lower TTL
const list = await enhancedDb.find('products', {}, {
  cache: true,
  ttl: 300000 // 5 minutes
})

// Cache details with higher TTL
const detail = await enhancedDb.findOne('products', { id }, {
  cache: true,
  ttl: 3600000 // 1 hour
})
\`\`\`

3. **Tag Organization**
\`\`\`typescript
// Use consistent tag patterns
tags: [
  'products',           // For product list cache
  'product-list',       // For paginated lists
  `product:${id}`,      // For specific product
  'products:featured',  // For featured products
  'public'              // For public caches
]
\`\`\`

## Troubleshooting

### Queue Not Working

**Issue:** Requests not being queued

**Solution:**
1. Check Upstash Redis connection
2. Verify environment variables are set
3. Check `/api/lb/metrics` for queue status

\`\`\`bash
# Verify connection
curl https://your-app.vercel.app/api/lb/queue
\`\`\`

### High Memory Usage

**Issue:** Cache taking too much memory

**Solution:**
1. Reduce `maxLocalCacheSize` in config
2. Lower TTL values
3. Check for unused cache tags

\`\`\`bash
# Clear cache immediately
curl -X DELETE https://your-app.vercel.app/api/lb/cache
\`\`\`

### Database Connection Errors

**Issue:** Can't connect to MongoDB

**Solution:**
1. Verify MONGODB_URI in environment
2. Check connection pooling stats
3. Review connection limits

\`\`\`bash
# Check pool stats
curl https://your-app.vercel.app/api/lb/metrics | jq '.health.checks.database'
\`\`\`

### Circuit Breaker Tripping

**Issue:** Endpoints returning 503

**Solution:**
1. Check error rate for endpoint
2. Investigate underlying cause
3. Wait for circuit breaker to reset (1 minute default)

## Best Practices

1. ✅ Always use tags for cache invalidation
2. ✅ Set appropriate TTLs (balance freshness vs performance)
3. ✅ Monitor metrics regularly
4. ✅ Use enhancedDb wrapper for all database access
5. ✅ Wrap critical routes with `withLoadBalancing`
6. ✅ Test cache invalidation in staging first
7. ✅ Keep Upstash Redis plan suitable for your traffic
8. ✅ Alert on high cache utilization or queue depth

## Common Patterns

### Product Catalog

\`\`\`typescript
// Fetch with caching
const products = await enhancedDb.find('products', { active: true }, {
  cache: true,
  ttl: 3600000,
  tags: ['products', 'product-list']
})

// Update product
await enhancedDb.updateOne('products', { id }, updates, [
  'products',
  `product:${id}`,
  'product-list' // Invalidate list too
])
\`\`\`

### User Profiles

\`\`\`typescript
// Get user profile
const user = await enhancedDb.findOne('users', { id: userId }, {
  cache: true,
  ttl: 1800000, // 30 minutes
  tags: ['user', `user:${userId}`, 'user-list']
})

// Update profile
await enhancedDb.updateOne('users', { id: userId }, updates, [
  `user:${userId}` // Invalidate just this user
])
\`\`\`

### Frequently Changing Data

\`\`\`typescript
// Real-time stats
const stats = await enhancedDb.findOne('stats', { id: 'daily' }, {
  cache: true,
  ttl: 60000, // 1 minute only
  tags: ['stats', 'dashboard']
})
\`\`\`

## Next Steps

1. Set up Upstash Redis
2. Add environment variables to Vercel
3. Import load balancer in your app
4. Convert one API route as test
5. Monitor dashboard
6. Gradually convert remaining routes
7. Set up alerts for queue/cache metrics
