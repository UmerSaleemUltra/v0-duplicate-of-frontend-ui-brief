# BuzzFiling White-Label Checkout API

Complete guide for white-label partners to integrate BuzzFiling checkout into their applications.

## Overview

The BuzzFiling White-Label API allows partners to:
- Create checkout sessions on behalf of customers
- Track orders through webhooks
- Retrieve customer order history
- Manage API keys and authentication

## Getting Started

### 1. Authentication

All API requests require an `Authorization` header with your API key:

```
Authorization: Bearer pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are generated in the BuzzFiling Partner Dashboard and should be kept secret.

### 2. Base URL

```
https://buzzfiling.com/api/partners
```

---

## API Endpoints

### Create Checkout Session

**Endpoint:** `POST /checkout/create`

**Description:** Initiates a new checkout session. Returns a checkout URL that customers visit to complete payment.

**Request Headers:**
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "businessName": "Acme Corp",
  "email": "john@acmecorp.com",
  "phone": "+1 (555) 123-4567",
  "state": "TX",
  "packageType": "standard",
  "addons": ["registered-agent", "ein-filing"],
  "redirectUrl": "https://partner.com/success"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| businessName | string | Yes | Customer's business name |
| email | string | Yes | Customer's email address |
| phone | string | No | Customer's phone number |
| state | string | Yes | State for LLC formation (e.g., "TX", "CA") |
| packageType | string | Yes | Package tier: "starter", "standard", "plus" |
| addons | string[] | No | Additional services to include |
| redirectUrl | string | No | URL to redirect after checkout completion |

**Available Addons:**
- `registered-agent` - Registered agent service
- `ein-filing` - EIN application filing
- `business-address` - Registered business address
- `compliance-package` - Annual compliance package

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutSessionId": "session_abc123def456",
    "checkoutUrl": "https://buzzfiling.com/checkout?session=session_abc123def456&partner=partner_123",
    "expiresIn": 3600
  }
}
```

**Example Response Error:**
```json
{
  "success": false,
  "error": "Invalid state code"
}
```

**Redirect Customer:**
```javascript
window.location.href = response.data.checkoutUrl
```

---

### Get Partner Orders

**Endpoint:** `GET /{partnerId}/orders`

**Description:** Retrieve all orders created through your partner account with optional filtering and pagination.

**Request Headers:**
```
Authorization: Bearer {API_KEY}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status: pending, payment_received, processing, completed |
| page | integer | 1 | Page number for pagination |
| limit | integer | 50 | Records per page (max 100) |

**Example Request:**
```
GET /partner_123/orders?status=completed&page=1&limit=25
Authorization: Bearer pk_xxxxxx
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_789",
      "email": "john@acmecorp.com",
      "businessName": "Acme Corp",
      "state": "TX",
      "packageType": "standard",
      "addons": ["registered-agent"],
      "amount": 299.99,
      "status": "payment_received",
      "paymentMethod": "stripe",
      "createdAt": "2024-06-11T10:30:00Z",
      "updatedAt": "2024-06-11T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

---

## Webhooks

BuzzFiling sends webhook notifications to your registered webhook URL when important events occur.

### Webhook Events

#### `checkout.completed`

Sent when a customer successfully completes checkout and payment is received.

```json
{
  "event": "checkout.completed",
  "timestamp": "2024-06-11T10:35:00Z",
  "data": {
    "checkoutSessionId": "session_abc123",
    "orderId": "order_789",
    "email": "john@acmecorp.com",
    "businessName": "Acme Corp",
    "packageType": "standard",
    "addons": ["registered-agent"],
    "amount": 299.99,
    "status": "payment_received"
  }
}
```

#### `checkout.abandoned`

Sent when a checkout session expires without completion.

```json
{
  "event": "checkout.abandoned",
  "timestamp": "2024-06-11T11:30:00Z",
  "data": {
    "checkoutSessionId": "session_abc123",
    "email": "john@acmecorp.com",
    "businessName": "Acme Corp",
    "amount": 299.99
  }
}
```

### Webhook Signature Verification

All webhooks include an `X-Buzzfiling-Signature` header. Verify this signature to ensure the webhook is from BuzzFiling.

**Signature Format:** HMAC-SHA256 of the request body using your webhook secret.

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expected;
}

// In your webhook handler:
const payload = req.rawBody; // Raw request body as string
const signature = req.headers['x-buzzfiling-signature'];
const isValid = verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Setting Up Webhooks

