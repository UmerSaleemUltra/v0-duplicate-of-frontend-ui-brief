# Checkout System - Quick Start Guide

## System Summary

The BuzzFiling checkout system is a **6-step multi-part form** that guides users through business entity registration. It combines client-side data persistence with server-side validation and security checks.

```
🔐 Security Layer
├─ Checkout Tokens (one-time, 30-min)
├─ Session Validation
├─ Input Sanitization
└─ Rate Limiting

📝 6-Step Form Flow
├─ Account (Email, Password, Phone, Name)
├─ State & Package (State, Entity Type, Package)
├─ Business Info (Name, Address, Category)
├─ Owner Info (Members, SSN, ITIN Uploads)
├─ Review (Verify all details)
└─ Payment (Payment method, Receipt)

💾 Data Storage
├─ Client: localStorage (7-day expiry)
├─ Server: MongoDB (Orders, Users)
└─ Files: Blob Storage (ITIN, Receipts)

📊 Analytics
├─ Abandoned Checkout Tracking
├─ Conversion Metrics
└─ Revenue Analytics
```

---

## Key Files & Directories

### Frontend Components
```
app/checkout/
├── page.tsx                 (Main page, state management)
└── layout.tsx              (Layout wrapper)

components/checkout/
├── checkout-shell.tsx       (Layout shell, abandoned tracking)
├── account-step.tsx         (Step 0)
├── state-package-step.tsx   (Step 1)
├── business-info-step.tsx   (Step 2)
├── owner-info-step.tsx      (Step 3)
├── review-step.tsx          (Step 4)
└── payment-step.tsx         (Step 5)
```

### Backend APIs
```
app/api/
├── checkout/
│   └── token/route.ts      (Generate checkout token)
├── auth/
│   ├── signup/route.ts     (Create account + order)
│   └── me/route.ts         (Get current user)
├── promo-codes/
│   └── validate/route.ts   (Validate promo codes)
├── abandoned-checkouts/
│   └── route.ts            (Track & retrieve abandoned)
└── companies/
    ├── route.ts            (Create company)
    └── [id]/
        └── orders/route.ts (Create order)
```

### Utilities & Libraries
```
lib/
├── checkout-storage.ts      (localStorage management)
├── checkout-token.ts        (Token generation/validation)
├── auth.ts                  (Auth service)
├── api-client.ts           (API calls)
├── validation.ts           (Input validation)
└── constants.ts            (Pricing, states)
```

---

## API Flow Diagram

```
START
  │
  ├─→ POST /api/checkout/token
  │   └─→ Generates 64-char hex token (30-min expiry)
  │
  ├─→ User fills 6-form steps
  │   └─→ All data saved to localStorage
  │
  ├─→ POST /api/abandoned-checkouts (every 2s, debounced)
  │   └─→ Tracks progress for recovery
  │
  ├─→ POST /api/promo-codes/validate (if user enters code)
  │   └─→ Validates code, calculates discount
  │
  ├─→ POST /api/auth/signup (with checkout token)
  │   ├─→ Validates token (one-time use)
  │   ├─→ Creates user account
  │   ├─→ Invalidates token
  │   └─→ Returns JWT token
  │
  ├─→ POST /api/companies (create company record)
  │
  ├─→ POST /api/companies/[id]/orders (create order)
  │
  ├─→ Clear localStorage
  │
  └─→ Redirect to success page
```

---

## Data Flow Summary

### What Gets Saved Where?

| Data | Storage | Lifetime | Scope |
|------|---------|----------|-------|
| **Checkout Form** | localStorage | 7 days | Current user |
| **Session ID** | sessionStorage | Browser session | Tracking only |
| **User Account** | MongoDB | Permanent | User record |
| **Checkout Token** | MongoDB | 30 minutes | One-time use |
| **Order Data** | MongoDB | Permanent | Order record |
| **ITIN/Receipt Files** | Blob Storage | Permanent | File URLs |
| **Abandoned Checkout** | MongoDB | 30 days | Analytics |
| **JWT Token** | localStorage (client) | Browser session | Authentication |

### Checkout State Structure

```typescript
{
  // Step 0: Account
  email: "user@example.com"
  password: "SecurePass123!"
  phone: "+1-234-567-8900"
  name: "John Doe"
  
  // Step 1: State & Package
  state: "CA"
  entityType: "llc"
  packageType: "advanced"
  
  // Step 2: Business Info
  businessName: "Acme Corp"
  businessCategory: "Technology"
  businessDescription: "Software Development"
  needsResellerCertificate: false
  
  // Step 3: Owner Info
  members: [
    {
      id: "uuid",
      firstName: "John"
      lastName: "Doe"
      email: "john@acme.com"
      ssn: "***-**-1234" (encrypted)
      dateOfBirth: "1990-01-01"
      isResponsiblePerson: true
      needsItin: true
      itinAdded: true
      passportUrl: "https://blob-storage/..."
    }
  ]
  
  // Step 4: Review
  // (all above data in one view)
  
  // Step 5: Payment
  paymentMethod: "bank_transfer"
  receiptUrl: "https://blob-storage/..."
  
  // Pricing
  packagePrice: 299
  stateFilingFee: 75
  addonsTotal: 100
  totalAmount: 474
  
  // Promo Code (optional)
  promoCode: {
    code: "SUMMER20"
    discountType: "percentage"
    discountValue: 20
    discountAmount: 94.80
  }
}
```

---

## Security Layer

### Three-Layer Security

**Layer 1: Checkout Tokens**
- One-time use tokens
- 30-minute expiry
- Email-locked
- Prevents direct signup API access

