# Buzz Filing Checkout Architecture & Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [API Reference](#api-reference)
3. [Data Flow](#data-flow)
4. [Storage Strategy](#storage-strategy)
5. [Implementation Steps](#implementation-steps)
6. [Code Examples](#code-examples)
7. [Best Practices](#best-practices)

---

## Overview

The Buzz Filing checkout system uses a multi-step form flow with secure backend APIs and client-side data persistence. This architecture allows users to:
- Start checkout and get a secure session token
- Save progress locally for abandoned cart recovery
- Complete account creation
- Submit company/LLC formation orders
- Upload payment receipts

### Architecture Diagram
```
User Input
    ↓
Generate Checkout Token (API)
    ↓
Store in localStorage/IndexDB
    ↓
User Fills Form Steps
    ↓
Save Progress Locally
    ↓
On Submit → Create Account (API)
    ↓
On Submit → Create Company Order (API)
    ↓
Track Abandoned Checkout (API)
    ↓
Upload Receipt (API)
    ↓
Confirmation
```

---

## API Reference

### 1. POST `/api/checkout/token`
**Purpose:** Generate a secure checkout session token

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "checkoutToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Usage:** Call this first to create a checkout session. Store the token in localStorage.

---

### 2. POST `/api/auth/signup`
**Purpose:** Create a new user account during checkout

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "checkoutToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Response:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "message": "Account created successfully"
}
```

**Usage:** Call this when user completes the Account step of checkout.

---

### 3. POST `/api/companies`
**Purpose:** Create a company/LLC formation order with all checkout data

**Request:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "checkoutToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "companyName": "My LLC Co",
  "state": "Wyoming",
  "businessType": "LLC",
  "EINRequired": true,
  "registeredAgentService": true,
  "businessAddress": true,
  "compliancePackage": "professional",
  "totalPrice": 299,
  "selectedAddOns": ["EIN", "Agent", "Address"],
  "paymentMethod": "credit_card"
}
```

**Response:**
```json
{
  "orderId": "order_456",
  "companyId": "company_789",
  "status": "pending",
  "message": "Order created successfully"
}
```

**Usage:** Call this when user submits the final order. Include all collected form data.

---

### 4. POST `/api/abandoned-checkouts`
**Purpose:** Track checkout progress for abandoned cart recovery

**Request:**
```json
{
  "email": "user@example.com",
  "checkoutToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "currentStep": "company-details",
  "formData": {
    "companyName": "My LLC Co",
    "state": "Wyoming",
    "businessType": "LLC"
  },
  "timestamp": 1234567890
}
```

**Response:**
```json
{
  "abandondedCheckoutId": "abandoned_123",
  "status": "saved",
  "message": "Checkout progress saved"
}
```

**Usage:** Call periodically (every 5-10 minutes) while user is on checkout page, or on page unload.

---

### 5. POST `/api/payment-receipt/upload`
**Purpose:** Upload payment receipt files

**Request:** (FormData)
```
- file: File (PDF, JPG, PNG)
- email: user@example.com
- orderId: order_456
- checkoutToken: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Response:**
```json
{
  "receiptId": "receipt_101",
  "fileUrl": "https://storage.example.com/receipts/receipt_101.pdf",
  "status": "uploaded",
  "message": "Receipt uploaded successfully"
}
```

**Usage:** Call after successful payment to store proof of payment.

---

## Data Flow

### Complete Checkout Flow

```
Step 1: Initialize Checkout
├─ User enters email
├─ Call POST /api/checkout/token
├─ Receive checkoutToken
└─ Store in localStorage

Step 2: Account Creation
├─ User fills: email, password, firstName, lastName, phone
├─ Call POST /api/auth/signup
├─ Receive userId
├─ Store userId in localStorage
└─ Auto-save progress to abandoned-checkouts

Step 3: Company Details
├─ User fills: companyName, state, businessType
├─ Auto-save progress every 5 minutes
└─ Save to localStorage + abandoned-checkouts API

Step 4: Add-ons & Pricing
├─ User selects: EIN, registeredAgent, businessAddress, compliancePackage
├─ Calculate totalPrice
├─ Display pricing breakdown
└─ Save selections to localStorage

Step 5: Review & Submit
├─ Show summary of all selections
├─ User confirms and submits
├─ Call POST /api/companies
├─ Receive orderId
└─ Store orderId in localStorage

Step 6: Payment & Receipt
├─ Process payment (external payment gateway)
├─ After successful payment
├─ User uploads receipt
├─ Call POST /api/payment-receipt/upload
└─ Receive receiptId
```

---

## Storage Strategy

### localStorage vs IndexDB

#### Use **localStorage** for:
- Checkout token (small, frequently accessed)
- Current step in checkout
- User email
- User ID
- Order ID
- Small form values

**Pros:**
- Simple key-value storage
- No async/await needed
- Perfect for small data
- Persistent across browser sessions

**Cons:**
- Limited to ~5-10MB
- Not suitable for large files
- No queryability

#### Use **IndexDB** for:
- Complete form data history
- Large file uploads (receipts)
- Complex data structures
- Abandoned checkout data
- Search/filter requirements

**Pros:**
- Large storage capacity (GB+)
- Queryable database
- Transaction support
- Better for large/complex data

**Cons:**
- Requires async/await
- More complex API
- Slower than localStorage

### Recommended Hybrid Approach

```javascript
// localStorage: Quick access data
const checkoutSession = {
  checkoutToken: "...",
  email: "user@example.com",
  userId: "user_123",
  orderId: "order_456",
  currentStep: "payment",
  timestamp: Date.now()
}

// IndexDB: Complete form history
const formHistory = {
  stepName: "company-details",
  data: { /* all form fields */ },
  timestamp: Date.now(),
  synced: false
}
```

---

## Implementation Steps

### Step 1: Initialize Checkout Session

```javascript
// 1. Generate checkout token
async function initializeCheckout(email) {
  try {
    const response = await fetch('/api/checkout/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    const { checkoutToken } = await response.json()
    
    // 2. Store in localStorage
    localStorage.setItem('checkoutToken', checkoutToken)
    localStorage.setItem('checkoutEmail', email)
    localStorage.setItem('checkoutStarted', Date.now().toString())
    
    return checkoutToken
  } catch (error) {
    console.error('Failed to initialize checkout:', error)
    throw error
  }
}
```

### Step 2: Create User Account

```javascript
async function createUserAccount(accountData) {
  const checkoutToken = localStorage.getItem('checkoutToken')
  
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...accountData,
        checkoutToken
      })
    })
    
    const { userId } = await response.json()
    
    // Store user ID
    localStorage.setItem('userId', userId)
    
    // Track abandoned checkout
    await trackAbandonedCheckout('account-complete', accountData)
    
    return userId
  } catch (error) {
    console.error('Account creation failed:', error)
    throw error
  }
}
```

### Step 3: Save Progress to localStorage

```javascript
function saveCheckoutProgress(step, formData) {
  const progress = {
    currentStep: step,
    formData,
    timestamp: Date.now(),
    checkoutToken: localStorage.getItem('checkoutToken'),
    email: localStorage.getItem('checkoutEmail')
  }
  
  localStorage.setItem('checkoutProgress', JSON.stringify(progress))
  
  // Also save to IndexDB for history
  saveToIndexDB('checkoutHistory', progress)
}
```

### Step 4: Auto-save to Abandoned Checkouts

```javascript
async function trackAbandonedCheckout(step, formData) {
  const email = localStorage.getItem('checkoutEmail')
  const checkoutToken = localStorage.getItem('checkoutToken')
  
  try {
    await fetch('/api/abandoned-checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        checkoutToken,
        currentStep: step,
        formData,
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('Failed to track abandoned checkout:', error)
    // Don't throw - this is non-critical
  }
}

// Auto-save every 5 minutes
setInterval(() => {
  const progress = JSON.parse(localStorage.getItem('checkoutProgress') || '{}')
  if (progress.currentStep) {
    trackAbandonedCheckout(progress.currentStep, progress.formData)
  }
}, 5 * 60 * 1000)
```

### Step 5: Submit Company Order

```javascript
async function submitCompanyOrder(orderData) {
  const userId = localStorage.getItem('userId')
  const checkoutToken = localStorage.getItem('checkoutToken')
  const email = localStorage.getItem('checkoutEmail')
  
  try {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        checkoutToken,
        ...orderData
      })
    })
    
    const { orderId, companyId } = await response.json()
    
    // Store order ID
    localStorage.setItem('orderId', orderId)
    localStorage.setItem('companyId', companyId)
    
    return { orderId, companyId }
  } catch (error) {
    console.error('Order submission failed:', error)
    throw error
  }
}
```

### Step 6: Upload Payment Receipt

```javascript
async function uploadPaymentReceipt(file) {
  const email = localStorage.getItem('checkoutEmail')
  const checkoutToken = localStorage.getItem('checkoutToken')
  const orderId = localStorage.getItem('orderId')
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('email', email)
  formData.append('orderId', orderId)
  formData.append('checkoutToken', checkoutToken)
  
  try {
    const response = await fetch('/api/payment-receipt/upload', {
      method: 'POST',
      body: formData
    })
    
    const { receiptId, fileUrl } = await response.json()
    
    // Store receipt info
    localStorage.setItem('receiptId', receiptId)
    localStorage.setItem('receiptUrl', fileUrl)
    
    return { receiptId, fileUrl }
  } catch (error) {
    console.error('Receipt upload failed:', error)
    throw error
  }
}
```

---

## Code Examples

### Complete Checkout Component

```javascript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutFlow() {
  const [step, setStep] = useState('email')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('checkoutProgress')
    if (saved) {
      const { currentStep, formData: savedData } = JSON.parse(saved)
      setStep(currentStep)
      setFormData(savedData)
    }
  }, [])
  
  // Auto-save progress
  useEffect(() => {
    saveCheckoutProgress(step, formData)
  }, [step, formData])
  
  const handleStepSubmit = async (stepData) => {
    setLoading(true)
    try {
      const updated = { ...formData, ...stepData }
      setFormData(updated)
      
      // API calls based on step
      if (step === 'email') {
        await initializeCheckout(stepData.email)
        setStep('account')
      } else if (step === 'account') {
        await createUserAccount(updated)
        setStep('company')
      } else if (step === 'company') {
        setStep('addons')
      } else if (step === 'addons') {
        setStep('review')
      } else if (step === 'review') {
        const { orderId } = await submitCompanyOrder(updated)
        setStep('payment')
      } else if (step === 'payment') {
        router.push('/checkout/success')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // Show error to user
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="checkout-container">
      {step === 'email' && <EmailStep onSubmit={handleStepSubmit} />}
      {step === 'account' && <AccountStep onSubmit={handleStepSubmit} />}
      {step === 'company' && <CompanyStep onSubmit={handleStepSubmit} />}
      {step === 'addons' && <AddOnsStep onSubmit={handleStepSubmit} />}
      {step === 'review' && <ReviewStep onSubmit={handleStepSubmit} />}
      {step === 'payment' && <PaymentStep onSubmit={handleStepSubmit} />}
    </div>
  )
}
```

### IndexDB Helper Functions

```javascript
// Initialize IndexDB
function initIndexDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BuzzFilingCheckout', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('checkoutHistory')) {
        db.createObjectStore('checkoutHistory', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('formData')) {
        db.createObjectStore('formData', { keyPath: 'step' })
      }
    }
  })
}

