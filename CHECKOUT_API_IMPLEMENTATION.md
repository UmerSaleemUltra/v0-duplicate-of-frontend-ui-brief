# Checkout API Implementation Guide

## Overview

This guide explains how to integrate the checkout API into your form. The API processes LLC/C-Corp formation orders with member details, business information, and payment data.

## Default Package Configuration

The **Starter package is set as the default** throughout the system:

- **Default Package**: `Starter`
- **Starter Price**: $249 USD
- **Advance Price**: $349 USD
- **Exchange Rate**: 1 USD = 285 PKR

Reference the default in:
- Form initialization: `const [pkg, setPkg] = useState<"Starter" | "Advance">("Starter")`
- Config file: `/lib/checkout-config.ts` → `DEFAULT_PACKAGE: 'Starter'`

---

## API Architecture

### 1. **Main Endpoint: POST /api/checkout/submit**

**Purpose**: Submit complete checkout form data

**Request Body**:
```typescript
{
  account: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    terms: boolean;
  };
  formation: {
    state: string;                    // e.g., "Wyoming"
    entity: "LLC" | "C-Corp";
    package: "Starter" | "Advance";  // Defaults to "Starter"
    priceUSD: number;                // 249 for Starter, 349 for Advance
  };
  business: {
    businessName: string;
    website: string;
    category: string;
    description: string;             // Min 20 characters
  };
  members: Array<{
    id: string;
    responsible: boolean;
    fullLegalName: string;
    homeAddress: string;
    city: string;
    stateProvince: string;
    country: string;
    zip: string;
    ssn: string;
    idFileName: string;
  }>;
  payment: {
    method: "already" | "make";
    whatsapp: string;
    receiptFileName: string;         // Required if method is "make"
  };
}
```

**Response - Success (201)**:
```typescript
{
  success: true;
  orderId: string;                   // e.g., "ORDER-1704067200000-abc123def"
  message: string;                   // Confirmation message with orderId
}
```

**Response - Validation Error (400)**:
```typescript
{
  success: false;
  message: "Validation failed";
  errors: {
    "account.email": "Valid email is required",
    "formation.package": "Invalid package",
    "members": "At least one Responsible Party is required",
    // ... more field-specific errors
  };
}
```

**Response - Server Error (500)**:
```typescript
{
  success: false;
  message: "An error occurred during checkout";
}
```

---

## File Structure

```
/app/api/checkout/submit/route.ts    ← Main API endpoint
/lib/checkout-config.ts               ← Centralized configuration
/lib/hooks/useCheckoutSubmit.ts       ← React hook for API calls
```

### Files to Update

Update your checkout form component to use the new API:

**Location**: Your existing checkout page component

**Changes needed**:
1. Import the hook
2. Replace the `onSubmit` handler
3. Use the hook's response to manage submission state

---

## Implementation Steps

### Step 1: Install/Verify Dependencies

No new dependencies needed. Uses only:
- `next/server` (already included)
- Built-in `fetch` API

### Step 2: Import in Your Form Component

```typescript
'use client';

import { useCheckoutSubmit, type CheckoutPayload } from '@/lib/hooks/useCheckoutSubmit';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

// In your component:
const { submit, loading, error, orderId } = useCheckoutSubmit();
```

### Step 3: Update Form Submission

Replace your current `onSubmit` function with:

```typescript
const onSubmit = async (ev: React.FormEvent) => {
  ev.preventDefault();
  
  if (!validate()) {
    const first = document.querySelector("[data-error='true']");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Build payload with Starter as default
  const payload: CheckoutPayload = {
    account: { 
      fullName, 
      phone, 
      email, 
      password, 
      terms 
    },
    formation: { 
      state: formationState, 
      entity: entityType, 
      package: pkg || 'Starter',  // Defaults to Starter
      priceUSD: CHECKOUT_CONFIG.PRICING[pkg || 'Starter']
    },
    business: { 
      businessName, 
      website, 
      category, 
      description 
    },
    members,
    payment: { 
      method: paymentMethod, 
      whatsapp, 
      receiptFileName 
    },
  };

  // Submit to API
  const result = await submit(payload);

  if (result.success) {
    // Clear persisted data on successful submission
    clearCheckoutData();
    await clearAllFiles();
    
    // Show success state and redirect
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = CHECKOUT_CONFIG.REDIRECT_URL;
    }, CHECKOUT_CONFIG.TIMEOUTS.REDIRECT_DELAY);
  } else {
    // Handle validation errors or server errors
    if (result.errors) {
      setErrors(result.errors);
    } else {
      // Show generic error
      console.error('Checkout failed:', result.message);
    }
  }
};
```

### Step 4: Update Conditional Rendering

Show loading state while submitting:

```typescript
<button 
  type="submit" 
  disabled={loading}
  className={loading ? 'opacity-50 cursor-not-allowed' : ''}
>
  {loading ? 'Processing...' : 'Submit Order'}
</button>

{error && (
  <div className="bg-red-50 border border-red-200 p-4 rounded text-red-800">
    {error}
  </div>
)}
```

---

## Configuration Reference

All settings are in `/lib/checkout-config.ts`:

