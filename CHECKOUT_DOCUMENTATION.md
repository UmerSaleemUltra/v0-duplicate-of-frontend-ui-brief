# BuzzFiling Checkout System - Complete Documentation

## Overview

The BuzzFiling checkout system is a multi-step form flow for business entity registration (LLC, S-Corp). It handles user account creation, business information collection, owner details, review, and payment processing. All checkout data is persisted client-side with server-side validation and security token verification.

---

## Architecture Overview

```
User Flow:
Account Creation → State & Package Selection → Business Info → Owner Info → Review Order → Payment
     ↓                        ↓                      ↓               ↓            ↓           ↓
[Client Storage] ←→ [IndexedDB] ←→ [SessionStorage] ←→ [MongoDB] ←→ [Checkout Tokens]
```

---

## 1. CLIENT-SIDE COMPONENTS

### 1.1 Main Checkout Page
**File:** `/app/checkout/page.tsx`
**Type:** Client Component ("use client")

**Responsibilities:**
- Manages multi-step form state using React state
- Loads and persists checkout data across page refreshes
- Handles authentication status checking
- Coordinates between all 6 checkout steps

**Key Data Types:**

```typescript
type Member = {
  id: string                    // Unique member identifier
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  ssn?: string                  // Social Security Number
  dateOfBirth?: string
  isResponsiblePerson?: boolean // Primary owner flag
  needsItin?: boolean           // ITIN (Individual Tax ID Number) required
  itinAdded?: boolean           // ITIN document uploaded
  passportFile?: File | null    // Passport upload for ITIN
  passportKey?: string          // Blob storage key
  passportUrl?: string          // Blob storage URL
  passportId?: string           // MongoDB document ID
  passportIndexedDBId?: string  // IndexedDB ID for offline support
}

type CheckoutData = {
  // Account Information
  email: string
  password: string
  phone: string
  name: string
  userId?: string
  
  // State & Package Selection
  state: string                 // US State code (e.g., "CA", "NY")
  entityType: string            // "llc" | "s-corp"
  packageType: string           // "starter" | "advanced"
  
  // Business Information
  businessName: string
  businessAddress: string
  businessCity: string
  businessZip: string
  businessWebsite?: string
  businessCategory?: string
  businessDescription?: string
  needsResellerCertificate?: boolean
  
  // Members (Owners/Directors)
  members: Member[]
  
  // Add-ons & Upsells
  addons: any[]                 // Selected additional services
  upsells: string[]
  
  // Pricing
  totalAmount?: number          // Total order price
  packagePrice?: number         // Base package price
  stateFilingFee?: number       // State-specific filing fee
  addonsTotal?: number          // Total add-ons cost
  
  // Promo Code
  promoCode?: {
    code: string
    discountType: "percentage" | "fixed"
    discountValue: number
    discountAmount: number
  } | null
}
```

**Checkout Steps:**
1. **Account Step** - Email, password, phone, name
2. **State & Package Step** - State selection, entity type, package tier
3. **Business Info Step** - Business details, reseller certificate option
4. **Owner Info Step** - Member details, SSN, ITIN uploads
5. **Review Step** - Order review, edit capabilities
6. **Payment Step** - Payment method selection, receipt upload

**Key Lifecycle:**
- On mount: Load saved data from localStorage
- Restore previous step from sessionStorage
- Pre-fill authenticated user data if available
- Validate step before advancing

### 1.2 Checkout Shell (Layout)
**File:** `/components/checkout/checkout-shell.tsx`
**Type:** Client Component

**Features:**
- Visual step progress indicator (sidebar on desktop, mobile menu)
- Session tracking for abandoned checkout recovery
- Save progress functionality
- Abandoned checkout telemetry

**Abandoned Checkout Tracking:**
```typescript
// Automatically tracks checkout progress every 2 seconds (debounced)
// Data sent to /api/abandoned-checkouts:
{
  sessionId: string          // Unique session identifier
  email: string | null
  name: string | null
  phone: string | null
  lastStep: number           // Which step user abandoned
  state: string | null
  packageType: string | null
  businessName: string | null
  estimatedTotal: number
  packagePrice: number
  addons: any[]
}
```

**Session ID Generation:**
- Format: `sess_{timestamp}_{random}`
- Stored in sessionStorage
- Persists for the entire checkout session
- Cleared when user closes browser

