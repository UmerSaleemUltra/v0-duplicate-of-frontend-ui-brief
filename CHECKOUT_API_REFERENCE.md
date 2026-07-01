# Checkout System - API Reference Guide

## Quick API Overview

### Public APIs (No Authentication Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/token` | POST | Generate checkout session token |
| `/api/auth/signup` | POST | Create user account (token-gated) |
| `/api/promo-codes/validate` | POST | Validate promo code |
| `/api/abandoned-checkouts` | POST | Track abandoned checkout |

### Admin-Only APIs (Requires Admin Token)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/abandoned-checkouts` | GET | Retrieve abandoned checkouts |

---

## Detailed API Specifications

### 1. POST /api/checkout/token
**Generate a Checkout Session Token**

**Purpose:** Initialize checkout session and prevent direct signup API access

**Request:**
```bash
curl -X POST https://buzzfiling.com/api/checkout/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Request Schema:**
```typescript
{
  email: string (required)  // User email address
}
```

**Response (201):**
```json
{
  "success": true,
  "checkoutToken": "a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6..."
}
```

**Error Responses:**
```json
// 400 - Missing email
{
  "error": "Email is required"
}

// 400 - Invalid email
{
  "error": "Invalid email address"
}

// 500 - Server error
{
  "error": "Failed to initialize checkout session"
}
```

**Security:**
- ✓ Email validation (RFC 5322)
- ✓ Rate limiting applied
- ✓ CORS headers included
- ✓ CSP headers included

**Token Details:**
- Format: 64-character hex string
- Expiry: 30 minutes
- One-time use only
- Email-locked (can't reuse for different email)

**Implementation:**
```typescript
// Frontend
const response = await fetch('/api/checkout/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail })
})

const { checkoutToken } = await response.json()
// Store checkoutToken in state for signup
```

---

### 2. POST /api/auth/signup
**Create User Account**

**Purpose:** Register new user account (requires valid checkout token)

**Request:**
```bash
curl -X POST https://buzzfiling.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "password": "SecurePass123!",
    "checkoutToken": "a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p..."
  }'
```

**Request Schema:**
```typescript
{
  name: string (required)              // Full name
  email: string (required)             // Email address
  phone: string (optional)             // Phone number
  password: string (required)          // Password
  checkoutToken: string (required)     // From /api/checkout/token
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "client"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNjI2OTgyMzI5LCJleHAiOjE2MjcwNjg3Mjl9.DkQhpfOoaGS3p6Kzf8kJzf8qzf8rz..."
}
```

**Error Responses:**
```json
// 400 - Missing fields
{
  "error": "Please provide your name, email, and password"
}

// 400 - Invalid email
{
  "error": "Please provide a valid email address"
}

// 400 - Weak password
{
  "error": "Password must contain uppercase, lowercase, number, and special character"
}

// 400 - Invalid phone
{
  "error": "Please provide a valid phone number"
}

// 403 - Missing token
{
  "error": "Invalid request. Please complete checkout to create an account."
}

// 403 - Invalid/expired token
{
  "error": "Invalid or expired checkout session. Please restart checkout."
}

// 409 - Email exists
{
  "error": "An account with this email already exists"
}

