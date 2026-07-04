# localStorage vs IndexedDB: Complete Storage Strategy Guide

## Overview

BuzzFiling currently uses **localStorage for checkout data persistence**. This guide explains why, when to use IndexedDB, and how to migrate if needed.

---

## Part 1: Current Implementation (localStorage)

### What's Stored?

```typescript
// File: lib/checkout-storage.ts
interface CheckoutData {
  account?: {
    email?: string
    phone?: string
    name?: string
    userId?: string
    // ❌ NOT STORED: password (kept in memory only)
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
  members?: any[] // Array of owner info
  orderId?: string
  createdAt?: string
  status?: string
  payment?: {
    method?: string
    status?: string
  }
  currentStep?: number
  savedAt?: string // Timestamp when saved
  expiresAt?: string // Expiry date (7 days from save)
}
```

### Size Analysis

**Typical Checkout Data:**
```
Account: ~150 bytes
  - email: 30 bytes
  - name: 30 bytes
  - phone: 20 bytes
  - userId: 25 bytes

State: ~80 bytes
  - state: 15 bytes
  - entityType: 10 bytes
  - packageType: 15 bytes

Business Info: ~200 bytes
  - businessName: 50 bytes
  - businessCategory: 30 bytes
  - businessDescription: 100 bytes

Members: ~500 bytes per member
  - name, email, phone, SSN, DOB

Total per user: ~1.5 KB (without members)
Total with 5 members: ~4 KB

localStorage limit: 5-10 MB (browser dependent)
Fits: ~1,000,000+ checkout sessions ✓
```

### Storage Duration

```typescript
// Data automatically expires after 7 days
const expiryDate = new Date()
expiryDate.setDate(expiryDate.getDate() + 7)
localStorage.setItem("checkoutData", JSON.stringify({
  ...data,
  expiresAt: expiryDate.toISOString()
}))

// On retrieval, check expiry
if (parsed.expiresAt) {
  const expiryDate = new Date(parsed.expiresAt)
  if (new Date() > expiryDate) {
    clearCheckoutData() // Auto-clear if expired
    return null
  }
}
```

### Key Functions

**Initialize:**
```typescript
const initCheckoutData = (): void => {
  if (!getCheckoutData()) {
    saveCheckoutData({})
  }
}
```

**Save:**
```typescript
const saveCheckoutData = (data: Partial<CheckoutData>): void => {
  const existing = getCheckoutData() || {}
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  
  localStorage.setItem("checkoutData", JSON.stringify({
    ...existing,
    ...data,
    savedAt: new Date().toISOString(),
    expiresAt: expiryDate.toISOString()
  }))
}
```

**Retrieve:**
```typescript
const getCheckoutData = (): CheckoutData | null => {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("checkoutData")
  if (!data) return null
  
  try {
    const parsed = JSON.parse(data)
    if (parsed.expiresAt && new Date() > new Date(parsed.expiresAt)) {
      clearCheckoutData()
      return null
    }
    return parsed
  } catch {
    return null
  }
}
```

**Clear:**
```typescript
const clearCheckoutData = (): void => {
  localStorage.removeItem("checkoutData")
}

const clearCompletedOrderData = (): void => {
  // Keep metadata, clear form data
  const existing = getCheckoutData()
  if (existing) {
    localStorage.setItem("checkoutData", JSON.stringify({
      savedAt: new Date().toISOString(),
      expiresAt: existing.expiresAt,
      currentStep: 0
    }))
  }
}
```

---

## Part 2: localStorage vs IndexedDB Comparison

| Feature | localStorage | IndexedDB |
|---------|-------------|-----------|
| **Storage Limit** | 5-10 MB | 50 MB - unlimited |
| **Data Types** | Strings only | Objects, Arrays, Files |
| **Performance** | Synchronous (fast) | Asynchronous (slower) |
| **Query Ability** | No | Yes (search, filter, sort) |
| **Transactions** | No | Yes (atomic operations) |
| **Browser Support** | All | All modern |
| **Clearing** | Manual or on clear cache | Manual or on clear cache |
| **Cross-Tab** | Yes (storage event) | No native sync |
| **Use Case** | Small, simple data | Large, complex data |

---

