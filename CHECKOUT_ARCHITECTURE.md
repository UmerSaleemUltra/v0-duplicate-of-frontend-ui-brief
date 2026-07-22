# Simplified Checkout Architecture - Core APIs Only

## Overview

This checkout system uses 5 core APIs for a streamlined LLC formation process. Perfect for converting clients with a minimal, focused onboarding experience—**Starter package only at $249 USD, no add-ons or discounts**.

### Quick Architecture

```
┌──────────────────────────────────────────┐
│          SIMPLIFIED CHECKOUT FLOW        │
├──────────────────────────────────────────┤
│ 1. Account Setup                         │
│ 2. Formation Details (State, LLC only)   │
│ 3. Business Information                  │
│ 4. Members/Owners (Min 1 responsible)   │
│ 5. Payment Confirmation                  │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│         5 CORE APIs Only                 │
├──────────────────────────────────────────┤
│ 1. POST /api/checkout/token              │
│ 2. POST /api/auth/signup                 │
│ 3. POST /api/companies                   │
│ 4. POST /api/abandoned-checkouts         │
│ 5. POST /api/payment-receipt/upload      │
└──────────────────────────────────────────┘
```

---

## Core API Reference

### 1. **POST `/api/checkout/token`** - Session Initialization

Generates a secure checkout session token using email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "expiresIn": 3600,
  "checkoutId": "checkout_123"
}
```

**Usage:** Called at checkout start to initialize the session and store token in localStorage.

---

### 2. **POST `/api/auth/signup`** - User Registration

Creates user account with email, password, name, and phone.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+923001234567"
}
```

**Response:**
```json
{
  "userId": "user_123",
  "email": "john@example.com",
  "authToken": "auth_token_here"
}
```

**Usage:** Called after account step to create user and get auth token for future requests.

---

### 3. **POST `/api/companies`** - Create Order

Creates LLC order with all checkout data. **Starter package only—$249 USD fixed.**

**Request:**
```json
{
  "token": "checkout_token",
  "account": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+923001234567"
  },
  "formation": {
    "state": "Wyoming",
    "entity": "LLC",
    "package": "Starter",
    "priceUSD": 249
  },
  "business": {
    "businessName": "Tech Solutions",
    "website": "https://example.com",
    "category": "Technology",
    "description": "Software development services"
  },
  "members": [
    {
      "id": "mem_1",
      "responsible": true,
      "fullLegalName": "John Doe",
      "homeAddress": "123 Main St",
      "city": "Miami",
      "stateProvince": "Florida",
      "country": "United States",
      "zip": "33101",
      "ssn": "***-**-1234",
      "idFileName": "id_front.pdf"
    }
  ],
  "payment": {
    "method": "already",
    "whatsapp": "+923001234567",
    "receiptFileName": "receipt.pdf"
  }
}
```

**Response:**
```json
{
  "orderId": "order_456",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Usage:** Main order creation endpoint. Called on final submission with all collected data.

---

### 4. **POST `/api/abandoned-checkouts`** - Progress Tracking

Tracks checkout progress for cart recovery if user leaves.

**Request:**
```json
{
  "email": "user@example.com",
  "step": 2,
  "data": {
    "account": {},
    "formation": {},
    "business": {}
  }
}
```

**Response:**
```json
{
  "checkoutId": "checkout_789",
  "savedAt": "2024-01-15T10:30:00Z"
}
```

**Usage:** Call after each step to save progress. Enables users to resume from where they left off.

---

### 5. **POST `/api/payment-receipt/upload`** - Receipt Upload

Uploads payment receipt files for proof of payment.

**Request:** (multipart/form-data)
```
file: <binary_file>
email: "user@example.com"
orderNumber: "order_456"
```

**Response:**
```json
{
  "fileUrl": "https://storage.example.com/receipts/receipt_123.pdf",
  "fileName": "receipt_123.pdf"
}
```

**Usage:** Called when user selects "Already Paid" and uploads receipt as proof.

---

## Data Storage

### localStorage (Form State)

Stores non-sensitive form data for session recovery:

```javascript
{
  "checkoutSession": {
    "account": { fullName, email, phone, countryDial, terms },
    "formation": { state, entityType, pkg: "Starter" },
    "business": { businessName, website, category, description },
    "members": [ /* member array */ ],
    "payment": { method, whatsapp, receiptFileName }
  }
}
```

### IndexedDB (File Storage)

Temporary file storage for documents before API submission:

```javascript
// Database: "checkoutDB"
// Object stores: "files", "receipts"
```

---

## Implementation Checklist

✓ **Step 1: Initialize** - Call `/api/checkout/token` with email  
✓ **Step 2: Account** - Call `/api/auth/signup` to create user  
✓ **Step 3: Formation** - Fixed to Wyoming, LLC, Starter ($249)  
✓ **Step 4: Business Info** - Collect name, website, category, description  
✓ **Step 5: Members** - Add min 1 responsible owner with ID upload  
✓ **Step 6: Payment** - Choose "Already Paid" or upload receipt  
✓ **Step 7: Submit** - Call `/api/companies` with all data  
✓ **Step 8: Success** - Clear localStorage, redirect to dashboard  

---

## Key Differences from Full System

| Feature | Core APIs | Full System |
|---------|-----------|------------|
| **Packages** | Starter only ($249) | Multiple + add-ons |
| **Discounts** | None | Promo codes supported |
| **State Selection** | Wyoming recommended | Any state |
| **APIs** | 5 core | 6 (includes promos) |
| **Complexity** | Low | Medium-High |
| **Pricing** | Fixed | Variable |
| **Target** | Rapid onboarding | Feature-rich |

---

## Quick Start Example

```typescript
// 1. Generate token
const tokenData = await fetch('/api/checkout/token', {
  method: 'POST',
  body: JSON.stringify({ email: userEmail })
}).then(r => r.json());

// 2. Sign up user
const userData = await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    fullName, email, password, phone
  })
}).then(r => r.json());

// 3. Create order (simplified)
const orderData = await fetch('/api/companies', {
  method: 'POST',
  body: JSON.stringify({
    token: tokenData.token,
    account: { fullName, email, phone },
    formation: { state: 'Wyoming', entity: 'LLC', package: 'Starter', priceUSD: 249 },
    business: { businessName, website, category, description },
    members: membersArray,
    payment: { method: 'already', whatsapp, receiptFileName }
  })
}).then(r => r.json());

// 4. Success
console.log('Order created:', orderData.orderId);
```

This simplified system is perfect for converting prospects quickly with minimal friction and maximum clarity.