### 1.3 Payment Step Component
**File:** `/components/checkout/payment-step.tsx`

**Responsibilities:**
- Display final order summary
- Handle payment method selection (bank transfer, already paid)
- Manage receipt file upload for "already paid" option
- Submit order to backend

**Payment Methods:**
1. **Bank Transfer** - User transfers funds separately
2. **Already Paid** - User uploads receipt proof

**Receipt Upload:**
- Accepts image files (JPG, PNG, PDF)
- Uploads to Blob storage via `/api/passports/route.ts` (file upload handler)
- Stores receipt URL in order document

---

## 2. CLIENT-SIDE STORAGE

### 2.1 Checkout Storage Utility
**File:** `/lib/checkout-storage.ts`

**Purpose:** Manage localStorage persistence for checkout data

**Functions:**

```typescript
// Initialize empty checkout data if not exists
initCheckoutData(): void

// Get all checkout data (with expiry check)
getCheckoutData(): CheckoutData | null

// Save checkout data with auto-expiry (7 days)
saveCheckoutData(data: Partial<CheckoutData>): void

// Clear all checkout data
clearCheckoutData(): void

// Save current step number
saveCheckoutStep(step: number): void

// Get last saved step
getSavedStep(): number | null

// Update timestamp and extend expiry
saveProgress(): { success: boolean; message: string }

// Clear data after successful order completion
clearCompletedOrderData(): void
```

**Storage Structure:**
```javascript
localStorage.checkoutData = {
  account: {
    email: string
    password: string
    phone: string
    name: string
    userId?: string
  },
  state: {
    state: string
    entityType: "llc" | "s-corp"
    packageType: "starter" | "advanced"
  },
  businessInfo: {
    businessName: string
    businessCategory: string
    businessDescription: string
    needsResellerCertificate: boolean
  },
  members: Member[],
  addons: any[],
  orderId: string,
  createdAt: string (ISO 8601),
  status: "draft",
  payment: {
    method: string
    status: "pending"
  },
  totalAmount: number,
  packagePrice: number,
  stateFilingFee: number,
  addonsTotal: number,
  savedAt: string (ISO 8601),
  expiresAt: string (ISO 8601 - 7 days from now),
  currentStep: number
}
```

**Data Expiry:**
- Default expiry: 7 days
- Checked on every retrieval
- Automatically cleared if expired
- Can be extended by calling `saveProgress()`

### 2.2 Checkout Token Storage
**File:** `/lib/checkout-token.ts`

**Purpose:** Generate and verify security tokens for checkout session

**Server Functions:**

```typescript
// Generate a checkout token tied to email
generateCheckoutToken(email: string): Promise<string>
// Returns: 64-character hex token

// Verify token is valid and not used
verifyCheckoutToken(token: string, email: string): Promise<{
  valid: boolean
  error?: string
}>

// Mark token as used after successful signup
invalidateCheckoutToken(token: string): Promise<void>
```

**Token Flow:**
1. Frontend initiates checkout
2. Calls `/api/checkout/token` endpoint
3. Backend generates token via `generateCheckoutToken()`
4. Token stored in MongoDB `checkout_tokens` collection
5. Token passed to signup API
6. Signup validates token with `verifyCheckoutToken()`
7. Token marked as used with `invalidateCheckoutToken()`
8. Used tokens expire after 1 hour (database cleanup)