// 500 - Server error
{
  "error": "Failed to create account"
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| name | 1-100 characters, no XSS |
| email | RFC 5322 format, unique |
| phone | International format (optional) |
| password | Min 8 chars, 1 upper, 1 lower, 1 number, 1 special |

**Security:**
- ✓ Checkout token required and verified
- ✓ Token one-time use only
- ✓ Password bcrypt hashed (10 salt rounds)
- ✓ Email normalized (lowercase, trimmed)
- ✓ Input sanitization XSS prevention
- ✓ Rate limiting
- ✓ CORS headers
- ✓ CSP headers

**Implementation:**
```typescript
// Frontend
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-234-567-8900',
    password: 'SecurePass123!',
    checkoutToken: checkoutToken
  })
})

const { user, token } = await response.json()
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))
```

---

### 3. POST /api/promo-codes/validate
**Validate Promo Code**

**Purpose:** Check if promo code is valid and calculate discount

**Request:**
```bash
curl -X POST https://buzzfiling.com/api/promo-codes/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER20",
    "orderAmount": 499.99,
    "packageType": "advanced",
    "email": "user@example.com"
  }'
```

**Request Schema:**
```typescript
{
  code: string (required)              // Promo code
  orderAmount: number (optional)       // Total order amount
  packageType: string (optional)       // "starter" | "advanced" | "llc" | "s-corp"
  email: string (optional)             // User email for per-user limits
}
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "code": "SUMMER20",
  "description": "20% off all packages",
  "discountType": "percentage",
  "discountValue": 20,
  "discountAmount": 99.99,
  "maxDiscountAmount": 100,
  "minOrderAmount": 100,
  "applicableTo": "all"
}
```

**Error Responses:**
```json
// 400 - Missing code
{
  "error": "Promo code is required"
}

// 404 - Code not found
{
  "error": "Invalid promo code"
}

// 400 - Code inactive
{
  "error": "This promo code is no longer active"
}

// 400 - Not yet valid
{
  "error": "This promo code is not yet valid"
}

// 400 - Expired
{
  "error": "This promo code has expired"
}

// 400 - Usage limit reached
{
  "error": "This promo code has reached its usage limit"
}

// 400 - Per-user limit reached
{
  "error": "You have already used this promo code the maximum number of times"
}

// 400 - Minimum amount not met
{
  "error": "Minimum order amount of $100 required for this code"
}

// 400 - Wrong package
{
  "error": "This promo code is only valid for advanced package"
}

// 500 - Server error
{
  "error": "Failed to validate promo code"
}
```

**Validation Flow:**
```
Input: { code, orderAmount, packageType, email }
  ↓
1. Code exists? → No → 404
  ↓ Yes
2. Is active? → No → 400
  ↓ Yes
3. Within validity period? → No → 400 (not yet / expired)
  ↓ Yes
4. Usage limit? → No → 400
  ↓ Yes
5. Per-user limit? → No → 400
  ↓ Yes
6. Min order amount? → No → 400
  ↓ Yes
7. Package applicable? → No → 400
  ↓ Yes
Calculate discount
  ↓
Return result
```

**Discount Calculation:**
```javascript
if (discountType === 'percentage') {
  discountAmount = (orderAmount * discountValue / 100)
  
  if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
    discountAmount = maxDiscountAmount
  }
} else {
  discountAmount = discountValue
}

// Never exceed order amount
if (discountAmount > orderAmount) {
  discountAmount = orderAmount
}
```

**Implementation:**
```typescript
// Frontend
const response = await fetch('/api/promo-codes/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: promoCode,
    orderAmount: 499.99,
    packageType: 'advanced',
    email: userEmail
  })
})

if (response.ok) {
  const { valid, discountAmount } = await response.json()
  if (valid) {
    const finalPrice = orderAmount - discountAmount
    setTotalAmount(finalPrice)
  }
}
```

---

### 4. POST /api/abandoned-checkouts
**Track Abandoned Checkout**

**Purpose:** Record checkout progress for abandoned cart recovery

**Request:**
```bash
curl -X POST https://buzzfiling.com/api/abandoned-checkouts \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_1234567890_abcd1234",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1-234-567-8900",
    "lastStep": 3,
    "state": "CA",
    "packageType": "advanced",
    "businessName": "Acme Corp",
    "estimatedTotal": 499,
    "packagePrice": 299,
    "addons": []
  }'
```

**Request Schema:**
```typescript
{
  sessionId: string (required)         // Unique session ID
  email: string (optional)             // User email
  name: string (optional)              // User name
  phone: string (optional)             // User phone
  lastStep: number (required)          // Which step user was on (0-5)
  state: string (optional)             // Selected state
  packageType: string (optional)       // Selected package
  businessName: string (optional)      // Business name entered
  estimatedTotal: number               // Total amount
  packagePrice: number                 // Package price
  addons: any[]                        // Selected addons
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Checkout progress tracked"
}
```

**Error Responses:**
```json
// 400 - Invalid session
{
  "error": "Invalid session ID"
}

// 500 - Server error
{
  "error": "Failed to track checkout progress"
}
```

**Notes:**
- Silent failure if no tracking data provided
- Automatically called every 2 seconds from checkout shell
- Only tracks if user entered meaningful data
- Creates/updates document with each call

**Implementation:**
```typescript
// Frontend (checkout-shell.tsx)
useEffect(() => {
  const trackAbandonedCheckout = async () => {
    if (!data.email && !data.state && !data.businessName) return
    
    const sessionId = getSessionId()
    if (!sessionId) return

    try {
      await fetch("/api/abandoned-checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: data.email || null,
          name: data.name || null,
          phone: data.phone || null,
          lastStep: currentStep,
          state: data.state || null,
          packageType: data.packageType || null,
          businessName: data.businessName || null,
          estimatedTotal: data.totalAmount || 0,
          packagePrice: data.packagePrice || 0,
          addons: data.addons || []
        })
      })
    } catch (error) {
      console.error("Failed to track checkout progress:", error)
    }
  }

  const timeoutId = setTimeout(trackAbandonedCheckout, 2000)
  return () => clearTimeout(timeoutId)
}, [currentStep, data.email, data.state, data.businessName])
```

---

### 5. GET /api/abandoned-checkouts
**Retrieve Abandoned Checkouts (Admin)**

**Purpose:** Get analytics on abandoned checkouts for recovery campaigns

**Request:**
```bash
curl -X GET https://buzzfiling.com/api/abandoned-checkouts \
  -H "Authorization: Bearer admin-token"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sessionId": "sess_1234567890_abcd1234",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1-234-567-8900",
      "lastStep": 3,
      "state": "CA",
      "packageType": "advanced",
      "businessName": "Acme Corp",
      "estimatedTotal": 499,
      "packagePrice": 299,
      "addons": [],
      "createdAt": "2024-07-02T10:30:00Z",
      "updatedAt": "2024-07-02T10:35:00Z",
      "recovered": false
    }
  ],
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

**Error Responses:**
```json
// 401 - Not authenticated
{
  "error": "Unauthorized"
}

// 403 - Not admin
{
  "error": "Admin access required"
}

// 500 - Server error
{
  "error": "Internal server error"
}
```

**Query Parameters:**
Currently no query parameters, but retrieves:
- Last 30 days of data
- Non-recovered checkouts only
- Sorted by most recent first
- Limited to 100 results

**Analytics Breakdown:**

| Metric | Calculation |
|--------|-------------|
| `total` | Count of abandoned checkouts |
| `last24h` | Abandoned in last 24 hours |
| `last7Days` | Abandoned in last 7 days |
| `potentialRevenue` | Sum of `estimatedTotal` values |
| `stepBreakdown` | Count by `lastStep` field |

**Implementation:**
```typescript
// Frontend (Admin Dashboard)
const fetchAbandonedCheckouts = async () => {
  const token = authService.getToken()
  
  const response = await fetch('/api/abandoned-checkouts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const { data, stats } = await response.json()
  
  // Display data in table
  // Display stats in dashboard cards
}
```

---

## Storage API Reference

### localStorage (Client-Side)

**Key:** `checkoutData`

**Structure:**
```javascript
localStorage.checkoutData = {
  account: {
    email: string,
    password: string,
    phone: string,
    name: string,
    userId?: string
  },
  state: {
    state: string,
    entityType: "llc" | "s-corp",
    packageType: "starter" | "advanced"
  },
  businessInfo: {
    businessName: string,
    businessCategory: string,
    businessDescription: string,
    needsResellerCertificate: boolean
  },
  members: Member[],
  addons: any[],
  orderId: string,
  createdAt: string,
  status: "draft",
  payment: {
    method: string,
    status: "pending"
  },
  totalAmount: number,
  packagePrice: number,
  stateFilingFee: number,
  addonsTotal: number,
  savedAt: string,
  expiresAt: string,
  currentStep: number
}
```

**Expiry:** 7 days from last save
**Auto-Cleanup:** Expired data automatically deleted on retrieval

---

## Error Code Reference

| Code | Meaning | Typical Causes |
|------|---------|-----------------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Admin access required, invalid checkout token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database error, unexpected issue |

---

## Rate Limiting

Applied to:
- `/api/checkout/token` - 10 requests/minute per IP
- `/api/auth/signup` - 5 requests/minute per IP
- `/api/promo-codes/validate` - 30 requests/minute per IP
- `/api/abandoned-checkouts` POST - 100 requests/minute per session

---

## CORS Configuration

**Allowed Origins:**
- https://buzzfiling.com
- https://*.buzzfiling.com

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type
- Authorization

**Credentials:** Included

---

## Testing Examples

### Complete Checkout Flow (cURL)

```bash
#!/bin/bash

EMAIL="test@example.com"
BASE_URL="https://buzzfiling.com"

# 1. Generate checkout token
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/checkout/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

CHECKOUT_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.checkoutToken')
echo "Checkout Token: $CHECKOUT_TOKEN"

# 2. Signup with token
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"John Doe\",
    \"email\": \"$EMAIL\",
    \"phone\": \"+1-234-567-8900\",
    \"password\": \"SecurePass123!\",
    \"checkoutToken\": \"$CHECKOUT_TOKEN\"
  }")

AUTH_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')
echo "Auth Token: $AUTH_TOKEN"

# 3. Validate promo code
PROMO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/promo-codes/validate" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"SUMMER20\",
    \"orderAmount\": 499.99,
    \"packageType\": \"advanced\",
    \"email\": \"$EMAIL\"
  }")

echo "Promo Result: $PROMO_RESPONSE"
```

---

**API Reference Version:** 1.0
**Last Updated:** 2026-07-02