## Part 3: When to Use What

### Use localStorage When:

✓ Storing < 1 MB of data
✓ Simple key-value structure (no arrays/objects)
✓ Need synchronous access
✓ Short-term storage (< 30 days)
✓ Simple data like form state, preferences
✓ Don't need querying

**BuzzFiling Example:**
- Checkout form data (name, email, phone, address)
- Current step in checkout
- Preferences (dark mode, language)
- Session metadata (timestamps)

### Use IndexedDB When:

✓ Storing > 5 MB of data
✓ Complex nested objects/arrays
✓ Need to query data efficiently
✓ Need transactions (all-or-nothing operations)
✓ Long-term storage (> 30 days)
✓ Offline support with syncing
✓ Multiple data stores

**Example Use Cases:**
- Caching entire product catalogs
- Offline document editing
- Complex multi-step forms with nested data
- Analytics/tracking event history

---

## Part 4: Current Flow in Detail

### Step 1: Initialization

```typescript
// When checkout page loads
useEffect(() => {
  const data = getCheckoutData()
  
  if (data) {
    // Data exists and is not expired
    setFormData(data.account)
    setStep(data.currentStep)
  } else {
    // First time or data expired
    initCheckoutData()
    setStep(0)
  }
}, [])
```

### Step 2: User Fills Account Form

```typescript
const handleAccountSubmit = (formData) => {
  // Validate
  if (!formData.email || !formData.password) {
    return // Show error
  }
  
  // Save to localStorage (NOT password!)
  saveCheckoutData({
    account: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      // password is stored in component state only
    }
  })
  
  // Save current step
  saveCheckoutStep(1)
  
  // Proceed
  onNext()
}
```

### Step 3: User Navigates Away

```typescript
// Page unload - data persists in localStorage
window.addEventListener('beforeunload', () => {
  // Don't need to do anything, already in localStorage
})

// User comes back - data is restored
useEffect(() => {
  const data = getCheckoutData()
  setFormData(data?.account || {})
  setStep(data?.currentStep || 0)
}, [])
```

### Step 4: User Completes Signup

```typescript
const handleSignup = async (password) => {
  const data = getCheckoutData()
  
  // Generate checkout token
  const tokenRes = await fetch('/api/checkout/token', {
    method: 'POST',
    body: JSON.stringify({ email: data.account.email })
  })
  const { checkoutToken } = await tokenRes.json()
  
  // Signup with token
  const signupRes = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: data.account.name,
      email: data.account.email,
      phone: data.account.phone,
      password, // From form submission only
      checkoutToken
    })
  })
  
  if (signupRes.ok) {
    // Clear localStorage
    clearCompletedOrderData()
    // Redirect to dashboard
    router.push('/dashboard')
  }
}
```

### Step 5: Data Expiry

```typescript
// Every 7 days, old data is removed
// Check happens on getCheckoutData() call
const getCheckoutData = (): CheckoutData | null => {
  const data = localStorage.getItem("checkoutData")
  const parsed = JSON.parse(data)
  
  if (parsed.expiresAt) {
    const expiryDate = new Date(parsed.expiresAt)
    const now = new Date()
    
    if (now > expiryDate) {
      // ⏰ Data is expired
      localStorage.removeItem("checkoutData")
      return null
    }
  }
  
  return parsed
}
```

---

## Part 5: Security Considerations

### What's Safe to Store in localStorage?

✅ **SAFE:**
- User email
- User name
- Phone number
- Addresses
- Business names
- Form field values
- UI state (current step, open/closed modals)
- Non-sensitive metadata

❌ **NEVER STORE:**
- Passwords
- JWT tokens
- API keys
- Private keys
- Social Security Numbers
- Credit card numbers
- Bank account numbers
- Session tokens

### Current Security Implementation

```typescript
// ✅ CORRECT: Password in memory, not localStorage
const [password, setPassword] = useState("")

const handleSubmit = () => {
  // Password never leaves component state
  saveCheckoutData({
    account: {
      name,
      email,
      phone
      // ❌ password NOT included
    }
  })
  
  // Password only sent in API request
  fetch('/api/auth/signup', {
    body: JSON.stringify({
      password, // From component state
      checkoutToken
    })
  })
}

// ✅ CORRECT: Password passed to API only
const signupUser = async (password: string) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: checkoutData.account.name,
      email: checkoutData.account.email,
      password, // Only sent to server
      checkoutToken
    })
  })
  
  // Password never stored, never logged, never in localStorage
}
```

