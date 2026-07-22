# Creating Reusable Checkout Pages - Implementation Guide

## Overview

This guide shows how to create **multiple checkout variants** (simplified, modal, multi-product) that all reuse the same 6 APIs and storage infrastructure.

---

## Architecture Pattern

\`\`\`
Shared Layer
├── API Client (checkoutAPI)
├── Storage Layer (localStorage + IndexedDB)
└── Hooks (useCheckout, usePayment)

Checkout Variants
├── Traditional 6-Step Checkout
├── Simplified 3-Step Checkout
├── Add-on Purchase Modal
└── Quick Checkout Widget
\`\`\`

---

## Variant 1: Simplified 3-Step Checkout

**Use Case:** Faster checkout for returning customers

**Steps:**
1. Account (Email/Password)
2. Quick Details (Company Name, State, Package)
3. Payment

**Implementation:**

\`\`\`typescript
// app/checkout/simplified/page.tsx
'use client';

import { useState } from 'react';
import { checkoutAPI } from '@/lib/api-client';
import { useCheckout } from '@/hooks/useCheckout';

export default function SimplifiedCheckoutPage() {
  const { step, checkoutData, saveData, nextStep } = useCheckout();

  if (step === 0) {
    return <AccountStepSimplified onNext={nextStep} />;
  }

  if (step === 1) {
    return <QuickDetailsStep onNext={nextStep} />;
  }

  if (step === 2) {
    return <PaymentStepSimplified />;
  }

  return null;
}

// Step 1: Account Setup
function AccountStepSimplified({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate token
      const tokenData = await checkoutAPI.generateToken(email);

      // Sign up
      const signupData = await checkoutAPI.signup(email, password);

      // Save to localStorage
      localStorage.setItem('authToken', signupData.authToken);
      localStorage.setItem('userId', signupData.userId);

      // Track in abandoned checkouts
      await checkoutAPI.trackAbandonedCheckout(
        tokenData.checkoutId,
        0,
        { email, step: 0 }
      );

      onNext();
    } catch (error) {
      console.error('[v0] Signup error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Quick Checkout</h1>
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
    </div>
  );
}

// Step 2: Quick Details
function QuickDetailsStep({ onNext }: { onNext: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('DE');
  const [packageType, setPackageType] = useState('standard');
  const { saveData } = useCheckout();

  function handleNext() {
    saveData({
      companyName,
      state,
      packageType,
      step: 1
    });

    // Track progress
    checkoutAPI.trackAbandonedCheckout(
      localStorage.getItem('checkoutId') || '',
      1,
      { companyName, state, packageType }
    );

    onNext();
  }

  return (
    <div className="max-w-md mx-auto">
      <h2>Company Details</h2>
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company Name"
        required
      />
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option value="DE">Delaware</option>
        <option value="CA">California</option>
        <option value="NY">New York</option>
      </select>
      <select
        value={packageType}
        onChange={(e) => setPackageType(e.target.value)}
      >
        <option value="basic">Basic - $99</option>
        <option value="standard">Standard - $199</option>
        <option value="premium">Premium - $299</option>
      </select>
      <button onClick={handleNext}>Continue to Payment</button>
    </div>
  );
}

// Step 3: Payment
function PaymentStepSimplified() {
  const [loading, setLoading] = useState(false);
  const checkoutData = JSON.parse(
    localStorage.getItem('checkoutData') || '{}'
  );

  async function handlePayment() {
    setLoading(true);

    try {
      const authToken = localStorage.getItem('authToken');
      const checkoutToken = localStorage.getItem('checkoutToken');

      // Create company order
      const companyData = await checkoutAPI.createCompany({
        name: checkoutData.companyName,
        type: 'LLC',
        state: checkoutData.state,
        email: checkoutData.email,
        packageType: checkoutData.packageType,
        orderData: {
          packagePrice: 199,
          stateFilingFee: 150,
          total: 349
        }
      });

      // Clear session
      localStorage.removeItem('checkoutData');
      localStorage.removeItem('checkoutToken');

      // Redirect
      window.location.href = `/payment-status?orderId=${companyData.orderId}`;
    } catch (error) {
      console.error('[v0] Payment error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2>Payment</h2>
      <div className="summary">
        <p>Company: {checkoutData.companyName}</p>
        <p>State: {checkoutData.state}</p>
        <p className="total">Total: $349</p>
      </div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Complete Purchase'}
      </button>
    </div>
  );
}
\`\`\`

---

## Variant 2: Add-on Purchase Modal

**Use Case:** Upsell additional services mid-checkout

**Implementation:**

\`\`\`typescript
// components/checkout/addons-modal.tsx
'use client';

import { useState } from 'react';
import { checkoutAPI } from '@/lib/api-client';

interface AddonsModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export function AddonsModal({ orderId, onClose, onSuccess }: AddonsModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addons = [
    { id: 'itin', name: 'ITIN Number', price: 99 },
    { id: 'website', name: 'Website Setup', price: 149 },
    { id: 'trademark', name: 'Trademark Filing', price: 199 },
    { id: 'bookkeeping', name: 'Bookkeeping', price: 79 }
  ];

  const selectedTotal = addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  function toggleAddon(addonId: string) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  }

  async function handlePurchase() {
    if (selectedAddons.length === 0) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      const authToken = localStorage.getItem('authToken');

      // Call addon purchase API
      const response = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          orderId,
          addons: selectedAddons,
          totalAmount: selectedTotal
        })
      });

      if (!response.ok) throw new Error('Purchase failed');

      const result = await response.json();

      // Track in abandoned checkouts (if still in checkout flow)
      const checkoutId = localStorage.getItem('checkoutId');
      if (checkoutId) {
        await checkoutAPI.trackAbandonedCheckout(checkoutId, 4, {
          selectedAddons,
          addonsCost: selectedTotal
        });
      }

      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('[v0] Addon purchase error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Premium Services</h2>

        <div className="addons-list">
          {addons.map((addon) => (
            <label key={addon.id} className="addon-item">
              <input
                type="checkbox"
                checked={selectedAddons.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
              />
              <div>
                <span className="name">{addon.name}</span>
                <span className="price">${addon.price}</span>
              </div>
            </label>
          ))}
        </div>

        {selectedTotal > 0 && (
          <div className="summary">
            <p>Selected Total: ${selectedTotal}</p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>
            Skip
          </button>
          <button onClick={handlePurchase} disabled={loading}>
            {loading ? 'Processing...' : `Add to Order ($${selectedTotal})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Usage in checkout
