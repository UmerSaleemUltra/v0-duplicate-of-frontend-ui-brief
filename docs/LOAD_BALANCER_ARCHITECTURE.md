# Load Balancer Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUESTS                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   Request Distributor        │
            │  - Load Assessment           │
            │  - Circuit Breaker           │
            │  - Metrics Collection        │
            └────────┬─────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼ (Normal Load)       ▼ (High Load)
    ┌──────────────┐      ┌────────────────────┐
    │ Process Now  │      │  Queue Request     │
    │              │      │  (Upstash Redis)   │
    └──────┬───────┘      └────────┬───────────┘
           │                       │
           │                       │ (Retry logic)
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Advanced Cache       │
           │  - Local (LRU)        │
           │  - Redis (Distributed)│
           │  - Tag Invalidation   │
           └───────────┬───────────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼─────┐     ┌─────▼────┐
         │  CACHE   │     │  MISS    │
         │   HIT    │     │  REQUEST │
         └────┬─────┘     └─────┬────┘
              │                 │
              └────────┬────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Connection Pool             │
        │  - MongoDB Connections (2-5) │
        │  - Health Checks             │
        │  - Load Distribution         │
        └────────────┬─────────────────┘
                     │
                     ▼
              ┌─────────────────┐
              │    MongoDB      │
              │    Database     │
              └─────────────────┘
```

## Request Flow

### 1. High Load Scenario (Request Gets Queued)

```
Request (POST /api/orders)
    ↓
Load Check: 82% (> 80% threshold)
    ↓
Priority Assessment: Priority 3 (Payment)
    ↓
Queue to Redis with ID: "1234567-abc123"
    ↓
Return 202 Accepted + Request ID
    ↓
Client polls status or waits
    ↓
Background: Dequeue and process when capacity available
    ↓
Automatic retry (up to 3 times) if fails
    ↓
Return result to client
```

### 2. Normal Load Scenario (Immediate Processing)

```
Request (GET /api/products)
    ↓
Load Check: 45% (< 80% threshold)
    ↓
Check Circuit Breaker: OK
    ↓
Check Advanced Cache: 
    ├─ Local Cache HIT → Return cached data (1-5ms)
    └─ Cache MISS → Continue to DB
    ↓
Get Connection from Pool:
    ├─ Available connections exist
    └─ Select least busy connection
    ↓
Query MongoDB
    ↓
Cache result with tags + TTL
    ↓
Return result (+ cache headers)
```

## Component Interaction

### Queue Manager ↔ Request Distributor

```
Request Distributor
    │
    └─→ Check current load
        └─→ Get queue stats from Queue Manager
            ├─ Pending requests
            ├─ Processing count
            └─ Average wait time
    │
    └─→ If load > 80%
        └─→ Enqueue via Queue Manager
            ├─ Assign priority
            ├─ Add to Redis
            └─ Track metrics
```

### Connection Pool ↔ Advanced Cache

```
Database Request
    ├─→ Check Advanced Cache
    │   ├─ Check local cache (fast)
    │   └─ Check Redis cache (fallback)
    │
    ├─ Cache HIT: Return data (skip DB)
    │
    └─ Cache MISS:
        └─→ Get connection from pool
            ├─ Least busy selection
            ├─ Track active requests
            └─ Query DB
        │
        └─→ Cache result
            ├─ Local cache
            ├─ Redis cache
            └─ Set expiration + tags
        │
        └─→ Release connection
            └─ Decrement active count
```

## Data Flow Example: User Lookup

```
API Call: GET /api/users/123
    │
    ├─ Step 1: Request Distribution
    │  └─ Load: 40% → Process now (not queued)
    │
    ├─ Step 2: Cache Check
    │  ├─ Local cache: NOT FOUND
    │  └─ Redis cache: NOT FOUND
    │
    ├─ Step 3: Get DB Connection
    │  ├─ Pool has 2 healthy connections
    │  ├─ Connection A: 3 active requests
    │  ├─ Connection B: 1 active request (selected)
    │  └─ B.activeRequests++ (now 2)
    │
    ├─ Step 4: Query Database
    │  ├─ Find user where id=123
    │  └─ Result: { id: 123, name: "John", ... }
    │
    ├─ Step 5: Cache Result
    │  ├─ Local cache: Set "user:123" (expires 1 hour)
    │  ├─ Redis cache: Set "user:123" (synced)
    │  └─ Tags: ["user", "user:123", "user-list"]
    │
    ├─ Step 6: Release Connection
    │  └─ B.activeRequests-- (back to 1)
    │
    └─ Step 7: Return Response
       ├─ Status: 200
       ├─ Headers: Cache-Control: public, max-age=300
       └─ Body: { id: 123, name: "John", ... }

Next request for same user:
    └─ Local cache HIT → Return immediately (< 5ms)
```

## Cache Invalidation Example

```
Update User: PATCH /api/users/123
    ├─ Request processes
    ├─ Database updated
    │
    └─ Invalidate caches by tag
        ├─ "user:123"
        │  └─ Remove from local cache
        │  └─ Remove from Redis
        │
        ├─ "user-list"
        │  └─ Remove from local cache
        │  └─ Remove from Redis
        │
        └─ Tags index updated
           └─ Clean up tag entries

