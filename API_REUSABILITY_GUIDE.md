# BuzzFiling API Reusability Guide
## How to Apply Existing APIs to Another Project

### Table of Contents
1. Available APIs & Their Purposes
2. localStorage/IndexedDB Strategy
3. How Data Flows in Checkout
4. Applying APIs to Another Project
5. Implementation Checklist

---

## Part 1: Available APIs & Their Purposes

### 1. Checkout Token API
**Endpoint:** `POST /api/checkout/token`

**Purpose:** Generate a one-time-use secure token for checkout sessions

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "checkoutToken": "secure_hex_token_64_chars",
  "message": "Checkout session created"
}
```

**Use Cases:**
- Initialize a new checkout session
- Prevent direct API calls without proper checkout flow
- Tie session to a specific email address
- Enforce 30-minute expiry windows

**How to Reuse:**
```typescript
// In your project's checkout flow
const initCheckout = async (email: string) => {
  const response = await fetch('/api/checkout/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  const { checkoutToken } = await response.json()
  return checkoutToken
}
```

---

### 2. Signup API
**Endpoint:** `POST /api/auth/signup`

**Purpose:** Create a user account with checkout token verification

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "checkoutToken": "token_from_checkout_api"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_auth_token",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

**Security Features:**
- Requires valid checkout token
- Token is one-time use (invalidated after signup)
- Password hashing with bcrypt
- Email validation
- Phone validation
- Input sanitization

**How to Reuse:**
```typescript
// After collecting account data in checkout
const signupUser = async (formData, checkoutToken) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      checkoutToken
    })
  })
  return response.json()
}
```

---

### 3. Document Upload API
**Endpoint:** `POST /api/documents`

**Purpose:** Upload and store files with metadata

**Request (FormData):**
```typescript
const formData = new FormData()
formData.append('files', fileObject)
formData.append('companyId', 'company_id')
formData.append('category', 'tax_document')
```

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_id",
      "title": "Tax Return",
      "fileUrl": "blob_storage_url",
      "fileSize": 1024000,
      "uploadedAt": "2026-07-05T10:00:00Z"
    }
  ]
}
```

**Features:**
- Multi-file upload support
- Blob storage integration
- File size limits
- Security headers
- Token-based auth

**How to Reuse:**
```typescript
const uploadDocuments = async (files: File[], companyId: string, token: string) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('companyId', companyId)
  
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
  return response.json()
}
```

---

### 4. Addon Purchase API
**Endpoint:** `POST /api/addons/purchase`

**Purpose:** Purchase add-ons with optional receipt file upload

**Request (FormData):**
```typescript
const formData = new FormData()
formData.append('addonId', 'addon_id')
formData.append('companyId', 'company_id')
formData.append('phoneNumber', '+1234567890')
formData.append('receiptFile', fileObject) // optional
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_id",
  "addonId": "addon_id",
  "companyId": "company_id",
  "cost": 49.99,
  "purchasedAt": "2026-07-05T10:00:00Z"
}
```

**Features:**
- ObjectId validation
- Optional file upload
- Company ownership verification
- Payment tracking
- Real-time updates via broadcaster

---

## Part 2: localStorage/IndexedDB Strategy

### Current Implementation: localStorage Only

**File:** `/lib/checkout-storage.ts`

**Data Structure:**
```typescript
interface CheckoutData {
  account?: {
    email?: string
    password?: string
    phone?: string
    name?: string
    userId?: string
  }
  state?: {
    state?: string
    entityType?: "llc" | "s-corp"
    packageType?: "starter" | "advanced"
  }
  businessInfo?: {
    businessName?: string
    businessCategory?: string
    businessDescription?: string
    needsResellerCertificate?: boolean
  }
  members?: any[]
  orderId?: string
  createdAt?: string
  status?: string
  payment?: {
    method?: string
    status?: string
  }
  currentStep?: number
  savedAt?: string
  expiresAt?: string
}
```

### Storage Functions

**1. Get Checkout Data**
```typescript
const getCheckoutData = (): CheckoutData | null => {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("checkoutData")
  if (!data) return null
  
  try {
    const parsed = JSON.parse(data)
    
    // Check expiration (7 days)
    if (parsed.expiresAt) {
      const expiryDate = new Date(parsed.expiresAt)
      if (new Date() > expiryDate) {
        clearCheckoutData()
        return null
      }
    }
    
    return parsed
  } catch {
    return null
  }
}
```

