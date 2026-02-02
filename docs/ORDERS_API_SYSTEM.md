# Orders & Companies API - Clean System Documentation

## Overview

This document describes the clean, production-ready system for managing orders and companies data through APIs. The system is designed to work seamlessly whether you have real order records or need to display company data as orders.

## Architecture

### Core Principle
- **Single Source of Truth**: The API (`/app/api/orders/route.ts`) handles all logic
- **UI follows API**: Frontend pages use the same data structure from the API
- **No Duplicate Logic**: Centralized service (`/lib/api/order-service.ts`) handles all transformations

### Data Flow

```
Database (Orders Collection)
    ↓
    └─→ API (/api/orders) → Service (order-service.ts) 
                                ├─→ Real Orders Found? → Return Orders
                                └─→ No Orders? → Fallback to Companies → Convert & Return
    ↓
Frontend (Admin Page)
    └─→ Uses API Response Directly
```

## API Endpoints

### GET /api/orders
**Purpose**: Fetch all orders with automatic fallback to company data

**Request**:
```bash
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/orders
```

**Response** (Success):
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "companyId": "507f1f77bcf86cd799439013",
      "companyName": "Tech Startup LLC",
      "type": "Formation",
      "status": "active",
      "amount": 500,
      "total": 500,
      "packagePrice": 299,
      "stateFilingFee": 125,
      "addonsTotal": 76,
      "paymentStatus": "completed",
      "paymentMethod": "card",
      "items": [],
      "purchasedAddons": [],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Behavior**:
- **Admin Users** (role === "admin"): See all orders (no userId filter)
- **Regular Users**: See only their own orders (filtered by userId)
- **No Real Orders?** → Automatically uses companies as display orders

**Response** (No Orders or Companies):
```json
{
  "success": true,
  "data": []
}
```

**Response** (Error):
```json
{
  "error": "Failed to fetch orders",
  "status": 500
}
```

## Service Layer (`/lib/api/order-service.ts`)

### Key Functions

#### `processOrders(db, options)`
**Main function** - Orchestrates the entire order fetching and transformation logic

```typescript
const orderData = await processOrders(db, {
  userId: isAdmin ? undefined : decoded.userId,  // undefined for admins to see all
  isAdmin: true,
  limit: 100
})
```

**Returns**: Array of transformed orders ready for API response

#### `getOrdersFromDatabase(db, options)`
Fetches real orders from the database

```typescript
const orders = await getOrdersFromDatabase(db, {
  userId: "user123",
  isAdmin: false,
  limit: 50
})
```

#### `companyToOrder(company, userId?)`
Converts a company record to an order format for display

```typescript
const order = companyToOrder(companyData, userId)
```

#### `transformOrder(order)`
Normalizes any order record to API response format

```typescript
const apiOrder = transformOrder(dbOrder)
```

## How It Works

### Step 1: Fetch Real Orders
```typescript
const orders = await getOrdersFromDatabase(db, {
  userId: adminOnly ? undefined : userId,
  isAdmin: adminOnly,
  limit: 100
})
```

### Step 2: If Orders Exist → Return Them
If the database has real order records, they are transformed and returned immediately.

```
Found Orders in DB? → Transform & Return ✓
```

### Step 3: If No Orders → Use Company Data as Fallback
If no orders exist, the system fetches companies and converts them to order format for display.

```
No Orders in DB? → Fetch Companies → Convert to Orders → Return ✓
```

**Important**: This is NOT creating real orders in the database. It's just displaying company data in order format for the UI.

### Step 4: No Data → Return Empty Array
If neither orders nor companies exist, return empty data.

```
No Orders or Companies? → Return [] ✓
```

## Frontend Usage

### Admin Orders Page (`/app/admin/orders/page.tsx`)

**Simple Data Flow**:
```typescript
// 1. Fetch from API
const ordersResponse = await fetch(`/api/orders?_t=${timestamp}`, {
  headers: { Authorization: `Bearer ${token}` }
})

// 2. Extract data
const apiOrders = ordersResponse.json().data

// 3. Map to UI format
const ordersWithDetails = apiOrders.map(order => ({
  ...order,
  companyName: order.companyName || "N/A",
  state: order.state || "N/A",
  // ... other fields
}))

// 4. Display
return <OrdersTable orders={ordersWithDetails} />
```

**Key Points**:
- Always use the API data directly
- No need for duplicate fallback logic in the UI
- API handles all transformation
- UI focuses only on presentation

## Data Types