```typescript
CHECKOUT_CONFIG = {
  // Default is 'Starter'
  DEFAULT_PACKAGE: 'Starter',
  
  // Pricing (Starter is $249)
  PRICING: {
    Starter: 249,
    Advance: 349,
  },
  
  // Exchange rates
  EXCHANGE_RATES: {
    PKR: 285,
  },
  
  // API endpoints
  API: {
    SUBMIT: '/api/checkout/submit',
  },
  
  // Validation rules
  VALIDATION: {
    PHONE: { MIN_DIGITS: 6, MAX_DIGITS: 15 },
    PASSWORD: { MIN_LENGTH: 8 },
    DESCRIPTION: { MIN_LENGTH: 20 },
  },
}
```

To change any setting, modify `/lib/checkout-config.ts`.

---

## Database Integration (TODO)

The API is ready for database integration. Uncomment and implement in `/app/api/checkout/submit/route.ts`:

```typescript
// TODO: Save to database
await db.orders.create({
  orderId,
  email: payload.account.email,
  fullName: payload.account.fullName,
  businessName: payload.business.businessName,
  formationState: payload.formation.state,
  entityType: payload.formation.entity,
  package: payload.formation.package,  // "Starter" by default
  priceUSD: payload.formation.priceUSD,
  members: payload.members,
  paymentMethod: payload.payment.method,
  whatsappNumber: payload.payment.whatsapp,
  createdAt: new Date(),
  status: 'pending',
});

// TODO: Send confirmation email
await sendEmail({
  to: payload.account.email,
  template: 'checkout-confirmation',
  data: {
    orderId,
    businessName: payload.business.businessName,
    package: payload.formation.package,
  }
});
```

---

## Validation Rules

The API validates all fields automatically:

| Field | Rule |
|-------|------|
| Full Name | Required, non-empty |
| Email | Must be valid email format |
| Password | Minimum 8 characters |
| Terms | Must be accepted (true) |
| State | Required |
| Entity | Must be "LLC" or "C-Corp" |
| Package | Must be "Starter" or "Advance" |
| Business Name | Required, non-empty |
| Description | Minimum 20 characters |
| Members | At least 1, at least 1 responsible |
| Member Name | Required |
| Member Address | Required |
| WhatsApp | 7-15 digits |
| Receipt | Required if payment method is "make" |

---

## Error Handling

### Client-Side (in your form)

```typescript
const { submit, loading, error } = useCheckoutSubmit();

// Check for errors
if (error) {
  // Display error to user
  console.error('Submission error:', error);
}
```

### API-Side Validation Errors

```typescript
if (!result.success && result.errors) {
  // result.errors contains field-specific error messages
  Object.entries(result.errors).forEach(([field, message]) => {
    console.error(`${field}: ${message}`);
  });
}
```

---

## Testing the API

### Using cURL

```bash
curl -X POST http://localhost:3000/api/checkout/submit \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "fullName": "John Doe",
      "phone": "3001234567",
      "email": "john@example.com",
      "password": "SecurePass123",
      "terms": true
    },
    "formation": {
      "state": "Wyoming",
      "entity": "LLC",
      "package": "Starter",
      "priceUSD": 249
    },
    "business": {
      "businessName": "Tech Innovations LLC",
      "website": "https://techinnovations.com",
      "category": "Technology & Software Development",
      "description": "We provide cutting-edge software solutions for businesses worldwide."
    },
    "members": [{
      "id": "member-1",
      "responsible": true,
      "fullLegalName": "John Doe",
      "homeAddress": "123 Main St",
      "city": "Laramie",
      "stateProvince": "Wyoming",
      "country": "United States",
      "zip": "82070",
      "ssn": "123-45-6789",
      "idFileName": "john-id.pdf"
    }],
    "payment": {
      "method": "already",
      "whatsapp": "+923001234567",
      "receiptFileName": "receipt.pdf"
    }
  }'
```

### Using Postman

1. Create new POST request to `http://localhost:3000/api/checkout/submit`
2. Set header: `Content-Type: application/json`
3. Paste the JSON body from above
4. Click Send

---

## Important Notes

### Starter Package Default

- The system defaults to **"Starter"** ($249) throughout
- This is set in: form state, config file, and pricing logic
- Always reference `CHECKOUT_CONFIG.PRICING[pkg]` to get correct price
- Package is **REQUIRED** in the submission payload

### API Response Time

- Normal: 1-3 seconds
- Timeout: 30 seconds (configurable in `CHECKOUT_CONFIG.TIMEOUTS.SUBMISSION`)

### Order ID Format

- Format: `ORDER-{timestamp}-{random}`
- Example: `ORDER-1704067200000-abc123def`
- Always check `result.orderId` for successful submissions

### Security

- All input is validated server-side
- Errors are field-specific but don't expose sensitive info
- Password should be hashed before database storage (TODO)
- Use HTTPS in production

---

## Next Steps

1. ✅ Copy the 3 files above into your project
2. ✅ Import `useCheckoutSubmit` in your form component
3. ✅ Update the `onSubmit` handler with provided code
4. ✅ Test locally using cURL or Postman
5. ⏳ Implement database integration (see TODO section)
6. ⏳ Add email confirmation sending
7. ⏳ Add payment processing logic
8. ⏳ Set up monitoring/logging

---

## Support

For issues or questions:
- Check validation errors in API response
- Enable console logging in `useCheckoutSubmit` hook
- Review payload structure matches expected format
- Verify all required fields are included