**2. Save Checkout Data**
```typescript
const saveCheckoutData = (data: Partial<CheckoutData>): void => {
  if (typeof window === "undefined") return
  const existing = getCheckoutData() || {}
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // 7 days
  
  localStorage.setItem("checkoutData", JSON.stringify({ 
    ...existing, 
    ...data,
    savedAt: new Date().toISOString(),
    expiresAt: expiryDate.toISOString()
  }))
}
```

**3. Save Specific Step**
```typescript
const saveCheckoutStep = (step: number): void => {
  const existing = getCheckoutData() || {}
  saveCheckoutData({ ...existing, currentStep: step })
}
```

**4. Clear Data**
```typescript
const clearCheckoutData = (): void => {
  localStorage.removeItem("checkoutData")
}
```

### Why localStorage?

✓ **Pros:**
- Simple, no setup required
- Synchronous access (no await)
- Perfect for small data (< 10MB limit)
- Works offline
- No performance overhead

✗ **Cons:**
- Single browser/device
- Lost on browser clear
- String-only values
- 7-day auto-expiry needs manual implementation

---

## Part 3: How Data Flows in Checkout

### Complete Flow Diagram

```
1. USER STARTS CHECKOUT
   ↓
2. POST /api/checkout/token { email }
   ↓
   Response: { checkoutToken: "..." }
   ↓
3. STORE IN LOCALSTORAGE
   localStorage.setItem("checkoutData", { 
     account: { email },
     currentStep: 1,
     expiresAt: +7 days
   })
   ↓
4. STEP 1: ACCOUNT CREATION
   - User fills: name, email, phone, password
   - saveCheckoutData({ account: { name, email, phone } })
   - Password NOT stored (security)
   ↓
5. STEP 2: STATE & PACKAGE
   - User selects state and package
   - saveCheckoutData({ state: { state, entityType, packageType } })
   ↓
6. STEP 3: BUSINESS INFO
   - User enters business details
   - saveCheckoutData({ businessInfo: { ... } })
   ↓
7. STEP 4: OWNER INFO
   - User uploads documents
   - saveCheckoutData({ members: [...] })
   ↓
8. STEP 5: REVIEW
   - Display all saved data
   - User confirms everything
   ↓
9. STEP 6: PAYMENT
   - Process payment
   - POST /api/auth/signup with checkoutToken
   ↓
10. SERVER VALIDATION
    - Verify checkoutToken (must be valid, not expired, not used)
    - Create user in database
    - Invalidate checkoutToken (one-time use)
    ↓
11. RESPONSE
    - { success: true, token: "jwt", user: {...} }
    - Clear localStorage
    - Redirect to dashboard
```

### Data Persistence Points

```
Step 1 (Account)
└─ localStorage saves: account.name, account.email
   (password saved in memory only, NOT in localStorage)

Step 2 (State)
└─ localStorage saves: state.state, state.entityType, state.packageType

Step 3 (Business)
└─ localStorage saves: businessInfo.businessName, etc.

Step 4 (Owner)
└─ localStorage saves: members[] with document URLs

Step 5 (Review)
└─ localStorage already has all data
   Read and display

Step 6 (Payment)
└─ POST /api/auth/signup with checkoutToken
└─ Server validates token
└─ Server creates user
└─ Server invalidates token
└─ Client clears localStorage
```

### Example: Saving Step Data

```typescript
// In account-step.tsx
const handleAccountSubmit = (formData) => {
  // Validate locally
  if (!formData.email || !formData.password) {
    setError("All fields required")
    return
  }
  
  // Save to localStorage (but NOT password)
  saveCheckoutData({
    account: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      userId: null // Will be set after signup
    }
  })
  
  // Save current step
  saveCheckoutStep(1)
  
  // Proceed to next step
  onStepComplete(1)
}
```

---

## Part 4: Applying APIs to Another Project

### Step-by-Step Implementation

### Phase 1: Copy Core Files

**Copy these files to your new project:**

```
src/lib/
├── checkout-storage.ts      (Data persistence)
├── checkout-token.ts        (Token generation)
├── validation.ts            (Input validation)
├── api-middleware.ts        (Response formatting)
└── jwt.ts                   (Token handling)

src/app/api/
├── checkout/
│   └── token/route.ts       (Checkout initialization)
├── auth/
│   └── signup/route.ts      (User creation)
├── documents/
│   └── route.ts             (File uploads)
└── addons/
    └── purchase/route.ts    (Add-on purchases)
```

### Phase 2: Update Configuration

**Update your database connection:**

```typescript
// config/database.ts
import { MongoClient, Db } from "mongodb"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb
  
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  
  cachedClient = client
  cachedDb = client.db(process.env.DB_NAME || "buzzfiling")
  
  return cachedDb
}
```