**Layer 2: Session Management**
- JWT tokens for authentication
- httpOnly cookies (where applicable)
- Session validation on sensitive endpoints
- Rate limiting on auth endpoints

**Layer 3: Data Protection**
- Password bcrypt hashing
- Input sanitization (XSS, SQLi prevention)
- Email validation (RFC 5322)
- CORS headers
- CSP headers

### Token Lifecycle

```
1. User starts checkout
   ↓
2. POST /api/checkout/token
   ├─→ Generate 64-char hex token
   ├─→ Set 30-minute expiry
   └─→ Store in MongoDB
   ↓
3. Token in memory (sent to signup step)
   ↓
4. User completes checkout
   ├─→ POST /api/auth/signup with token
   └─→ Token validated
   ↓
5. Token invalidated (marked used)
   ├─→ Can't reuse same token
   └─→ Auto-cleanup after 1 hour
```

---

## Common Operations

### Check if User Can Resume Checkout

```typescript
// lib/checkout-storage.ts
const savedData = getCheckoutData()
const lastStep = getSavedStep()

if (savedData && lastStep !== null) {
  // Resume from last step
  router.push('/checkout')
}
```

### Apply Promo Code

```typescript
// Step 5: Payment
const validatePromo = async (code: string) => {
  const response = await fetch('/api/promo-codes/validate', {
    method: 'POST',
    body: JSON.stringify({
      code,
      orderAmount: totalAmount,
      packageType,
      email
    })
  })
  
  if (response.ok) {
    const { discountAmount } = await response.json()
    setTotalAmount(totalAmount - discountAmount)
  }
}
```

### Upload ITIN Document

```typescript
// Step 3: Owner Info
const uploadITIN = async (file: File, memberId: string) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/passports', {
    method: 'POST',
    body: formData
  })
  
  const { url, key } = await response.json()
  
  // Update member
  const updatedMembers = members.map(m =>
    m.id === memberId 
      ? { ...m, passportUrl: url, passportKey: key }
      : m
  )
}
```

### Submit Order

```typescript
// Step 5: Payment - submit form
const submitOrder = async () => {
  // 1. Create user account
  const signupResponse = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name, email, phone, password,
      checkoutToken
    })
  })
  
  const { token, user } = await signupResponse.json()
  
  // 2. Create company
  const companyResponse = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  
  const company = await companyResponse.json()
  
  // 3. Create order
  const orderResponse = await fetch(
    `/api/companies/${company.id}/orders`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    }
  )
  
  // 4. Clear checkout & redirect
  clearCheckoutData()
  router.push('/checkout/success')
}
```

---

## Debugging Tips

### Check Saved Data
```typescript
// Console
const savedData = JSON.parse(localStorage.getItem('checkoutData'))
console.log(savedData)

// Check expiry
const expiry = new Date(savedData.expiresAt)
console.log('Expires:', expiry, expiry > new Date() ? 'Valid' : 'Expired')
```

### Check Token Validity
```typescript
// Backend MongoDB
db.checkout_tokens.findOne({ token: "..." })
// Shows: { token, email, createdAt, expiresAt, used, usedAt }
```

### Check Abandoned Checkouts
```typescript
// Backend MongoDB
db.abandoned_checkouts.findOne({ sessionId: "sess_..." })
// Shows: all tracking data
```

### Monitor API Calls
```typescript
// DevTools Network tab
// Filter by /api/
// Check request/response
// Look for 400/403/500 errors
```

---

## Performance Metrics

### Page Load
- **Checkout Page Load:** ~500ms (including data restore)
- **Step Navigation:** ~100ms (client-side only)

### API Calls
| Endpoint | Avg Response | Notes |
|----------|-------------|-------|
| /api/checkout/token | 150ms | Database write |
| /api/auth/signup | 300ms | Hash password |
| /api/promo-codes/validate | 100ms | Database lookup |
| /api/abandoned-checkouts POST | 50ms | Silent tracking |
| /api/abandoned-checkouts GET | 200ms | Admin query |

### Storage
- **localStorage Size:** ~50KB (typical)
- **SessionStorage Size:** ~1KB (session ID only)
- **Files Upload:** Max 10MB per file

---

## Troubleshooting

### Checkout Data Lost
```
Symptom: User sees blank form after refresh
Cause: localStorage cleared or expired
Fix: Check expiry date, increase TTL if needed
```

### Payment Fails
```
Symptom: Can't submit payment
Cause: Receipt upload timeout or file too large
Fix: Check file size, increase timeout, retry
```

### Promo Code Doesn't Apply
```
Symptom: Valid code shows error
Cause: Code expired, usage limit hit, or version mismatch
Fix: Check database, verify validity period
```

### High Abandonment Rate
```
Symptom: Many users abandon at specific step
Cause: Complex form, validation errors, UX confusion
Fix: Review errors, simplify fields, add help text
```

---

## Monitoring Checklist

- [ ] Track API error rates
- [ ] Monitor checkout completion rate
- [ ] Watch abandoned checkout metrics
- [ ] Check password reset flows
- [ ] Verify promo code usage
- [ ] Test file upload speeds
- [ ] Monitor rate limit hits
- [ ] Check database query times
- [ ] Validate SSL certificate
- [ ] Test email deliverability

---

## Related Documentation

- **Full Documentation:** `/CHECKOUT_DOCUMENTATION.md`
- **API Reference:** `/CHECKOUT_API_REFERENCE.md`
- **Database Schema:** See CHECKOUT_DOCUMENTATION.md Section 4

---

**Quick Start Version:** 1.0
**Last Updated:** 2026-07-02