**Token Security:**
- Generated with crypto.randomBytes(32)
- 30-minute expiry default
- One-time use only
- Email-locked (can't reuse for different email)
- Automatic cleanup of expired/used tokens

---

## 3. SERVER-SIDE APIs

### 3.1 Checkout Token Generation API
**Endpoint:** `POST /api/checkout/token`
**File:** `/app/api/checkout/token/route.ts`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "checkoutToken": "a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6..."
}
```

**Validation:**
- Email required
- Valid email format
- Case-insensitive handling

**Database Operations:**
```javascript
// Inserted into checkout_tokens collection:
{
  token: string,
  email: string (normalized),
  createdAt: Date,
  expiresAt: Date (30 minutes),
  used: false
}
```

**Cleanup:**
- Removes expired tokens
- Removes used tokens older than 1 hour

### 3.2 Signup API
**Endpoint:** `POST /api/auth/signup`
**File:** `/app/api/auth/signup/route.ts`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "checkoutToken": "..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "client"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Security:**
- **Checkout Token Required** - Prevents direct API signups (must go through checkout flow)
- **Token Validation** - Verifies token matches email and hasn't been used
- **Password Validation** - Minimum 8 chars, uppercase, lowercase, number, special char
- **Email Validation** - RFC 5322 compliant
- **Phone Validation** - Accepts international formats
- **Input Sanitization** - Removes XSS attempts

**Database Operations:**
```javascript
// Insert into users collection:
{
  name: string,
  email: string (lowercase, trimmed),
  phone: string,
  password: string (bcrypt hashed),
  role: "client",
  createdAt: Date,
  updatedAt: Date
}
```

**Token Invalidation:**
- After successful signup, checkout token marked as used
- Prevents token reuse

### 3.3 Abandoned Checkouts API
**Endpoint:** 
- `POST /api/abandoned-checkouts` - Track abandonment
- `GET /api/abandoned-checkouts` - Retrieve abandoned carts (admin)

**File:** `/app/api/abandoned-checkouts/route.ts`

**POST Request (from checkout shell):**
```json
{
  "sessionId": "sess_1234567890_abcd1234",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "lastStep": 3,
  "state": "CA",
  "packageType": "advanced",
  "businessName": "Acme Corp",
  "estimatedTotal": 499,
  "packagePrice": 299,
  "addons": [...]
}
```

**GET Response (admin only):**
```json
{
  "success": true,
  "data": [...], // array of abandoned checkouts
  "stats": {
    "total": 42,
    "last24h": 8,
    "last7Days": 25,
    "potentialRevenue": 21000,
    "stepBreakdown": {
      "Account": 5,
      "State & Package": 8,
      "Business Info": 12,
      "Owner Info": 10,
      "Review": 5,
      "Payment": 2
    }
  }
}
```

**Database Operations:**
```javascript
// Inserted into abandoned_checkouts collection:
{
  sessionId: string,
  email: string,
  name: string,
  phone: string,
  lastStep: number,
  state: string,
  packageType: string,
  businessName: string,
  estimatedTotal: number,
  packagePrice: number,
  addons: any[],
  createdAt: Date,
  updatedAt: Date,
  recovered: boolean (default: false)
}
```

**Tracking:**
- Only tracks if user has entered data (email, state, or businessName)
- Debounced to avoid excessive API calls (2 second delay)
- Silent failure if API unavailable
- Retrieves last 30 days of abandoned checkouts
- Updates `updatedAt` on each form change

### 3.4 Promo Code Validation API
**Endpoint:** `POST /api/promo-codes/validate`
**File:** `/app/api/promo-codes/validate/route.ts`

**Request:**
```json
{
  "code": "SUMMER20",
  "orderAmount": 499.99,
  "packageType": "advanced",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "code": "SUMMER20",
  "description": "20% off all packages",
  "discountType": "percentage",
  "discountValue": 20,
  "discountAmount": 100.00,
  "maxDiscountAmount": 100,
  "minOrderAmount": 100,
  "applicableTo": "all"
}
```

**Validations:**
- ✓ Code exists in database
- ✓ Code is active (`isActive: true`)
- ✓ Within validity period (`validFrom` to `validUntil`)
- ✓ Usage limit not reached (`usageLimit` and `usedCount`)
- ✓ Per-user limit not exceeded (`perUserLimit` per email)
- ✓ Minimum order amount met
- ✓ Package applicable (all, starter, advanced)

**Discount Calculation:**
- **Percentage:** `(orderAmount * discountValue / 100)` capped at `maxDiscountAmount`
- **Fixed:** Direct fixed amount
- Never exceeds order amount

**Database Structure:**
```javascript
// promo_codes collection:
{
  code: string (uppercase),
  description: string,
  discountType: "percentage" | "fixed",
  discountValue: number,
  maxDiscountAmount?: number,
  minOrderAmount?: number,
  applicableTo: "all" | "starter" | "advanced",
  usageLimit?: number,
  usedCount: number,
  perUserLimit?: number,
  isActive: boolean,
  validFrom: Date,
  validUntil: Date,
  createdAt: Date
}
```

---

## 4. DATABASE SCHEMA

### 4.1 MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  phone: string,
  password: string (bcrypt hashed),
  role: "admin" | "client",
  createdAt: ISODate,
  updatedAt: ISODate,
  lastLoginAt?: ISODate,
  isActive: boolean
}
```

