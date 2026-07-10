# Filings Application Architecture

## Real-time & Broadcasting Infrastructure

### 1. Broadcast System Overview

**Core Library**: `/lib/realtime/broadcaster.ts`
- Singleton pattern with EventEmitter
- Global event distribution system
- Pattern: `{resource}:{action}` for event naming

**Key Functions**:
- `broadcastUpdate(resource, action, data)` - Broadcasts typed updates
- `broadcast(event, data)` - Generic broadcast

---

## APIs with Broadcasting Implementation

### Orders API
**Location**: `/app/api/orders/route.ts`
- **Import**: `broadcastUpdate`
- **Events**: 
  - `orders:create` - New order created
  - `orders:update` - Order status changed
  - `orders:delete` - Order removed

### Companies API
**Location**: `/app/api/companies/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `companies:create` - New company created
  - `companies:update` - Company data updated
  - `companies:status` - Company status changed

### Documents API
**Location**: `/app/api/documents/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `documents:upload` - Document uploaded
  - `documents:delete` - Document removed
  - `documents:update` - Document metadata updated

### Mail API
**Location**: `/app/api/mail/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `mail:receive` - New mail received
  - `mail:update` - Mail status changed

### Notifications API
**Location**: `/app/api/notifications/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `notifications:create` - New notification
  - `notifications:read` - Notification marked as read
  - `notifications:delete` - Notification deleted

