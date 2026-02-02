# Orders Data Structure - Nested in Companies

## Critical Understanding

**Orders are NOT stored in a separate collection.** They are embedded as an array field within each company document in the `companies` collection.

## Database Structure

```
companies collection:
├── _id: ObjectId
├── name: string
├── userId: ObjectId
├── state: string
├── packageType: string
├── orders: [ ← THIS IS WHERE ORDERS LIVE
│   {
│     id: string (ObjectId)
│     userId: ObjectId
│     orderType: string (e.g., "LLC Formation")
│     packageType: string
│     state: string
│     status: string (completed, pending, etc)
│     pricing: {
│       packagePrice: number
│       stateFilingFee: number
│       addonsTotal: number
│       subtotal: number
│       total: number
│     }
│     selectedAddons: array
│     paymentInfo: {
│       method: string
│       status: string
│       whatsappPhone: string
│       receiptUrl: string
│       date: ISO8601
│     }
│     purchasedAddons: array
│     passportDocuments: array
│     createdAt: ISO8601
│     updatedAt: ISO8601
│   }
│ ]
├── purchasedAddons: array
├── members: array
└── ... other company fields
```

## API Behavior

### GET /api/orders
- **Fetches** all companies from the user (or all if admin)
- **Extracts** the `orders` array from each company
- **Flattens** all orders into a single array
- **Transforms** each order to the standardized API format
- **Returns** merged array of all orders

### POST /api/orders
- **Receives** order data from client
- **Validates** company exists
- **Embeds** new order into the company's `orders` array using `$push`
- **Updates** company's `updatedAt` timestamp
- **Returns** the created order with company metadata

### GET /api/orders/[id]
- **Searches** in orders collection first
- **Falls back** to searching in companies embedded orders
- **Matches** by `orders.id` field
- **Returns** full order with company and user details

### PUT /api/orders/[id]
- **Finds** order (standalone or embedded)
- **Updates** using `arrayFilters` for embedded orders
- **Handles** both standalone and nested updates
- **Updates** parent company's `updatedAt`

## Key Implementation Points

### 1. Order Service (lib/api/order-service.ts)
```typescript
// Extract orders from companies
export async function getOrdersFromCompanies(db: Db, options: OrderServiceOptions) {
  // Fetch all companies
  const companies = await db.collection("companies").find(query).toArray()
  
  // Extract and flatten orders from each company
  for (const company of companies) {
    if (company.orders && Array.isArray(company.orders)) {
      for (const order of company.orders) {
        allOrders.push({
          ...order,
          companyId: company._id.toString(),
          companyName: company.name,
          userId: company.userId,
        })
      }
    }
  }
  
  return allOrders
}
```

### 2. Creating Orders (POST /api/orders)
```typescript
const newOrder = {
  id: new ObjectId().toString(),
  userId: decoded.userId,
  orderType: orderType || type,
  pricing: { /* pricing info */ },
  createdAt: new Date().toISOString(),
}

// Push order into company's orders array
await db.collection("companies").findOneAndUpdate(
  { _id: new ObjectId(companyId) },
  {
    $push: { orders: newOrder },
    $set: { updatedAt: new Date().toISOString() },
  }
)
```

### 3. Updating Orders (PUT /api/orders/[id])
```typescript
// Use arrayFilters to update nested array element
await db.collection("companies").findOneAndUpdate(
  { _id: companyIdObj },
  {
    $set: {
      "orders.$[elem]": { ...order, ...updateData },
    },
  },
  {
    arrayFilters: [{ "elem.id": orderId }],
    returnDocument: "after",
  }
)
```

## Order Data Structure

Each order has:
- `id`: Unique identifier (string format ObjectId)
- `userId`: User who created the order
- `orderType`: Type of order (LLC Formation, C-Corp Formation, etc)
- `packageType`: Package level (starter, standard, premium)
- `state`: State for formation
- `status`: Order status (pending, completed, etc)
- `pricing`: Breakdown of costs
- `selectedAddons`: Add-ons selected at order time
- `purchasedAddons`: Add-on services and their payment status
- `paymentInfo`: Payment method and status
- `passportDocuments`: Uploaded passport files
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Common Issues & Solutions

### Issue: Orders not showing
**Solution**: Check that company documents have the `orders` array populated. If not, orders need to be migrated into the companies collection.

### Issue: Order creation failing
**Solution**: Ensure company exists in database and has a valid `_id`. Verify the `$push` operation completes successfully.

### Issue: Order updates not working
**Solution**: Make sure arrayFilters are using the correct field name (`orders._id` vs `orders.id`). Both formats are supported but must match the actual data.

### Issue: Admin not seeing all orders
**Solution**: Ensure the query in `getOrdersFromCompanies` doesn't filter by userId when isAdmin=true.

## Migration from Separate Collection

If you have orders in a separate collection and want to move them into companies:

```typescript
// Fetch all standalone orders
const standaloneOrders = await db.collection("orders").find({}).toArray()

// For each order, push it into the company's orders array
for (const order of standaloneOrders) {
  await db.collection("companies").updateOne(
    { _id: order.companyId },
    { $push: { orders: order } }
  )
}

// Delete the separate orders collection
await db.collection("orders").deleteMany({})
```

## Testing the System

1. **Create a company** via /api/companies
2. **Create an order** via POST /api/orders with the company ID
3. **Fetch orders** via GET /api/orders - should see the nested order
4. **Fetch single order** via GET /api/orders/[id] - should find it in company
5. **Update order** via PUT /api/orders/[id] - should update nested array
6. **Delete order** via DELETE /api/orders/[id] - should remove from array

All operations should work seamlessly with the nested structure.
