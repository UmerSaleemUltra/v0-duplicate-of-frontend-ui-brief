# Checkout Architecture & Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Storage Strategy](#data-storage-strategy)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This checkout system is built on a **multi-step, state-managed architecture** that combines:
- **6 REST APIs** for server operations
- **localStorage** for persistent session data
- **IndexedDB** for large file/document storage
- **React state** for real-time UI management
- **SSE (Server-Sent Events)** for real-time updates

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  CHECKOUT FLOW                      │
├─────────────────────────────────────────────────────┤
│ Step 0: Account  → Step 1: State/Package           │
│ Step 2: Business Info → Step 3: Owner Info         │
│ Step 4: Review → Step 5: Payment                   │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│              DATA LAYER                             │
├─────────────────────────────────────────────────────┤
│ localStorage (Quick access)                         │
│   ├─ checkoutToken                                  │
│   ├─ checkoutData                                   │
│   └─ sessionData                                    │
│                                                     │
│ IndexedDB (Large files)                             │
│   ├─ passports                                      │
│   ├─ documents                                      │
│   └─ paymentReceipts                                │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│              API LAYER                              │
├─────────────────────────────────────────────────────┤
│ 1. POST /api/checkout/token                         │
│ 2. POST /api/auth/signup                            │
│ 3. POST /api/companies (Create Order)               │
│ 4. POST /api/abandoned-checkouts (Tracking)         │
│ 5. POST /api/payment-receipt/upload                 │
│ 6. POST /api/promo-codes/validate                   │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. **POST `/api/checkout/token`**
Generates a secure session token for checkout.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "expiresAt": "2024-07-23T12:00:00Z",
  "checkoutId": "checkout_123"
}
```

**Usage:**
- Called once at checkout start
- Token stored in localStorage
- Used for subsequent API calls as authorization

**Implementation:**
```typescript
// lib/checkout-token.ts
export async function generateCheckoutToken(email: string) {
  const response = await fetch('/api/checkout/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) throw new Error('Failed to generate token');
  
  const data = await response.json();
  
  // Store in localStorage
  localStorage.setItem('checkoutToken', data.token);
  localStorage.setItem('checkoutId', data.checkoutId);
  localStorage.setItem('tokenExpiry', data.expiresAt);
  
  return data;
}
```

---

### 2. **POST `/api/auth/signup`**
Creates a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user_123",
  "authToken": "auth_jwt_token",
  "message": "Account created successfully"
}
```

**Usage:**
- Called in Step 0 (Account Setup)
- Creates user account before company order
- Returns auth token for future authenticated requests

**Implementation:**
```typescript
// components/checkout/account-step.tsx
async function handleSignup(formData: AccountFormData) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    // Store auth token
    localStorage.setItem('authToken', data.authToken);
    localStorage.setItem('userId', data.userId);
    
    // Save to checkout data
    setCheckoutData(prev => ({
      ...prev,
      email: formData.email,
      userId: data.userId,
      accountCreated: true
    }));
    
    moveToNextStep();
  } catch (error) {
    console.error('[v0] Signup error:', error);
    showErrorToast(error.message);
  }
}
```

---

### 3. **POST `/api/companies`**
Creates the company/LLC order with all checkout data.

**Request:**
```json
{
  "name": "My Business LLC",
  "type": "LLC",
  "state": "DE",
  "email": "user@example.com",
  "phone": "+1234567890",
  "members": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "ownership": 100
    }
  ],
  "businessCategory": "Technology",
  "businessDescription": "Software Development",
  "businessWebsite": "https://example.com",
  "packageType": "standard",
  "selectedAddons": ["itin", "website"],
  "promoCode": "SAVE20",
  "orderData": {
    "packagePrice": 199,
    "stateFilingFee": 150,
    "addonsTotal": 200,
    "subtotal": 549,
    "total": 549
  }
}
```

**Response:**
```json
{
  "success": true,
  "companyId": "company_123",
  "orderId": "order_456",
  "status": "pending",
  "totalAmount": 549,
  "milestones": [
    { "id": "m1", "title": "LLC Formation", "status": "pending" },
    { "id": "m2", "title": "EIN Assignment", "status": "pending" }
  ]
}
```

**Usage:**
- Called in Step 5 (Payment/Review)
- Main order creation endpoint
- Returns company ID and order tracking info

**Implementation:**
```typescript
// lib/checkout-storage.ts
export async function createCompanyOrder(checkoutData: CheckoutData) {
  const authToken = localStorage.getItem('authToken');
  const checkoutToken = localStorage.getItem('checkoutToken');
  
  const payload = {
    name: checkoutData.companyName,
    type: checkoutData.companyType,
    state: checkoutData.state,
    email: checkoutData.email,
    phone: checkoutData.phone,
    members: checkoutData.members,
    businessCategory: checkoutData.businessCategory,
    businessDescription: checkoutData.businessDescription,
    businessWebsite: checkoutData.businessWebsite,
    packageType: checkoutData.packageType,
    selectedAddons: checkoutData.selectedAddons,
    promoCode: checkoutData.promoCode,
    orderData: {
      packagePrice: checkoutData.pricing?.packagePrice,
      stateFilingFee: checkoutData.pricing?.stateFilingFee,
      addonsTotal: checkoutData.pricing?.addonsTotal,
      subtotal: checkoutData.pricing?.subtotal,
      total: checkoutData.pricing?.total
    }
  };
  
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Checkout-Token': checkoutToken
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create company order');
  }
  
  const data = await response.json();
  
  // Clear checkout data after successful order
  localStorage.setItem('companyId', data.companyId);
  localStorage.setItem('orderId', data.orderId);
  
  return data;
}
```

---

### 4. **POST `/api/abandoned-checkouts`**
Tracks checkout progress for abandoned cart recovery.

**Request:**
```json
{
  "checkoutId": "checkout_123",
  "step": 3,
  "data": { /* partial checkout data */ },
  "timestamp": "2024-07-23T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "savedAt": "2024-07-23T10:30:00Z",
  "recoveryLink": "https://example.com/checkout?recover=abc123"
}
```

**Usage:**
- Called on every step change
- Enables cart recovery if user leaves
- Stores incomplete checkout progress

**Implementation:**
```typescript
// lib/data-layer.ts
export async function trackAbandonedCheckout(
  checkoutId: string,
  currentStep: number,
  checkoutData: Partial<CheckoutData>
) {
  const payload = {
    checkoutId,
    step: currentStep,
    data: checkoutData,
    timestamp: new Date().toISOString()
  };
  
  try {
    await fetch('/api/abandoned-checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Silently fail - not critical
    console.warn('[v0] Abandoned checkout tracking failed:', error);
  }
}
```

---

### 5. **POST `/api/payment-receipt/upload`**
Uploads payment receipt files.

**Request:**
```
FormData:
- file: File (PDF/Image)
- orderId: string
- paymentMethod: "bank_transfer" | "card" | "check"
- amount: number
```

**Response:**
```json
{
  "success": true,
  "receiptId": "receipt_123",
  "fileUrl": "https://storage.example.com/receipts/receipt_123.pdf",
  "uploadedAt": "2024-07-23T10:35:00Z"
}
```

**Usage:**
- Called in Step 5 (Payment)
- Stores proof of payment
- Saved in IndexedDB for later retrieval

**Implementation:**
```typescript
// lib/document-storage.ts
export async function uploadPaymentReceipt(
  file: File,
  orderId: string,
  paymentMethod: string,
  amount: number
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('orderId', orderId);
  formData.append('paymentMethod', paymentMethod);
  formData.append('amount', amount.toString());
  
  const authToken = localStorage.getItem('authToken');
  
  const response = await fetch('/api/payment-receipt/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload receipt');
  }
  
  const data = await response.json();
  
  // Store in IndexedDB
  await saveToIndexedDB('payment_receipts', {
    id: data.receiptId,
    orderId,
    fileUrl: data.fileUrl,
    uploadedAt: data.uploadedAt
  });
  
  return data;
}
```

---

### 6. **POST `/api/promo-codes/validate`**
Validates promo codes for discounts.

**Request:**
```json
{
  "code": "SAVE20",
  "packageType": "standard",
  "state": "DE"
}
```

**Response:**
```json
{
  "valid": true,
  "code": "SAVE20",
  "discountType": "percentage",
  "discountValue": 20,
  "maxUses": 100,
  "usedCount": 45,
  "expiresAt": "2024-12-31T23:59:59Z",
  "applicableTo": ["standard", "premium"]
}
```

**Usage:**
- Called when user enters promo code
- Validates applicability and availability
- Calculates final pricing

**Implementation:**
```typescript
// components/checkout/review-step.tsx
async function validatePromoCode(code: string) {
  try {
    const response = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        packageType: checkoutData.packageType,
        state: checkoutData.state
      })
    });
    
    if (!response.ok) {
      throw new Error('Invalid promo code');
    }
    
    const data = await response.json();
    
    if (!data.valid) {
      showErrorToast('Promo code is invalid or expired');
      return;
    }
    
    // Calculate discount
    const discount = (checkoutData.pricing?.subtotal || 0) * 
                     (data.discountValue / 100);
    
    setCheckoutData(prev => ({
      ...prev,
      promoCode: code,
      discount,
      pricing: {
        ...prev.pricing,
        total: (prev.pricing?.subtotal || 0) - discount
      }
    }));
    
    showSuccessToast(`Promo code applied! You saved $${discount}`);
  } catch (error) {
    console.error('[v0] Promo validation error:', error);
    showErrorToast(error.message);
  }
}
```

---

## Data Storage Strategy

### **localStorage** - Session & Small Data

**Purpose:** Quick access, persistent session data

**Stored Items:**
```typescript
// Authentication
localStorage.setItem('authToken', authToken);
localStorage.setItem('userId', userId);

// Checkout Session
localStorage.setItem('checkoutToken', checkoutToken);
localStorage.setItem('checkoutId', checkoutId);
localStorage.setItem('tokenExpiry', expiresAt);

// Checkout Progress
localStorage.setItem('checkoutData', JSON.stringify({
  step: 3,
  email: 'user@example.com',
  companyName: 'My LLC',
  // ... other data
}));

// UI State
localStorage.setItem('selectedAddons', JSON.stringify(['itin', 'website']));
localStorage.setItem('theme', 'dark');
```

**Usage Pattern:**
```typescript
// Save
function saveCheckoutProgress(data: CheckoutData) {
  localStorage.setItem('checkoutData', JSON.stringify(data));
}

// Retrieve
function getCheckoutProgress(): CheckoutData | null {
  const data = localStorage.getItem('checkoutData');
  return data ? JSON.parse(data) : null;
}

// Clear
function clearCheckoutSession() {
  localStorage.removeItem('checkoutToken');
  localStorage.removeItem('checkoutId');
  localStorage.removeItem('checkoutData');
  localStorage.removeItem('authToken');
}
```

---

### **IndexedDB** - Large Files & Documents

**Purpose:** Store files, passports, documents without size limits

**Database Schema:**
```typescript
// lib/indexeddb.ts
export async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CheckoutDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Passports object store
      if (!db.objectStoreNames.contains('passports')) {
        const passportStore = db.createObjectStore('passports', { 
          keyPath: 'id' 
        });
        passportStore.createIndex('orderId', 'orderId', { unique: false });
        passportStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
      
      // Documents object store
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { 
          keyPath: 'id' 
        });
        docStore.createIndex('orderId', 'orderId', { unique: false });
        docStore.createIndex('type', 'type', { unique: false });
      }
      
      // Payment receipts object store
      if (!db.objectStoreNames.contains('payment_receipts')) {
        const receiptStore = db.createObjectStore('payment_receipts', { 
          keyPath: 'id' 
        });
        receiptStore.createIndex('orderId', 'orderId', { unique: false });
      }
    };
  });
}
```

**Operations:**
```typescript
// Save to IndexedDB
async function saveToIndexedDB(store: string, data: any) {
  const db = await initializeIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.put(data);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Retrieve from IndexedDB
async function getFromIndexedDB(store: string, id: string) {
  const db = await initializeIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], 'readonly');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Delete from IndexedDB
async function deleteFromIndexedDB(store: string, id: string) {
  const db = await initializeIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
```

---

## Step-by-Step Implementation

### **Step 0: Account Setup**

**Flow:**
1. User enters email
2. Generate checkout token
3. User signs up or logs in
4. Store auth credentials

**Implementation:**
```typescript
// components/checkout/account-step.tsx
export function AccountStep({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Generate checkout token
      const tokenData = await generateCheckoutToken(email);
      console.log('[v0] Checkout token generated:', tokenData.checkoutId);

      // Step 2: Sign up user
      const signupData = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(r => r.json());

      // Step 3: Save to localStorage
      localStorage.setItem('authToken', signupData.authToken);
      localStorage.setItem('userId', signupData.userId);

      // Step 4: Initialize checkout data
      const checkoutData = {
        step: 0,
        email,
        userId: signupData.userId,
        startedAt: new Date().toISOString()
      };
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

      // Step 5: Track abandoned checkout
      await trackAbandonedCheckout(tokenData.checkoutId, 0, checkoutData);

      onNext();
    } catch (error) {
      console.error('[v0] Account setup error:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Continue'}
      </button>
    </form>
  );
}
```

---

### **Step 1-3: Collect Information**

**Flow:**
1. Gather company details
2. Save to localStorage on each step
3. Track abandoned checkout

**Implementation:**
```typescript
// components/checkout/business-info-step.tsx
export function BusinessInfoStep({ onNext }: { onNext: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');

  function handleNext() {
    // Get existing data
    const existingData = JSON.parse(
      localStorage.getItem('checkoutData') || '{}'
    );

    // Update with new data
    const updatedData = {
      ...existingData,
      step: 2,
      companyName,
      businessCategory
    };

    // Save to localStorage
    localStorage.setItem('checkoutData', JSON.stringify(updatedData));

    // Track abandoned checkout
    trackAbandonedCheckout(
      localStorage.getItem('checkoutId') || '',
      2,
      updatedData
    );

    onNext();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company Name"
      />
      <select
        value={businessCategory}
        onChange={(e) => setBusinessCategory(e.target.value)}
      >
        <option>Select Category</option>
        <option value="tech">Technology</option>
        <option value="retail">Retail</option>
      </select>
      <button type="submit">Next</button>
    </form>
  );
}
```

---

### **Step 4: Review & Promo Code**

**Flow:**
1. Display summary
2. Allow promo code entry
3. Calculate final pricing

**Implementation:**
```typescript
// components/checkout/review-step.tsx
export function ReviewStep({ onNext }: { onNext: () => void }) {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const checkoutData = JSON.parse(
    localStorage.getItem('checkoutData') || '{}'
  );

  async function applyPromoCode() {
    const response = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: promoCode,
        packageType: checkoutData.packageType,
        state: checkoutData.state
      })
    });

    const data = await response.json();

    if (data.valid) {
      const discountAmount = 
        (checkoutData.pricing?.subtotal || 0) * (data.discountValue / 100);
      setDiscount(discountAmount);

      // Update checkout data
      const updatedData = {
        ...checkoutData,
        promoCode: promoCode,
        discount: discountAmount,
        pricing: {
          ...checkoutData.pricing,
          total: (checkoutData.pricing?.subtotal || 0) - discountAmount
        }
      };
      localStorage.setItem('checkoutData', JSON.stringify(updatedData));
    }
  }

  return (
    <div>
      <h2>Review Your Order</h2>
      <div>
        <p>Company: {checkoutData.companyName}</p>
        <p>Total: ${checkoutData.pricing?.total}</p>
      </div>

      <div>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Enter promo code"
        />
        <button onClick={applyPromoCode}>Apply</button>
      </div>

      {discount > 0 && <p>Discount: -${discount}</p>}

      <button onClick={onNext}>Proceed to Payment</button>
    </div>
  );
}
```

---

### **Step 5: Payment & Order Creation**

**Flow:**
1. Upload payment receipt
2. Create company order
3. Clear checkout data

**Implementation:**
```typescript
// components/checkout/payment-step.tsx
export async function handlePayment(receiptFile: File) {
  try {
    const checkoutData = JSON.parse(
      localStorage.getItem('checkoutData') || '{}'
    );
    const authToken = localStorage.getItem('authToken');
    const orderId = `order_${Date.now()}`;

    console.log('[v0] Starting payment process...');

    // Step 1: Upload receipt
    console.log('[v0] Uploading payment receipt...');
    const receiptFormData = new FormData();
    receiptFormData.append('file', receiptFile);
    receiptFormData.append('orderId', orderId);
    receiptFormData.append('paymentMethod', 'bank_transfer');
    receiptFormData.append('amount', checkoutData.pricing?.total.toString());

    const receiptResponse = await fetch('/api/payment-receipt/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: receiptFormData
    });

    const receiptData = await receiptResponse.json();
    console.log('[v0] Receipt uploaded:', receiptData.receiptId);

    // Step 2: Create company order
    console.log('[v0] Creating company order...');
    const companyResponse = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Checkout-Token': localStorage.getItem('checkoutToken') || ''
      },
      body: JSON.stringify({
        name: checkoutData.companyName,
        type: checkoutData.companyType,
        state: checkoutData.state,
        email: checkoutData.email,
        phone: checkoutData.phone,
        members: checkoutData.members,
        businessCategory: checkoutData.businessCategory,
        packageType: checkoutData.packageType,
        selectedAddons: checkoutData.selectedAddons,
        promoCode: checkoutData.promoCode,
        orderData: checkoutData.pricing
      })
    });

    const companyData = await companyResponse.json();
    console.log('[v0] Company order created:', companyData.companyId);

    // Step 3: Save order info
    localStorage.setItem('companyId', companyData.companyId);
    localStorage.setItem('orderId', companyData.orderId);

    // Step 4: Clear checkout data
    localStorage.removeItem('checkoutData');
    localStorage.removeItem('checkoutToken');
    localStorage.removeItem('checkoutId');

    // Step 5: Redirect to success page
    window.location.href = `/payment-status?orderId=${companyData.orderId}`;

  } catch (error) {
    console.error('[v0] Payment error:', error);
    throw error;
  }
}
```

---

## Code Examples

### **Complete Checkout Hook**

```typescript
// hooks/useCheckout.ts
export function useCheckout() {
  const [step, setStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(() => {
    const saved = localStorage.getItem('checkoutData');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save data to localStorage
  const saveData = (data: Partial<CheckoutData>) => {
    const updated = { ...checkoutData, ...data, step };
    setCheckoutData(updated);
    localStorage.setItem('checkoutData', JSON.stringify(updated));
    
    // Track abandoned checkout
    trackAbandonedCheckout(
      localStorage.getItem('checkoutId') || '',
      step,
      updated
    );
  };

  // Move to next step
  const nextStep = () => {
    const newStep = step + 1;
    setStep(newStep);
    saveData({ step: newStep });
  };

  // Move to previous step
  const previousStep = () => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      saveData({ step: newStep });
    }
  };

  // Reset checkout
  const reset = () => {
    localStorage.removeItem('checkoutData');
    localStorage.removeItem('checkoutToken');
    setStep(0);
    setCheckoutData({});
  };

  return {
    step,
    checkoutData,
    loading,
    error,
    saveData,
    nextStep,
    previousStep,
    reset,
    setStep,
    setLoading,
    setError
  };
}
```

---

### **API Client Wrapper**

```typescript
// lib/api-client.ts
class CheckoutAPIClient {
  private authToken: string | null;
  private checkoutToken: string | null;

  constructor() {
    this.authToken = localStorage.getItem('authToken');
    this.checkoutToken = localStorage.getItem('checkoutToken');
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (this.checkoutToken && endpoint !== '/api/checkout/token') {
      headers['X-Checkout-Token'] = this.checkoutToken;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async generateToken(email: string) {
    const data = await this.request('/api/checkout/token', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    this.checkoutToken = data.token;
    return data;
  }

  async signup(email: string, password: string) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.authToken = data.authToken;
    return data;
  }

  async createCompany(companyData: any) {
    return this.request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  }

  async validatePromoCode(code: string, packageType: string, state: string) {
    return this.request('/api/promo-codes/validate', {
      method: 'POST',
      body: JSON.stringify({ code, packageType, state })
    });
  }

  async uploadReceipt(file: File, orderId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    const response = await fetch('/api/payment-receipt/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Receipt upload failed');
    }

    return response.json();
  }

  async trackAbandonedCheckout(checkoutId: string, step: number, data: any) {
    return this.request('/api/abandoned-checkouts', {
      method: 'POST',
      body: JSON.stringify({ checkoutId, step, data, timestamp: new Date().toISOString() })
    });
  }
}

export const checkoutAPI = new CheckoutAPIClient();
```

---

## Best Practices

### **1. Error Handling**
```typescript
async function safeAPICall<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[v0] ${errorMessage}:`, error);
    showErrorToast(errorMessage);
    return null;
  }
}
```

### **2. Data Validation**
```typescript
function validateCheckoutData(data: any): data is CheckoutData {
  return (
    data.email &&
    data.companyName &&
    data.companyType &&
    data.state &&
    data.pricing?.total > 0
  );
}
```

### **3. Session Management**
```typescript
function isTokenExpired(expiryTime: string): boolean {
  return new Date(expiryTime) < new Date();
}