### Addons API
**Location**: `/app/api/addons/route.ts` & `/app/api/addons/purchase/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `addons:purchase` - Addon purchased
  - `addons:assign` - Addon assigned to company

### Passports API
**Location**: `/app/api/passports/route.ts`
- **Import**: `broadcastUpdate`
- **Events**:
  - `passports:upload` - Passport uploaded
  - `passports:link` - Passport linked to order

---

## SSE (Server-Sent Events) Real-time Connection

### SSE Manager
**Location**: `/lib/realtime/sse-manager.ts`
- Connection pooling for SSE clients
- Per-user event broadcasting
- 30-second ping interval for keep-alive
- Automatic client cleanup on disconnect

### SSE API Route
**Location**: `/app/api/realtime/sse/route.ts`
- **Runtime**: `nodejs` (non-edge)
- **Dynamic**: `force-dynamic` (no caching)
- **Events Monitored**: orders, companies, documents, mail, notifications, users, passports, addons, promo-codes
- **Format**: Text/event-stream with SSE protocol

**Connection Flow**:
1. Client connects to `/api/realtime/sse`
2. Server sends initial "connected" event
3. Server streams all resource updates as they occur
4. 30-second pings keep connection alive
5. Auto-cleanup on client disconnect

---

## Server Components & Server-Side Rendering

### Admin Pages with Server-Side Caching
**Location**: `/app/admin/`

1. **Dashboard** (`/app/admin/page.tsx`)
   - Server Component (async)
   - Fetches: Stats, Orders, Companies, Revenues, Charts
   - Caching: Aggregation queries with 60s cache

2. **Orders List** (`/app/admin/orders/page.tsx`)
   - Server Component with Search/Filter
   - Server-side pagination
   - Real-time updates via SSE

3. **Orders Detail** (`/app/admin/orders/[id]/page.tsx`)
   - Server Component (async)
   - Order details with related data
   - Status management with broadcasts

4. **Customers List** (`/app/admin/customers/page.tsx`)
   - Server Component
   - Fetches customer data
   - Linked to orders

5. **Users** (`/app/admin/users/page.tsx`)
   - Server Component
   - User management
   - Broadcast: `users:*` events

6. **Security Dashboard** (`/app/admin/security/page.tsx`)
   - Real-time threat monitoring
   - EventSource integration for live updates

### Client Pages with Real-time Updates
**Location**: `/app/client/`

1. **Dashboard** (`/app/client/dashboard/page.tsx`)
   - Server Component wrapper
   - Real-time company status
   - EventSource listener for updates

2. **Mailroom** (`/app/client/mailroom/page.tsx`)
   - Real-time mail notifications
   - Broadcast listener: `mail:*` events

3. **Documents** (`/app/client/documents/page.tsx`)
   - Document upload status
   - Broadcast listener: `documents:*` events

4. **Company Page** (`/app/client/company/page.tsx`)
   - Company details with real-time sync
   - Milestone tracking

---

## Real-time Event Flow Architecture

\`\`\`
User Action (API Call)
    ↓
API Route Handler (e.g., /api/orders/route.ts)
    ↓
Database Update + broadcastUpdate()
    ↓
Broadcaster EventEmitter
    ↓
SSE Manager (listens via /api/realtime/sse)
    ↓
Connected Clients (via SSE stream)
    ↓
Client-side EventSource listener
    ↓
UI Update (via React state/hooks)
\`\`\`

---

## Broadcast Patterns Used

### Pattern 1: Resource + Action
\`\`\`typescript
// Example: broadcastUpdate('orders', 'create', orderData)
// Event: orders:create
// Listened by: /api/realtime/sse subscribes to orders:*
\`\`\`

### Pattern 2: Wildcard Subscription
\`\`\`typescript
// SSE route subscribes to all events:
broadcaster.subscribe(`${resource}:*`, (eventData) => {
  // Broadcasts to all connected clients
})
\`\`\`

### Pattern 3: User-Scoped Events
\`\`\`typescript
// Some events are user-specific:
// Only broadcast to authenticated user's SSE connections
\`\`\`

---

## Cache Strategy

### Server-side Caching Locations
- `/app/admin/page.tsx` - Dashboard stats (60s)
- `/app/api/lb/cache/route.ts` - Load balancer cache
- `/lib/load-balancer/advanced-cache.ts` - Advanced caching logic

### Cache Invalidation
\`\`\`typescript
// When broadcast occurs:
broadcastUpdate('orders', 'create', data)
// Auto-invalidates cached stats
// Next fetch recalculates
\`\`\`

---

## Key Features

### ✅ Real-time Capabilities
- SSE-based push notifications
- Multi-client broadcasting
- User-scoped event delivery
- Automatic reconnection handling

### ✅ Security
- JWT token verification on all APIs
- Authorization checks before broadcasts
- Security headers on all responses
- Input sanitization middleware

### ✅ Performance
- Connection pooling for SSE
- 30-second keep-alive pings
- Automatic client cleanup
- Memory-efficient event streaming

### ✅ Scalability
- Global broadcaster (single instance)
- Efficient event subscription model
- Load balancer integration
- No external dependencies (in-memory)

---

## Summary Table

| Type | Location | Events | Scope |
|------|----------|--------|-------|
| Orders | `/app/api/orders/route.ts` | create, update, delete | Global |
| Companies | `/app/api/companies/route.ts` | create, update, status | Global |
| Documents | `/app/api/documents/route.ts` | upload, delete, update | Per-user |
| Mail | `/app/api/mail/route.ts` | receive, update | Per-user |
| Notifications | `/app/api/notifications/route.ts` | create, read, delete | Per-user |
| Addons | `/app/api/addons/purchase/route.ts` | purchase, assign | Global |
| Passports | `/app/api/passports/route.ts` | upload, link | Per-user |
| SSE Stream | `/app/api/realtime/sse/route.ts` | All events | Connected clients |

---

## Usage Example

**API Creates Order and Broadcasts**:
\`\`\`typescript
// POST /api/orders
broadcastUpdate('orders', 'create', {
  id: newOrder._id,
  companyName: newOrder.companyName,
  amount: newOrder.amount,
  // ... order data
})
\`\`\`

**Client Listens in Real-time**:
\`\`\`typescript
// /app/admin/orders/page.tsx or /app/client/dashboard/page.tsx
const eventSource = new EventSource('/api/realtime/sse')
eventSource.addEventListener('orders:create', (e) => {
  // Update UI with new order
  const order = JSON.parse(e.data.data)
  // Refresh list or update state
})
\`\`\`

---

## Notes

- All broadcast APIs have `broadcastUpdate` imported but implementation may vary
- SSE route forces dynamic rendering (`force-dynamic`)
- No caching on SSE endpoint to ensure real-time delivery
- Broadcaster is in-memory (works within single server instance)
- For multi-instance deployments, consider Redis pub/sub replacement