#### Checkout Tokens Collection
```javascript
{
  _id: ObjectId,
  token: string (unique),
  email: string,
  createdAt: ISODate,
  expiresAt: ISODate,
  used: boolean,
  usedAt?: ISODate
}

// Indexes:
db.checkout_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.checkout_tokens.createIndex({ token: 1 })
db.checkout_tokens.createIndex({ email: 1 })
```

#### Abandoned Checkouts Collection
```javascript
{
  _id: ObjectId,
  sessionId: string (unique),
  email: string,
  name: string,
  phone: string,
  lastStep: number,
  state: string,
  packageType: string,
  businessName: string,
  estimatedTotal: number,
  packagePrice: number,
  addons: array,
  createdAt: ISODate,
  updatedAt: ISODate,
  recovered: boolean
}

// Indexes:
db.abandoned_checkouts.createIndex({ sessionId: 1 }, { unique: true })
db.abandoned_checkouts.createIndex({ email: 1 })
db.abandoned_checkouts.createIndex({ createdAt: 1 })
db.abandoned_checkouts.createIndex({ recovered: 1 })
```

#### Promo Codes Collection
```javascript
{
  _id: ObjectId,
  code: string (unique, uppercase),
  description: string,
  discountType: "percentage" | "fixed",
  discountValue: number,
  maxDiscountAmount?: number,
  minOrderAmount?: number,
  applicableTo: "all" | "starter" | "advanced",
  usageLimit?: number,
  usedCount: number,
  perUserLimit?: number,
  isActive: boolean,
  validFrom: ISODate,
  validUntil: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}

// Indexes:
db.promo_codes.createIndex({ code: 1 }, { unique: true })
db.promo_codes.createIndex({ isActive: 1 })
db.promo_codes.createIndex({ validFrom: 1, validUntil: 1 })
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  orderId: string (unique),
  account: {
    email: string,
    name: string,
    phone: string,
    userId: ObjectId
  },
  state: string,
  entityType: "llc" | "s-corp",
  packageType: "starter" | "advanced",
  businessInfo: {
    businessName: string,
    businessCategory: string,
    businessDescription: string,
    needsResellerCertificate: boolean
  },
  members: [{
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    ssn: string,
    dateOfBirth: string,
    isResponsiblePerson: boolean,
    itinAdded: boolean,
    passportId?: ObjectId
  }],
  addons: array,
  promoCode?: {
    code: string,
    discountType: string,
    discountValue: number,
    discountAmount: number
  },
  pricing: {
    packagePrice: number,
    stateFilingFee: number,
    addonsTotal: number,
    discountAmount: number,
    totalAmount: number
  },
  payment: {
    method: "bank_transfer" | "already_paid",
    status: "pending" | "completed",
    receiptUrl?: string,
    receiptUploadedAt?: ISODate
  },
  status: "draft" | "pending" | "processing" | "completed" | "failed",
  createdAt: ISODate,
  updatedAt: ISODate,
  completedAt?: ISODate
}

// Indexes:
db.orders.createIndex({ orderId: 1 }, { unique: true })
db.orders.createIndex({ "account.email": 1 })
db.orders.createIndex({ createdAt: -1 })
db.orders.createIndex({ status: 1 })
```

---

## 5. FILE STORAGE

### 5.1 Blob Storage Integration
**Service:** Vercel Blob (file upload storage)
**Files Uploaded:**
- ITIN Documents (passport images for owner verification)
- Payment Receipts (proof of bank transfer)

**Upload Process:**

```
Client Component (payment-step.tsx)
    ↓
[User selects file]
    ↓
[File uploaded via API]
    ↓
POST /api/passports
    ↓
[Uploaded to Blob Storage]
    ↓
[URL returned to client]
    ↓
[Stored in checkout data]
    ↓
[Submitted with order]
```

**Blob Storage Structure:**
```
/passports/
  - member_{memberId}_{timestamp}.pdf
  - member_{memberId}_{timestamp}.jpg
  
/receipts/
  - order_{orderId}_{timestamp}.pdf
  - order_{orderId}_{timestamp}.jpg
```

