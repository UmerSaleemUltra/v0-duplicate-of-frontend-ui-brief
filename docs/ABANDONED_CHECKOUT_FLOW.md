# Abandoned Checkout Flow - Complete Overview

## High-Level Flow

```
User Starts Checkout
    ↓
User Enters Data (Email, State, Business Name, etc.)
    ↓
Browser Tracking (Every 2 seconds)
    ↓
POST /api/abandoned-checkouts (Auto-save progress)
    ↓
Check if User Has Order (Filter out existing customers)
    ↓
Deduplicate by Email + SessionId (Update if exists, create if new)
    ↓
Save to abandoned_checkouts Collection in MongoDB
    ↓
Track which checkout step user abandoned at
    ↓
Admin Views Dashboard
    ↓
GET /api/abandoned-checkouts (Retrieve last 30 days)
    ↓
Filter Out Customers (Remove users who now have orders)
    ↓
Display Abandoned Checkout List with Stats
    ↓
Send Email Campaign (Optional recovery emails)
```

---

## Step-by-Step Breakdown

### 1. **User Starts Checkout**
- User visits `/checkout` page
- Session ID generated: `sess_{timestamp}_{random}`
- SessionId stored in `sessionStorage` (persists across page reloads)

### 2. **Frontend Tracking (Every Step)**
**File:** `components/checkout/checkout-shell.tsx`

Every 2 seconds, the browser posts checkout progress:
```javascript
POST /api/abandoned-checkouts
{
  sessionId: "sess_1627389621_abc123xyz",
  email: "user@example.com",
  name: "John Doe",
  phone: "+1234567890",
  lastStep: 2,                    // Current step (0-5)
  state: "Wyoming",
  packageType: "llc",
  businessName: "Acme Corp LLC",
  estimatedTotal: 249,
  packagePrice: 149,
  addons: ["ein", "registered_agent"]
}
```

**Debounce:** Only fires when `currentStep`, `email`, `state`, `businessName`, etc. change. Waits 2 seconds to avoid spam.

### 3. **Backend Processing - POST /api/abandoned-checkouts**
**File:** `app/api/abandoned-checkouts/route.ts`

**Step 1 - Validate Session**
- Check `sessionId` exists
- Return 400 if missing

