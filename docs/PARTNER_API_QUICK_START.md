# White-Label Partner Checkout API - Quick Start Guide

## For Your Partner (Integration Guide)

### Step 1: Get API Credentials

1. Your partner will receive:
   - **API Key**: `pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Webhook Secret**: Used to verify incoming webhooks
   - **Partner ID**: `partner_123`

2. Store these securely in environment variables:
```bash
BUZZFILING_API_KEY=pk_xxxxxx
BUZZFILING_WEBHOOK_SECRET=xxxxx
BUZZFILING_PARTNER_ID=partner_123
```

### Step 2: Create Checkout Form

Partners add an HTML form to their website:

```html
<form action="/api/create-checkout" method="POST">
  <input type="text" name="businessName" placeholder="Business Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <select name="state" required>
    <option value="TX">Texas</option>
    <option value="CA">California</option>
  </select>
  <select name="packageType" required>
    <option value="standard">Standard - $299</option>
    <option value="plus">Plus - $499</option>
  </select>
  <button type="submit">Form LLC with BuzzFiling</button>
</form>
```

### Step 3: Implement Backend Handler

Backend should call BuzzFiling API:

```javascript
// POST /api/create-checkout
const response = await fetch('https://buzzfiling.com/api/partners/checkout/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.BUZZFILING_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    businessName: req.body.businessName,
    email: req.body.email,
    state: req.body.state,
    packageType: req.body.packageType,
    addons: req.body.addons || [],
    redirectUrl: 'https://partner.com/success'
  })
})

const data = await response.json()
res.json(data)
```

### Step 4: Handle Webhooks

Partners must register webhook endpoint to receive order notifications:

```javascript
// POST /api/webhooks/buzzfiling
const crypto = require('crypto')

const signature = req.headers['x-buzzfiling-signature']
const payload = req.rawBody
const expected = crypto
  .createHmac('sha256', process.env.BUZZFILING_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex')

if (signature !== expected) {
  return res.status(401).json({ error: 'Invalid signature' })
}

const event = req.body
if (event.event === 'checkout.completed') {
  // Store order in partner's database
  // Send confirmation email
  // Update customer dashboard
}

res.json({ success: true })
```

### Step 5: Retrieve Orders

Partners can fetch their completed orders:

```javascript
const response = await fetch(
  'https://buzzfiling.com/api/partners/partner_123/orders?status=completed',
  {
    headers: { 'Authorization': `Bearer ${process.env.BUZZFILING_API_KEY}` }
  }
)
const { data } = await response.json()
```

---

## For You (Admin Setup)

### 1. Add Partner via Dashboard

1. Go to Admin Dashboard
2. Click "White-Label Partners" > "Add Partner"
3. Fill in partner details:
   - Partner Name: `Acme Corp`
   - Domain: `partner.acmecorp.com`
   - Webhook URL: `https://partner.acmecorp.com/api/webhooks/buzzfiling`

### 2. Generate API Keys

1. In Partner Dashboard, click "New Key"
2. Give it a name: `Production API Key`
3. Share the key and secret with partner (ONLY ONE TIME)

### 3. Monitor Webhook Delivery

1. Go to Admin Dashboard > Partners > Select Partner
2. View webhook delivery status and retry failed webhooks
3. Monitor API usage and rate limits

---

## Testing Checklist

- [ ] Partner receives checkout form with all fields
- [ ] Form submits to partner's backend
- [ ] Partner backend calls BuzzFiling API with correct API key
- [ ] BuzzFiling returns checkout URL
- [ ] User redirected to checkout
- [ ] User completes payment
- [ ] Webhook sent to partner's endpoint
- [ ] Partner verifies webhook signature successfully
- [ ] Partner stores order in database
- [ ] Partner retrieves orders via GET /orders API
- [ ] All order statuses are correct (pending → payment_received → processing → completed)

---

## API Response Format Reference

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Rate Limits

- **Checkout Creation**: 100 requests per minute per API key
- **Order Retrieval**: 1000 requests per minute
- **Webhook Delivery**: Automatic retries with exponential backoff

---

## Common Issues & Troubleshooting

### Issue: "Invalid API key format"
**Solution**: Ensure API key starts with `pk_` and is 56 characters total

### Issue: "Missing required field"
**Solution**: Verify all required fields (businessName, email, state, packageType) are included

### Issue: "Cannot access other partner's orders"
**Solution**: Ensure the partner ID in the URL matches the authenticated partner

### Issue: Webhooks not being received
**Solution**: 
1. Verify webhook URL is publicly accessible
2. Check that endpoint returns 200 OK
3. Verify webhook secret is correct
4. Check server logs for webhook attempts

### Issue: "Authentication failed"
**Solution**: Ensure Authorization header format is `Bearer {API_KEY}` with space between

---

## Next Steps

1. Share API credentials securely with partner
2. Provide them with the full documentation (`/docs/PARTNER_API_DOCUMENTATION.md`)
3. Test integration in staging environment
4. Monitor webhook deliveries
5. Go live!

---

## Support

For implementation questions:
- Reference: `/docs/PARTNER_API_DOCUMENTATION.md`
- Examples: `/lib/partner-integration-examples.ts`
- Admin Dashboard: `/components/admin/partner-management-dashboard.tsx`