**File Metadata Stored:**
```javascript
{
  passportKey: string,      // Blob storage key
  passportUrl: string,      // Full URL to blob
  passportId: ObjectId,     // MongoDB document reference
  passportIndexedDBId: string  // IndexedDB ID for offline access
}
```

---

## 6. DATA FLOW DIAGRAMS

### 6.1 Complete Checkout Flow

```
START (/)
   ↓
[Click "Start Checkout"]
   ↓
GET /checkout
   ↓
[Load checkout page]
   ↓
POST /api/checkout/token (email)
   ↓
[Generate checkout token]
   ↓
Step 0: Account (email, password, phone, name)
   ↓
localStorage.checkoutData updated
   ↓
Step 1: State & Package (state, entity type, package)
   ↓
localStorage.checkoutData updated
   ↓
Step 2: Business Info (business name, address, category)
   ↓
localStorage.checkoutData updated
   ↓
Step 3: Owner Info (member details, SSN, ITIN files)
   ↓
[Upload ITIN to Blob Storage]
   ↓
localStorage.checkoutData updated
   ↓
POST /api/promo-codes/validate (if code entered)
   ↓
Step 4: Review (confirm all details)
   ↓
[Edit links allow jumping back to steps]
   ↓
Step 5: Payment (select payment method, upload receipt)
   ↓
[Submit order form]
   ↓
POST /api/auth/signup (with checkout token)
   ↓
[Account created, token invalidated]
   ↓
POST /api/companies/route (create company record)
   ↓
POST /api/companies/[id]/orders (create order record)
   ↓
[Clear checkout data]
   ↓
[Redirect to success page]
   ↓
END
```

### 6.2 Abandoned Checkout Recovery

```
User starts checkout
   ↓
sessionId generated
   ↓
Data entered in forms
   ↓
POST /api/abandoned-checkouts (debounced every 2s)
   ↓
   │[Data saved in MongoDB]
   ↓
User abandons session / closes browser
   ↓
   ←──────────────────────────┐
   │                          │
   └── Admin reviews abandoned carts
         ↓
     GET /api/abandoned-checkouts
         ↓
     [Returns stats & abandoned data]
         ↓
     Admin sends recovery email
         ↓
     User clicks recovery link
         ↓
     [Session restored from localStorage]
         ↓
     User completes checkout
```

### 6.3 Promo Code Application

```
User enters promo code in form
   ↓
POST /api/promo-codes/validate
   ↓
Validation checks:
   ├─ Code exists?
   ├─ Code active?
   ├─ Validity period?
   ├─ Usage limits?
   ├─ Per-user limits?
   ├─ Min order amount?
   └─ Package applicable?
   ↓
Calculate discount:
   ├─ If percentage: (amount * value / 100)
   ├─ Cap at maxDiscountAmount
   └─ Can't exceed order amount
   ↓
Return discount amount
   ↓
Update order total = original - discount
   ↓
Show savings to user
   ↓
[Discount stored in checkout data]
   ↓
Submit with order on payment
```

---

## 7. SECURITY FEATURES

### 7.1 Authentication & Authorization

| Feature | Implementation |
|---------|-----------------|
| **Checkout Tokens** | One-time, 30-min expiry, email-locked tokens |
| **Session Security** | SessionStorage for session IDs, httpOnly cookies for JWT |
| **Password Hashing** | bcrypt with salt rounds |
| **Input Validation** | Email, phone, password regex + business logic |
| **Input Sanitization** | XSS protection, SQL injection prevention |
| **CORS Headers** | Proper CORS configuration |
| **CSP Headers** | Content Security Policy |
| **Rate Limiting** | Applied to auth endpoints |

### 7.2 Data Protection

| Feature | Implementation |
|---------|-----------------|
| **Encryption** | TLS/SSL for transit, bcrypt for passwords |
| **Data Expiry** | Checkout data expires in 7 days |
| **Token Cleanup** | Automatic cleanup of expired tokens |
| **PII Protection** | SSN stored encrypted, visible only to authorized users |
| **Document Storage** | Secure Blob storage with access controls |

### 7.3 Access Control

| Endpoint | Access |
|----------|--------|
| `/checkout` | Public (no auth required) |
| `/api/checkout/token` | Public |
| `/api/auth/signup` | Public (token-gated) |
| `/api/promo-codes/validate` | Public |
| `/api/abandoned-checkouts` POST | Public (silent tracking) |
| `/api/abandoned-checkouts` GET | Admin only |

