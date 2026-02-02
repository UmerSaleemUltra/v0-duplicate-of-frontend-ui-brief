# Data Structure - Orders in Companies

## CRITICAL UNDERSTANDING

**Orders are NOT stored in a separate collection!**

All orders are embedded within each company document as an array field called `orders`.

## Data Model

```
companies collection
├── company1
│   ├── _id: ObjectId
│   ├── name: string
│   ├── userId: string
│   ├── status: string
│   ├── orders: [    ← Orders embedded here!
│   │   ├── id: string
│   │   ├── userId: string
│   │   ├── orderType: string
│   │   ├── packageType: string
│   │   ├── state: string
│   │   ├── status: string
│   │   ├── pricing: object
│   │   ├── paymentInfo: object
│   │   ├── purchasedAddons: array
│   │   ├── createdAt: date
│   │   └── updatedAt: date
│   │]
│   ├── purchasedAddons: array   ← Top-level addons
│   ├── revenue: number
│   └── ... other fields
```

## API Strategy

### GET /api/orders
1. Query `companies` collection
2. Extract `orders` array from each company
3. Flatten and transform orders
4. Sort by creation date
5. Return transformed orders

### GET /api/orders/[id]
1. Query all companies
2. Search for order in each company's `orders` array
3. Return specific order with company context

### GET /api/companies/[id]/orders
1. Query specific company by ID
2. Extract its `orders` array
3. Return company's orders

## Implementation Details

### Order Service (/lib/api/order-service.ts)

**Main Functions:**
- `processOrders(db, options)` - Get all orders (main entry point)
- `getOrdersFromCompanies(db, options)` - Extract orders from companies
- `getOrderById(db, orderId)` - Find specific order
- `getCompanyOrders(db, companyId)` - Get orders for company
- `transformOrder(order)` - Format for API response

**Key Points:**
- No longer queries non-existent `orders` collection
- Directly extracts from companies' embedded `orders` array
- Handles flattening multiple companies' orders
- Provides company context with each order

### API Endpoints

**Orders API (/app/api/orders/route.ts)**
- Uses `processOrders()` from order service
- Returns all orders across all companies
- Respects user permissions (admin vs client)
- Transforms to standard API format

**Company Orders API (/app/api/companies/[id]/orders/route.ts)**
- Uses `getCompanyOrders()` from order service
- Returns orders for specific company
- Maintains company context

## Data Flow

```
Admin Request
    ↓
GET /api/orders
    ↓
processOrders(db, { isAdmin: true })
    ↓
getOrdersFromCompanies(db, {})
    ↓
Query companies collection (no filter)
    ↓
Extract orders[] from each company
    ↓
Flatten into single array
    ↓
Sort by createdAt
    ↓
transformOrder() for each order
    ↓
Return API response
    ↓
[{ id, companyId, companyName, pricing, status, ... }, ...]
```

## Example Usage

### Fetch All Orders (Admin)
```javascript
const response = await fetch('/api/orders', {
  headers: { Authorization: 'Bearer token' }
})
const orders = await response.json()
// orders.data = [order1, order2, order3, ...]
```

### Fetch Company Orders
```javascript
const response = await fetch('/api/companies/companyId/orders', {
  headers: { Authorization: 'Bearer token' }
})
const orders = await response.json()
// orders = [company_order1, company_order2, ...]
```

### Fetch Single Order
```javascript
const response = await fetch('/api/orders/orderId', {
  headers: { Authorization: 'Bearer token' }
})
const order = await response.json()
// order = { id, companyId, pricing, ... }
```

## Important Notes

1. **No separate orders collection** - This was the confusion!
2. **Orders live in companies** - Each company has an `orders` array
3. **API hides complexity** - Clients don't need to know this structure
4. **Consistent API format** - Orders always returned in standard format
5. **Company context preserved** - Each order knows its company

## File Updates

- `/lib/api/order-service.ts` - Core order extraction logic
- `/app/api/orders/route.ts` - Orders API endpoint
- `/app/admin/orders/page.tsx` - Admin orders page (simplified)

All files now understand that orders come from companies collection, not separate storage.