---

## Part 6: Error Handling

### Quota Exceeded

```typescript
const saveCheckoutData = (data: Partial<CheckoutData>): void => {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)
    
    localStorage.setItem("checkoutData", JSON.stringify({
      ...data,
      expiresAt: expiryDate.toISOString()
    }))
  } catch (e) {
    if (e instanceof DOMException && e.code === 22) {
      // QuotaExceededError: localStorage is full
      console.error("Storage quota exceeded")
      // Clear old data
      clearCompletedOrderData()
      // Retry save
    }
  }
}
```

### Invalid JSON

```typescript
const getCheckoutData = (): CheckoutData | null => {
  try {
    const data = localStorage.getItem("checkoutData")
    if (!data) return null
    
    const parsed = JSON.parse(data) // Can throw SyntaxError
    return parsed
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Corrupted data, clear it
      localStorage.removeItem("checkoutData")
      return null
    }
    throw e
  }
}
```

### Server-Side Errors

```typescript
const saveProgress = (): { success: boolean; message: string } => {
  try {
    const data = getCheckoutData()
    if (!data) {
      return { success: false, message: "No checkout data found" }
    }
    
    // Re-save to update expiry
    saveCheckoutData(data)
    
    return {
      success: true,
      message: "Progress saved! Data available for 7 days."
    }
  } catch (e) {
    console.error("[v0] Save progress failed:", e)
    return { success: false, message: "Failed to save progress" }
  }
}
```

---

## Part 7: Migrating to IndexedDB (If Needed)

### When to Migrate

You should migrate to IndexedDB if:
- Checkout data grows beyond 1 MB
- You need to store file references
- You need complex queries
- You want offline sync support

### Migration Strategy

**Step 1: Create IndexedDB Helper**

```typescript
// lib/checkout-idb.ts
import Dexie, { Table } from 'dexie'

interface CheckoutRecord {
  id?: number
  email: string
  data: CheckoutData
  createdAt: Date
  expiresAt: Date
}

export class CheckoutDatabase extends Dexie {
  checkouts!: Table<CheckoutRecord>
  
  constructor() {
    super('buzzfiling-checkout')
    this.version(1).stores({
      checkouts: '&email, expiresAt'
    })
  }
}

export const db = new CheckoutDatabase()
```

**Step 2: Create API**

```typescript
// lib/checkout-idb-storage.ts
export const getCheckoutData = async (email: string): Promise<CheckoutData | null> => {
  const record = await db.checkouts.get(email)
  
  if (!record) return null
  
  if (new Date() > record.expiresAt) {
    await db.checkouts.delete(email)
    return null
  }
  
  return record.data
}

export const saveCheckoutData = async (email: string, data: Partial<CheckoutData>) => {
  const existing = await getCheckoutData(email) || {}
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  
  await db.checkouts.put({
    email,
    data: { ...existing, ...data },
    createdAt: new Date(),
    expiresAt: expiryDate
  })
}

export const clearExpiredData = async () => {
  const now = new Date()
  await db.checkouts.where('expiresAt').below(now).delete()
}
```

**Step 3: Use in Components**

```typescript
// Exactly the same API, just async now
const { data, saveData } = useCheckout()

const handleSubmit = async (formData) => {
  // Same as before, just await the save
  await saveData({
    account: { name: formData.name, email: formData.email }
  })
  
  onNext()
}
```

---

## Summary

**Current BuzzFiling Strategy:**
- Uses localStorage for checkout form data
- 7-day auto-expiry
- ~1.5-4 KB per checkout session
- Passwords never stored
- Tokens invalidated after one use
- Perfect for current scale

**Why localStorage Works:**
- Small data size
- Simple structure
- Fast synchronous access
- No complex queries needed

**Future Consideration:**
- If checkout forms become more complex or data size increases
- Consider migrating to IndexedDB
- Migration is backward compatible
- Can use both simultaneously during transition