Send your webhook URL to BuzzFiling support. We'll validate it with a test event.

---

## Implementation Examples

### HTML Form + JavaScript

**Partner's Website Form:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Create LLC with BuzzFiling</title>
</head>
<body>
  <h1>Form an LLC with BuzzFiling</h1>
  
  <form id="buzzfilingForm">
    <div>
      <label for="businessName">Business Name:</label>
      <input type="text" id="businessName" name="businessName" required />
    </div>
    
    <div>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required />
    </div>
    
    <div>
      <label for="phone">Phone:</label>
      <input type="tel" id="phone" name="phone" />
    </div>
    
    <div>
      <label for="state">State:</label>
      <select id="state" name="state" required>
        <option value="TX">Texas</option>
        <option value="CA">California</option>
        <option value="NY">New York</option>
        <!-- More states... -->
      </select>
    </div>
    
    <div>
      <label for="packageType">Package:</label>
      <select id="packageType" name="packageType" required>
        <option value="starter">Starter - $99</option>
        <option value="standard">Standard - $299</option>
        <option value="plus">Plus - $499</option>
      </select>
    </div>
    
    <label>
      <input type="checkbox" name="addons" value="registered-agent" />
      Include Registered Agent (+$99/year)
    </label>
    
    <button type="submit">Continue to Payment</button>
  </form>

  <script>
    document.getElementById('buzzfilingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const addons = Array.from(form.querySelectorAll('input[name="addons"]:checked'))
        .map(el => el.value);
      
      try {
        // Call your backend, which calls BuzzFiling API
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: form.businessName.value,
            email: form.email.value,
            phone: form.phone.value,
            state: form.state.value,
            packageType: form.packageType.value,
            addons: addons,
            redirectUrl: 'https://partner.com/success'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          // Redirect to BuzzFiling checkout
          window.location.href = data.data.checkoutUrl;
        } else {
          alert('Error: ' + data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to create checkout');
      }
    });
  </script>
</body>
</html>
```

### Node.js/Express Backend

**Partner's Backend (handles API communication):**

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const BUZZFILING_API_KEY = process.env.BUZZFILING_API_KEY;
const BUZZFILING_API_URL = 'https://buzzfiling.com/api/partners';

// Frontend calls this endpoint
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { businessName, email, phone, state, packageType, addons, redirectUrl } = req.body;
    
    // Validate input
    if (!businessName || !email || !state || !packageType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call BuzzFiling API
    const response = await fetch(`${BUZZFILING_API_URL}/checkout/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BUZZFILING_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName,
        email,
        phone,
        state,
        packageType,
        addons,
        redirectUrl: redirectUrl || 'https://partner.com/success'
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout' });
  }
});

// BuzzFiling sends webhooks here
app.post('/api/webhooks/buzzfiling', async (req, res) => {
  try {
    const signature = req.headers['x-buzzfiling-signature'];
    const payload = req.rawBody; // Make sure you capture raw body
    
    // Verify signature
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    // Handle different event types
    if (event.event === 'checkout.completed') {
      const { orderId, email, businessName, amount } = event.data;
      
      // TODO: Update your database with order info
      console.log(`Order completed: ${orderId} for ${email}`);
      
      // TODO: Send confirmation email to customer
      // TODO: Trigger post-processing (document generation, etc.)
    }
    
    if (event.event === 'checkout.abandoned') {
      const { email, businessName, amount } = event.data;
      
      // TODO: Send follow-up email to customer
      console.log(`Checkout abandoned: ${email}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized - Invalid API Key**
```json
{
  "success": false,
  "error": "Invalid API key format"
}
```

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "error": "Missing required field: state"
}
```

**403 Forbidden - Access Denied**
```json
{
  "success": false,
  "error": "Cannot access other partner's orders"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Partner not found"
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Max 100 requests per minute"
}
```

---

## Best Practices

1. **Store API Keys Securely** - Keep API keys in environment variables, never in code
2. **Use HTTPS Only** - All API calls must use HTTPS
3. **Verify Webhooks** - Always verify webhook signatures before processing
4. **Handle Retries** - Webhooks may be retried; implement idempotency
5. **Log Requests** - Log all API calls for debugging and auditing
6. **Rate Limiting** - Respect rate limits; implement exponential backoff

---

## Support

For API issues or questions:
- Email: support@buzzfiling.com
- Documentation: https://docs.buzzfiling.com
- Status Page: https://status.buzzfiling.com