---

## 8. ERROR HANDLING

### 8.1 Client-Side Errors

```typescript
// Step validation errors
if (!data.email || !data.password) {
  setError("Email and password are required")
  return false
}

// Network errors
try {
  const response = await fetch('/api/...')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
} catch (error) {
  toast.error("Network error occurred")
}

// File upload errors
if (file.size > MAX_SIZE) {
  setError("File too large")
}
```

### 8.2 Server-Side Errors

```typescript
// Validation errors (400)
return apiError("Invalid email address", 400)

// Auth errors (401/403)
return apiError("Unauthorized", 401)
return apiError("Forbidden", 403)

// Not found (404)
return apiError("Promo code not found", 404)

// Conflict (409)
return apiError("Email already exists", 409)

// Server errors (500)
return apiError("Internal server error", 500)
```

---

## 9. PERFORMANCE OPTIMIZATIONS

### 9.1 Client-Side

- **localStorage Caching** - Reduces API calls for form recovery
- **Debounced Tracking** - Abandoned checkout tracked every 2s (not on every keystroke)
- **Lazy Image Loading** - Images loaded on demand
- **Code Splitting** - Step components lazy-loaded
- **Memoization** - useCallback for event handlers

### 9.2 Server-Side

- **Database Indexes** - On frequently queried fields
- **Query Optimization** - Limit/pagination for large result sets
- **Connection Pooling** - MongoDB connection reuse
- **Caching** - Promo code data cached on client after first lookup
- **Cleanup Jobs** - Automatic token/abandoned checkout cleanup

---

## 10. MONITORING & ANALYTICS

### 10.1 Tracked Metrics

```javascript
Abandoned Checkouts Analytics:
- Total abandoned count
- Abandoned in last 24h
- Abandoned in last 7 days
- Drop-off by step (most abandoned step)
- Potential revenue lost
- Average order value from abandoned

Payment Tracking:
- Payment method distribution
- Failed payment rate
- Receipt upload success rate
- Average payment time
```

### 10.2 Error Logging

- Console errors captured with [v0] prefix
- Database write failures logged
- API validation errors tracked
- File upload errors tracked
- Auth failures logged with rate limiting

---

## 11. CONFIGURATION

### 11.1 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=buzzfiling

# Auth
JWT_SECRET=...
CHECKOUT_TOKEN_EXPIRY=30

# Storage
BLOB_READ_WRITE_TOKEN=...

# Email
SENDGRID_API_KEY=...
```

### 11.2 Constants

**File:** `/lib/constants.ts`

```typescript
STATE_FEES = {
  'CA': 150,
  'NY': 200,
  'TX': 75,
  // ... all US states
}

CHECKOUT_EXPIRY_DAYS = 7
TOKEN_EXPIRY_MINUTES = 30
ABANDONED_CHECKOUT_TRACKING_INTERVAL = 2000 // ms
```

---

## 12. TROUBLESHOOTING

### Issue: Checkout data lost
**Cause:** localStorage cleared or expired
**Solution:** Implement cloud backup or server-side session storage

### Issue: Payment fails
**Cause:** Receipt upload failed or timeout
**Solution:** Check file size limits and Blob storage quota

### Issue: High abandoned rate at Step X
**Cause:** Complex form, validation errors, or UX issue
**Solution:** Review error messages, simplify fields, add help text

### Issue: Promo code not applying
**Cause:** Code expired or usage limit reached
**Solution:** Check code validity and usage count in database

---

## 13. FUTURE ENHANCEMENTS

1. **Email Recovery** - Send recovery links to abandoned checkout emails
2. **Server-Side Sessions** - Move checkout data to server for security
3. **Payment Gateway Integration** - Stripe/PayPal for direct payment
4. **Multi-Currency Support** - Support international payments
5. **Analytics Dashboard** - Real-time checkout metrics
6. **A/B Testing** - Test different checkout flows
7. **Guest Checkout** - Allow checkout without account creation
8. **Progressive Saving** - Auto-save after each field change
9. **Mobile Optimization** - Responsive design improvements
10. **Accessibility** - WCAG 2.1 AA compliance

---

**Document Version:** 1.0
**Last Updated:** 2026-07-02
**Maintained By:** BuzzFiling Development Team