Next request for same user:
    └─ Cache MISS (was invalidated)
    └─ Fresh database query
    └─ New cache entry created
```

## Queue Processing Workflow

```
Request Queued (High Load)
    │
    ├─ Store in Redis: queue:3:request-id-123
    ├─ Increment: stats:queue:pending
    └─ Return: 202 Accepted

Background Worker / Poll
    ├─ Dequeue highest priority
    │  └─ Check queue:3:* (payment priority)
    │     └─ Found: request-id-123
    │
    ├─ Move to processing
    │  ├─ Delete from queue:3:*
    │  ├─ Decrement: stats:queue:pending
    │  └─ Increment: stats:queue:processing
    │
    ├─ Execute request
    │  ├─ Connect to DB via pool
    │  ├─ Cache results
    │  └─ Return response
    │
    ├─ Mark complete
    │  ├─ Decrement: stats:queue:processing
    │  ├─ Increment: stats:queue:completed
    │  └─ Track wait time
    │
    └─ Return: 200 OK + Result

If request fails:
    ├─ Record error
    ├─ Check retry count
    │  ├─ < 3: Re-queue with backoff (2^n seconds)
    │  └─ ≥ 3: Mark as failed, record error
    │
    └─ Increment: stats:queue:failed
```

## Connection Pool Health Management

```
Active Connection
    │
    ├─ Every 10 seconds
    │  └─ Health Check
    │     ├─ Ping database
    │     ├─ Check response
    │     │
    │     ├─ Response OK
    │     │  └─ connection.healthy = true
    │     │
    │     └─ Response FAIL
    │        ├─ connection.healthy = false
    │        ├─ Close connection
    │        └─ Remove from pool
    │
    └─ When pool needs connection
       ├─ Check healthy connections
       ├─ Select least busy
       └─ If none healthy
          └─ Create new connection
             └─ (Up to max pool size)
```

## Circuit Breaker Pattern

```
Endpoint: /api/critical-operation

Healthy State
    ├─ Failures: 0
    └─ Requests processed normally

Error occurs
    ├─ Record error
    ├─ Failures++ (now 1/5)
    └─ Continue serving requests

More errors...
    ├─ Failures: 2/5
    └─ Continue serving

Critical threshold reached
    ├─ Failures: 5/5
    └─ Circuit OPEN
       ├─ New requests return 503 Temporarily Unavailable
       ├─ Last error time recorded
       └─ Wait 1 minute (circuit breaker window)

After 1 minute (reset window)
    ├─ Circuit RESET
    ├─ Failures: 0
    └─ Resume serving requests
```

## System Monitoring

```
Real-time Metrics Collection
    │
    ├─ Per Request
    │  ├─ Start time
    │  ├─ Response time
    │  ├─ Success/failure
    │  └─ Cache hit/miss
    │
    ├─ Per Endpoint
    │  ├─ Total requests
    │  ├─ Active requests
    │  ├─ Average response time
    │  ├─ Error count
    │  └─ Cache hit rate
    │
    ├─ Queue Metrics
    │  ├─ Pending requests
    │  ├─ Processing count
    │  ├─ Failed count
    │  ├─ Completed count
    │  └─ Average wait time
    │
    ├─ Database Metrics
    │  ├─ Pool size
    │  ├─ Active requests per connection
    │  ├─ Connection health
    │  └─ Latency per connection
    │
    └─ Cache Metrics
       ├─ Local cache size
       ├─ Utilization %
       ├─ Redis status
       └─ Tag count

Available via:
    ├─ /api/lb/metrics (REST)
    ├─ /api/lb/queue (REST)
    ├─ /api/lb/cache (REST)
    └─ Dashboard component
```

## Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────┐
│        Vercel Edge Network              │
│  ┌───────────────────────────────────┐  │
│  │  Serverless Function Instance 1   │  │
│  │  ├─ Load Balancer                 │  │
│  │  ├─ Connection Pool (1-5 conns)   │  │
│  │  ├─ Advanced Cache (Local)        │  │
│  │  └─ Request Queue                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Serverless Function Instance 2   │  │
│  │  ├─ Load Balancer                 │  │
│  │  ├─ Connection Pool (1-5 conns)   │  │
│  │  ├─ Advanced Cache (Local)        │  │
│  │  └─ Request Queue                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  ... (auto-scaling)               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────┬─────────────────┘
                          │
              ┌───────────┴──────────┐
              │                      │
              ▼                      ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Upstash Redis    │  │ MongoDB (Atlas)  │
    │ (Distributed)    │  │ (Primary DB)     │
    │ ├─ Queues        │  │ ├─ Companies     │
    │ ├─ Cache         │  │ ├─ Users         │
    │ └─ Metrics       │  │ ├─ Orders        │
    └──────────────────┘  │ └─ ...           │
                          └──────────────────┘
```

This architecture ensures:
- ✅ Automatic scaling via Vercel
- ✅ Distributed queue via Upstash Redis
- ✅ Local caching per instance
- ✅ Consistent database access
- ✅ Resilience via circuit breakers
- ✅ Monitoring via metrics endpoints