export function CheckoutWithAddons() {
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  async function handleCheckoutComplete(newOrderId: string) {
    setOrderId(newOrderId);
    setShowAddonsModal(true);
  }

  return (
    <>
      {/* Your checkout flow */}
      <CheckoutFlow onComplete={handleCheckoutComplete} />

      {/* Addons modal */}
      {showAddonsModal && (
        <AddonsModal
          orderId={orderId}
          onClose={() => setShowAddonsModal(false)}
          onSuccess={(result) => {
            alert('Addons purchased successfully!');
            window.location.href = `/order-confirmation?orderId=${orderId}`;
          }}
        />
      )}
    </>
  );
}
\`\`\`

---

## Variant 3: Quick Checkout Widget

**Use Case:** Embedded widget on landing page

**Implementation:**

\`\`\`typescript
// components/checkout/quick-checkout-widget.tsx
'use client';

import { useState } from 'react';
import { checkoutAPI } from '@/lib/api-client';

export function QuickCheckoutWidget() {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'details' | 'processing'>('email');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate checkout token
      const tokenData = await checkoutAPI.generateToken(email);

      // Store email
      localStorage.setItem('userEmail', email);
      localStorage.setItem('checkoutId', tokenData.checkoutId);

      // Track
      await checkoutAPI.trackAbandonedCheckout(
        tokenData.checkoutId,
        0,
        { email, source: 'widget' }
      );

      setStep('details');
    } catch (error) {
      console.error('[v0] Widget error:', error);
      alert('Error starting checkout');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Start Checkout
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg p-6">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-2 right-2 text-gray-500"
      >
        ✕
      </button>

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit}>
          <h3>Start Your Business Today</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Starting...' : 'Get Started'}
          </button>
        </form>
      )}

      {step === 'details' && <QuickDetailsFormWidget onComplete={() => setStep('processing')} />}

      {step === 'processing' && (
        <div className="text-center">
          <p>Redirecting to checkout...</p>
        </div>
      )}
    </div>
  );
}
\`\`\`

---

## Variant 4: Multi-Product Checkout

**Use Case:** Checkout for multiple company types or services

**Implementation:**

\`\`\`typescript
// app/checkout/multi-product/page.tsx
'use client';

import { useState } from 'react';
import { checkoutAPI } from '@/lib/api-client';
import { useCheckout } from '@/hooks/useCheckout';

const PRODUCTS = [
  { id: 'llc', name: 'LLC Formation', price: 199 },
  { id: 's-corp', name: 'S-Corp Formation', price: 249 },
  { id: 'nonprofit', name: 'Non-Profit Formation', price: 149 }
];

export default function MultiProductCheckout() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [step, setStep] = useState<'products' | 'account' | 'details' | 'payment'>('products');
  const { checkoutData, saveData, nextStep } = useCheckout();

  function handleProductSelect(productId: string) {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  async function handleProceed() {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    saveData({
      selectedProducts,
      productsData: PRODUCTS.filter((p) =>
        selectedProducts.includes(p.id)
      )
    });

    setStep('account');
  }

  const selectedTotal = PRODUCTS.filter((p) =>
    selectedProducts.includes(p.id)
  ).reduce((sum, p) => sum + p.price, 0);

  if (step === 'products') {
    return (
      <div className="max-w-2xl mx-auto">
        <h1>Select Your Formation Type</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductSelect(product.id)}
              className={`p-4 border rounded cursor-pointer ${
                selectedProducts.includes(product.id)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <h3>{product.name}</h3>
              <p className="text-2xl font-bold">${product.price}</p>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={() => handleProductSelect(product.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <p>Total: ${selectedTotal}</p>
          <button onClick={handleProceed}>Continue</button>
        </div>
      </div>
    );
  }

  // Other steps similar to simplified checkout...

  return null;
}
\`\`\`

---

## Sharing Components Between Variants

### **Reusable Payment Component**

\`\`\`typescript
// components/checkout/shared-payment-component.tsx
interface SharedPaymentProps {
  amount: number;
  orderId: string;
  onSuccess: (result: any) => void;
  onError: (error: Error) => void;
}

export async function processPayment({
  amount,
  orderId,
  onSuccess,
  onError
}: SharedPaymentProps) {
  try {
    const authToken = localStorage.getItem('authToken');
    const checkoutToken = localStorage.getItem('checkoutToken');

    // Create order
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Checkout-Token': checkoutToken || ''
      },
      body: JSON.stringify({
        amount,
        orderId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) throw new Error('Payment failed');

    const result = await response.json();
    onSuccess(result);
  } catch (error) {
    onError(error as Error);
  }
}
\`\`\`

### **Reusable Promo Code Component**

\`\`\`typescript
// components/checkout/shared-promo-code.tsx
interface SharedPromoProps {
  amount: number;
  onApply: (discount: number) => void;
}

export function SharedPromoCodeInput({ amount, onApply }: SharedPromoProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    setLoading(true);

    try {
      const data = await checkoutAPI.validatePromoCode(
        code,
        'standard',
        'DE'
      );

      if (!data.valid) {
        alert('Invalid promo code');
        return;
      }

      const discount = (amount * data.discountValue) / 100;
      onApply(discount);
    } catch (error) {
      console.error('[v0] Promo validation error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter promo code"
      />
      <button onClick={handleApply} disabled={loading}>
        Apply
      </button>
    </div>
  );
}
\`\`\`

---

## Data Flow Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     All Checkout Variants                   │
├─────────────────────────────────────────────────────────────┤
│ Simplified │ Modal │ Widget │ Multi-Product                 │
└──────────────┬──────────────┬──────────────┬─────────────────┘
               │              │              │
               └──────────────┴──────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │          Shared Hook: useCheckout       │
         │         (State Management)              │
         └────────────────────┬────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │       Shared API Client: checkoutAPI    │
         │         (Endpoint Management)           │
         └────────────────────┬────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │    Shared Storage Layer                 │
         │   (localStorage + IndexedDB)            │
         └────────────────────┬────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │          6 Core APIs                    │
         │  (All variants use same endpoints)      │
         └─────────────────────────────────────────┘
\`\`\`

---

## Migration from One Variant to Another

Users can be seamlessly transferred between checkout types:

\`\`\`typescript
// Redirect to simplified checkout
function redirectToSimplified(email: string) {
  // Save session
  localStorage.setItem('userEmail', email);

  // Redirect
  window.location.href = `/checkout/simplified?email=${email}`;
}

// Redirect to full checkout
function redirectToFull(email: string) {
  localStorage.setItem('userEmail', email);
  window.location.href = `/checkout?email=${email}`;
}
\`\`\`

---

## Summary

**All checkout variants share:**
- ✅ Same 6 APIs
- ✅ Same storage layer
- ✅ Same authentication mechanism
- ✅ Same abandoned checkout tracking
- ✅ Same promo code system

**Benefits:**
- 🚀 Faster development
- 🔄 Consistent user experience
- 📊 Unified analytics/tracking
- 🛠️ Easy maintenance
- 💾 Shared data across flows