### Company Record
```typescript
interface Company {
  id: string
  userId: string
  name: string
  type: "LLC" | "Corporation" | "S-Corp" | "Non-Profit"
  state: string
  status: "pending" | "processing" | "active" | "suspended"
  revenue?: number
  packageType?: string
  createdAt?: string
  updatedAt?: string
  // ... other fields
}
```

### Order Record
```typescript
interface Order {
  id: string
  userId: string
  companyId: string
  companyName: string
  type: string
  status: string
  amount: number
  total: number
  packagePrice?: number
  stateFilingFee?: number
  addonsTotal?: number
  paymentStatus: string
  paymentMethod: string
  items?: any[]
  purchasedAddons?: any[]
  createdAt: string
  updatedAt: string
}
```

## Authentication & Authorization

### Token Verification
```typescript
const decoded = verifyToken(token)
// decoded = { userId, role, ... }
```

### Admin Check
```typescript
const isAdmin = decoded.role === "admin"
```

### Query Building
- **Admin**: `{}` (see all records)
- **User**: `{ userId: decoded.userId }` (see only their records)

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Unauthorized` | Missing/invalid token | Include valid Authorization header |
| `Invalid token` | Token verification failed | Re-authenticate and get new token |
| `Failed to fetch orders` | Database error | Check database connection |
| `Unauthorized` (404) | User not found | Ensure user exists in database |

### Debug Logging

Enable debug output:
```typescript
console.log("[v0] Orders found:", orders.length)
console.log("[v0] Creating display orders from X companies")
```

All API endpoints include `[v0]` prefixed console logs for debugging.

## Database Schema

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: String,          // Required for user filtering
  companyId: String,       // Links to company
  companyName: String,     // Denormalized for display
  type: String,            // "Formation", etc.
  status: String,          // "pending", "active", "completed"
  amount: Number,
  total: Number,
  packagePrice: Number,
  stateFilingFee: Number,
  addonsTotal: Number,
  paymentStatus: String,   // "pending", "completed", "failed"
  paymentMethod: String,   // "card", "bank_transfer", etc.
  items: Array,
  purchasedAddons: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Companies Collection
```javascript
{
  _id: ObjectId,
  userId: String,          // Links to user
  name: String,
  type: String,            // "LLC", "Corporation", etc.
  state: String,           // State abbreviation
  status: String,
  revenue: Number,         // Optional
  packageType: String,     // Optional
  createdAt: Date,
  updatedAt: Date
  // ... other fields
}
```

## Testing the System

### Test Case 1: Real Orders Exist
```bash
# Setup
1. Create a company: POST /api/companies
2. Create an order: POST /api/orders
3. Fetch orders: GET /api/orders

# Expected
- Orders API returns the real order
- Order data matches the created order
```

### Test Case 2: No Orders, Companies Exist
```bash
# Setup
1. Create a company: POST /api/companies
2. Delete all orders (or start fresh)
3. Fetch orders: GET /api/orders

# Expected
- Orders API returns company data converted to order format
- No real orders in database, but companies displayed as orders
```

### Test Case 3: Admin vs User Access
```bash
# Admin Request
GET /api/orders -H "Authorization: Bearer {admin_token}"
# Expected: All orders/companies

# User Request
GET /api/orders -H "Authorization: Bearer {user_token}"
# Expected: Only user's orders/companies
```

## Troubleshooting

### Orders Show Empty
1. Check if token is valid: `verifyToken(token)`
2. Check if companies exist: `GET /api/companies`
3. Check console logs for `[v0]` messages
4. Verify user role is set correctly in token

### Orders Show Duplicate Data
1. Ensure no orders and companies with same data
2. Check if fallback logic is being triggered
3. Review console logs for data sources

### Performance Issues
- Set appropriate `limit` value in options
- Use pagination for large datasets
- Add database indexes on `userId` and `createdAt`

## Migration Guide

### From Old System to New System

**Old**: Separate logic in API and frontend
```typescript
// Old: API didn't handle fallback
// Old: Frontend had duplicate fallback logic
```

**New**: Centralized service
```typescript
// New: Use processOrders() service
const orderData = await processOrders(db, options)

// New: Frontend just uses API response
const orders = apiResponse.data
```

### Steps
1. ✓ Create `order-service.ts` utility
2. ✓ Update `/api/orders` to use service
3. ✓ Update admin page to use API response directly
4. ✓ Remove duplicate fallback logic from components
5. ✓ Test all scenarios

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Batch export functionality
- [ ] Advanced filtering API
- [ ] Order history tracking
- [ ] Analytics dashboard
- [ ] Rate limiting per user
- [ ] Caching layer
- [ ] GraphQL API alternative