// Save to IndexDB
async function saveToIndexDB(storeName, data) {
  const db = await initIndexDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  return store.add(data)
}

// Query IndexDB
async function queryIndexDB(storeName, query) {
  const db = await initIndexDB()
  const tx = db.transaction(storeName, 'readonly')
  const store = tx.objectStore(storeName)
  return store.getAll(query)
}
```

---

## Best Practices

### 1. **Error Handling**
```javascript
// Always handle API errors gracefully
try {
  await apiCall()
} catch (error) {
  // Save error to analytics
  trackError(error)
  // Show user-friendly message
  showErrorToast('Something went wrong. Your progress was saved.')
  // Don't lose user data
  saveCheckoutProgress(currentStep, formData)
}
```

### 2. **Security**
- Never store sensitive data in localStorage (passwords, full credit cards)
- Use HTTPS for all API calls
- Validate all inputs server-side
- Use CSRF tokens for POST requests
- Keep checkout token short-lived (30 minutes)

### 3. **Performance**
```javascript
// Debounce auto-save to reduce API calls
const debouncedSave = debounce(trackAbandonedCheckout, 1000)

const handleFormChange = (data) => {
  setFormData(data)
  debouncedSave(currentStep, data)
}
```

### 4. **User Experience**
- Show loading states during API calls
- Display clear progress indicator (Step 1 of 5)
- Restore incomplete checkouts automatically
- Show estimated time to complete
- Allow editing previous steps
- Confirm before leaving checkout page

### 5. **Recovery**
```javascript
// On app load, check for incomplete checkout
useEffect(() => {
  const checkoutToken = localStorage.getItem('checkoutToken')
  const progress = localStorage.getItem('checkoutProgress')
  
  if (checkoutToken && progress) {
    const { currentStep, formData } = JSON.parse(progress)
    // Show "Continue where you left off" message
    showRecoveryPrompt(currentStep, formData)
  }
}, [])
```

### 6. **Analytics**
```javascript
// Track checkout funnel
function trackCheckoutEvent(step, action, data) {
  analytics.track('Checkout', {
    step,
    action,
    data,
    timestamp: Date.now(),
    sessionId: localStorage.getItem('checkoutToken')
  })
}

// Example usage
trackCheckoutEvent('email', 'step_started', {})
trackCheckoutEvent('account', 'form_filled', { fields: ['email', 'password'] })
trackCheckoutEvent('review', 'order_submitted', { orderId: '123' })
```

---

## Summary

This checkout architecture provides:
- ✅ Secure token-based sessions
- ✅ Multi-step form flow
- ✅ Automatic progress tracking
- ✅ Abandoned cart recovery
- ✅ Local caching for fast UX
- ✅ Flexible storage options
- ✅ Complete API integration

Use this guide to implement a robust, user-friendly checkout experience for Buzz Filing.