**Update your environment variables:**

```env
# .env.local
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
DB_NAME=your_database_name
JWT_SECRET=your_secret_key_32_chars_min
NEXTAUTH_SECRET=another_secret_key
VERCEL_BLOB_TOKEN=your_blob_token
```

### Phase 3: Create Collections

**MongoDB Collections to Create:**

```javascript
// checkout_tokens collection
db.createCollection("checkout_tokens", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      properties: {
        token: { bsonType: "string" },
        email: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" },
        used: { bsonType: "bool" },
        usedAt: { bsonType: "date" }
      }
    }
  }
})

// Create indexes
db.checkout_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.checkout_tokens.createIndex({ email: 1 })
db.checkout_tokens.createIndex({ token: 1 })
```

### Phase 4: Integrate into Frontend

**Create a checkout hook:**

```typescript
// hooks/useCheckout.ts
import { useCallback, useEffect, useState } from 'react'
import { CheckoutData, getCheckoutData, saveCheckoutData, saveCheckoutStep } from '@/lib/checkout-storage'

export function useCheckout() {
  const [data, setData] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(true)

  // Load from localStorage
  useEffect(() => {
    const stored = getCheckoutData()
    setData(stored)
    setLoading(false)
  }, [])

  // Save data
  const saveData = useCallback((partialData: Partial<CheckoutData>) => {
    saveCheckoutData(partialData)
    setData(prev => prev ? { ...prev, ...partialData } : partialData)
  }, [])

  // Save step
  const goToStep = useCallback((step: number) => {
    saveCheckoutStep(step)
    setData(prev => prev ? { ...prev, currentStep: step } : { currentStep: step })
  }, [])

  return { data, loading, saveData, goToStep }
}
```

**Use in your component:**

```typescript
// components/CheckoutFlow.tsx
import { useCheckout } from '@/hooks/useCheckout'

export function CheckoutFlow() {
  const { data, saveData, goToStep } = useCheckout()
  const [step, setStep] = useState(data?.currentStep || 0)

  const handleAccountSubmit = async (formData) => {
    // Validate
    if (!formData.email) {
      setError("Email required")
      return
    }

    // Save to localStorage
    saveData({
      account: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
    })

    // Move to next step
    goToStep(1)
    setStep(1)
  }

  return (
    <div>
      {step === 0 && <AccountStep onSubmit={handleAccountSubmit} />}
      {step === 1 && <StateStep onSubmit={(stateData) => {
        saveData({ state: stateData })
        goToStep(2)
        setStep(2)
      }} />}
    </div>
  )
}
```

### Phase 5: Security Considerations

**DON'T store in localStorage:**
- Passwords (store in memory only)
- JWT tokens (use httpOnly cookies instead)
- Sensitive PII (SSN, dates of birth, etc.)

**DO store in localStorage:**
- User-entered form data (email, name, phone)
- Session identifiers
- UI state (current step, preferences)
- Metadata (timestamps, expiry dates)

**DO store on server:**
- Passwords (hashed with bcrypt)
- JWT tokens (in httpOnly cookies)
- Financial information
- Sensitive documents

---

## Part 5: Implementation Checklist

### Before Going Live

- [ ] Database is configured and collections created
- [ ] Environment variables are set (.env.local)
- [ ] JWT secret is 32+ characters
- [ ] CORS is configured properly
- [ ] Email service is connected
- [ ] Blob storage is configured
- [ ] Security headers are in place

### Testing Checklist

**Checkout Flow:**
- [ ] Token generation works
- [ ] localStorage saves step data
- [ ] Step navigation preserves data
- [ ] Data expires after 7 days
- [ ] Page refresh retains data
- [ ] Clear on signup works

**Signup API:**
- [ ] Email validation works
- [ ] Password validation works
- [ ] Checkout token validation works
- [ ] Duplicate email prevention works
- [ ] Welcome email sends

**Data Integrity:**
- [ ] Sensitive data not in localStorage
- [ ] Passwords never logged
- [ ] Tokens invalidated after use
- [ ] Old sessions cleaned up

---

## Summary

**Key Takeaways:**

1. **Checkout Token** - Secure, one-time, 30-minute session initialization
2. **Signup API** - User creation with token verification
3. **Document Upload** - File storage with metadata
4. **Addon Purchase** - Payment tracking with receipts
5. **localStorage** - 7-day data persistence on client
6. **Security** - Tokens, validation, sanitization, expiry

All APIs follow RESTful conventions and include proper error handling, validation, and security headers.