**Step 2 - Check if User Has Order**
- Query `users` collection by email
- Query `companies` collection for that user's ID
- If user already has a completed order → skip saving (they're not abandoned)
- Log: "User already has completed order, skipping abandoned checkout"

**Step 3 - Deduplicate**
- Call `deduplicateAbandonedCheckout()`
- Normalize email to lowercase
- **Upsert query:**
  ```
  Query: { email: "user@example.com", sessionId: "sess_1627389621_abc123xyz" }
  If exists → Update (updatedAt becomes current time)
  If not exists → Create new record with createdAt
  ```
- This prevents duplicate entries

**Step 4 - Save to Database**
```javascript
{
  _id: ObjectId,
  sessionId: "sess_1627389621_abc123xyz",
  email: "user@example.com",      // Lowercase
  name: "John Doe",
  phone: "+1234567890",
  lastStep: 2,                    // Current step (0=Account, 1=State, 2=Business, 3=Owner, 4=Review, 5=Payment)
  state: "Wyoming",
  packageType: "llc",
  businessName: "Acme Corp LLC",
  estimatedTotal: 249,
  packagePrice: 149,
  addons: ["ein", "registered_agent"],
  recovered: false,               // Not yet recovered
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:00:30Z")  // Updates each time
}
```

---

### 4. **User Completes Order**
**File:** `app/api/companies/route.ts`

When user successfully completes checkout and places an order:

**Step 1 - Create Company**
- Order stored in `companies` collection
- Status = "Pending"

**Step 2 - Auto-Remove from Abandoned**
- Call `removeAbandonedCheckout(db, email)`
- Case-insensitive email match
- Delete abandoned_checkouts record
- Broadcast event: `abandonedCheckout:removed`

**Step 3 - Send Confirmation Email**
- Email sent with order details
- Without "Total Amount" line (as per recent fix)

**Step 4 - Update User**
- Set `users.lastLoginAt = now`
- Set `users.lastLoginDevice = fingerprint`

---

### 5. **Admin Views Abandoned Checkouts**
**File:** `app/api/abandoned-checkouts/route.ts` (GET endpoint)

**Step 1 - Verify Admin Authorization**
- Check Bearer token
- Verify role = "admin"
- Return 403 if unauthorized

**Step 2 - Fetch Last 30 Days**
```javascript
Query: {
  createdAt: { $gte: 30DaysAgo },
  recovered: { $ne: true }
}
Limit: 100 records
Sort: By updatedAt (newest first)
```

**Step 3 - Filter Out Existing Customers**
For each abandoned checkout:
- Check if email has a completed order
- If yes → User now has order, delete abandoned record in background
- If no → Include in the dashboard list

**Step 4 - Calculate Stats**
```javascript
{
  total: 47,                  // Total abandoned checkouts
  last24h: 5,                 // Abandoned in last 24 hours
  last7Days: 12,              // Abandoned in last 7 days
  potentialRevenue: 11753,    // Sum of all estimatedTotal
  stepBreakdown: {
    "Account": 2,             // Abandoned at account step
    "State & Package": 5,
    "Business Info": 8,
    "Owner Info": 10,
    "Review": 12,
    "Payment": 10              // Most abandon here
  }
}
```

**Step 5 - Return Response**
```javascript
{
  success: true,
  data: [                       // Array of abandoned checkouts
    {
      _id: "...",
      email: "user@example.com",
      lastStep: 5,              // Abandoned at payment
      businessName: "...",
      estimatedTotal: 249,
      updatedAt: "2024-01-15T10:00:30Z",
      ...
    }
  ],
  stats: {
    total: 47,
    last24h: 5,
    last7Days: 12,
    potentialRevenue: 11753,
    stepBreakdown: { ... }
  }
}
```

---

### 6. **Admin Sends Recovery Email (Manual/Automated)**

Admin can see which users abandoned at which step and send targeted emails:
- **Payment step abandonment:** "Complete your checkout" 
- **Business info abandonment:** "Need help with LLC info?"
- **Account step abandonment:** "Finish creating your account"

---

### 7. **Cleanup Operations**

#### **Auto-Cleanup on GET (Real-time)**
When fetching abandoned checkouts, system automatically:
- Identifies users who now have completed orders
- Deletes their abandoned checkout records
- No duplicates in abandoned list

#### **Manual Cleanup - PATCH**
Mark checkout as recovered:
```
PATCH /api/abandoned-checkouts
{
  sessionId: "...",
  recovered: true
}
```
Sets `recovered: true` and `recoveredAt: timestamp`

#### **Scheduled Cleanup - DELETE**
Delete checkouts older than 90 days:
```
DELETE /api/abandoned-checkouts
```
Removes records with `createdAt < 90DaysAgo`

---

## Database Schema

### `abandoned_checkouts` Collection

```javascript
{
  _id: ObjectId,
  sessionId: String,              // Unique session identifier
  email: String | Null,           // Normalized to lowercase
  name: String | Null,
  phone: String | Null,
  lastStep: Number,               // 0-5 (which step abandoned at)
  state: String | Null,
  packageType: String | Null,     // "llc", "corp", etc.
  businessName: String | Null,
  estimatedTotal: Number,         // Total order amount
  packagePrice: Number,           // Base package price
  addons: Array<String>,          // ["ein", "registered_agent"]
  recovered: Boolean,             // Recovery tracked?
  createdAt: ISODate,
  updatedAt: ISODate,
  recoveredAt: ISODate | Null
}
```

### Indexes
```javascript
// Fast deduplication lookup
{ email: 1, sessionId: 1 }

// Fast email-based removal
{ email: 1 }

// Auto-expire after 90 days
{ createdAt: 1 } (TTL)
```

---

## Key Features

### 1. **Deduplication**
- Same email+sessionId = update existing record, not create new
- Prevents duplicate tracking

### 2. **Auto-Removal on Order**
- Immediately removes abandoned checkout when user completes order
- No orphaned records

### 3. **Customer Filtering**
- Existing customers excluded from abandoned list
- GET endpoint auto-cleans orphaned records

### 4. **Email Normalization**
- All emails stored lowercase
- Case-insensitive matching (regex)
- Prevents lookup failures

### 5. **Step Tracking**
- Know exactly which step users abandon at
- Payment step has highest abandonment (~40%)
- Helps identify UX bottlenecks

### 6. **Real-Time Broadcasting**
- When checkout removed, event broadcasted
- Admin dashboards update instantly
- Uses existing broadcaster service

### 7. **TTL Auto-Cleanup**
- Records auto-delete after 90 days
- No manual database maintenance

---

## Common Scenarios

### Scenario 1: User Abandons at Step 3 (Business Info)
1. User enters email, state, package → POST /api/abandoned-checkouts
2. Record created at step 2
3. User leaves page
4. Record remains in database with `lastStep: 2`
5. Admin sees "8 checkouts abandoned at Business Info step"
6. Admin can email reminder or improve form UX

### Scenario 2: User Abandons, Then Completes Order
1. User abandons checkout → Record in abandoned_checkouts
2. User returns next day, completes checkout → POST /api/companies
3. Company created, `removeAbandonedCheckout()` called
4. Abandoned checkout record deleted immediately
5. `abandonedCheckout:removed` event broadcasted
6. Admin dashboard auto-refreshes, record disappears

### Scenario 3: Duplicate Session (Same Email, Resumes Checkout)
1. Day 1: User at step 2, record created
2. Day 3: Same user resumes checkout, at step 4
3. POST /api/abandoned-checkouts with same sessionId + email
4. Upsert: Updates existing record, `updatedAt: now`, `lastStep: 4`
5. No duplicate — same record, just updated

### Scenario 4: Admin Views Dashboard
1. Admin calls GET /api/abandoned-checkouts
2. System fetches last 30 days (limit 100)
3. For each record, checks if user has completed order
4. Filters out: users with orders
5. Auto-deletes orphaned records in background
6. Returns only truly abandoned customers

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/abandoned-checkouts` | POST | Track checkout progress | Public |
| `/api/abandoned-checkouts` | GET | Fetch abandoned list + stats | Admin |
| `/api/abandoned-checkouts` | PATCH | Mark as recovered | Admin |
| `/api/abandoned-checkouts` | DELETE | Clean up old records | Admin |
| `/api/abandoned-checkouts/cleanup` | POST | Cleanup for users with orders | Admin |

---

## Monitoring & Alerts

### Key Metrics to Track:
1. **Abandonment Rate** = (Abandoned / Total Started) × 100
2. **Revenue at Risk** = Sum of all estimatedTotal values
3. **Recovery Rate** = (Recovered / Abandoned) × 100
4. **Step Breakdown** = Which steps have highest abandonment

### Typical Abandonment Distribution:
- Account Step: 5%
- State & Package: 10%
- Business Info: 15%
- Owner Info: 20%
- Review: 25%
- **Payment: 25%** ← Most abandon here

---

This system ensures abandoned checkouts are tracked efficiently, deduplicated correctly, auto-cleaned when orders are placed, and filtered intelligently for the admin dashboard.