function ensureValidSession() {
  const expiry = localStorage.getItem('tokenExpiry');
  if (expiry && isTokenExpired(expiry)) {
    clearCheckoutSession();
    window.location.href = '/checkout'; // Restart checkout
  }
}
```

### **4. Concurrent Requests**
```typescript
async function processCheckout(data: CheckoutData) {
  // Use Promise.all for parallel requests
  const [receiptResult, companyResult] = await Promise.all([
    uploadPaymentReceipt(receiptFile, data),
    createCompanyOrder(data)
  ]);

  return { receiptResult, companyResult };
}
```

---

## Troubleshooting

### **Issue: localStorage quota exceeded**
**Solution:** Clear old checkout data or use IndexedDB for large files
```typescript
function cleanupOldSessions() {
  const sessions = Object.keys(localStorage);
  sessions.forEach(key => {
    if (key.startsWith('checkout_') && isExpired(key)) {
      localStorage.removeItem(key);
    }
  });
}
```

### **Issue: Token expired mid-checkout**
**Solution:** Implement token refresh
```typescript
async function refreshCheckoutToken() {
  const email = localStorage.getItem('userEmail');
  if (!email) return;

  try {
    const data = await generateCheckoutToken(email);
    localStorage.setItem('checkoutToken', data.token);
    localStorage.setItem('tokenExpiry', data.expiresAt);
  } catch (error) {
    console.error('[v0] Token refresh failed:', error);
    redirectToLogin();
  }
}
```

### **Issue: Inconsistent state between tabs**
**Solution:** Use multi-tab sync
```typescript
window.addEventListener('storage', (event) => {
  if (event.key === 'checkoutData') {
    const newData = JSON.parse(event.newValue || '{}');
    setCheckoutData(newData);
  }
});
```

---

## Summary

**This checkout architecture provides:**
- ✅ Secure token-based session management
- ✅ Multi-step progress tracking
- ✅ Abandoned cart recovery
- ✅ Efficient data storage (localStorage + IndexedDB)
- ✅ Reusable API endpoints
- ✅ Robust error handling

**APIs can be reused for:**
- Alternative checkout flows
- Checkout modals/wizards
- Add-on purchases
- Account management flows
