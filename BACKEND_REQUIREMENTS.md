# BuzzFiling Backend API Requirements

## Overview
This document outlines all backend API requirements for the BuzzFiling business formation SaaS platform.

**Business Model:**
- Users come from Meta ads → WhatsApp
- Orders placed via WhatsApp
- Users receive URL to fill checkout form
- Payment via Stripe OR Bank Transfer
- Bank transfer payments verified manually via WhatsApp
- All support and notifications handled via WhatsApp

**Technology Stack:**
- **Database**: MongoDB
- **File Storage**: Vercel Blob
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Custom Email Service (for password reset only)
- **Payment**: Stripe + Manual Bank Transfer Verification
- **Support**: WhatsApp (no in-app support system)
- **Notifications**: WhatsApp (no in-app notification system)

---

## 1. Authentication & Authorization

### API Endpoints

#### POST /api/auth/register
Create new user account during checkout
\`\`\`json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-0123"
}

Response:
{
  "success": true,
  "userId": "usr_123abc",
  "token": "jwt_token_here",
  "accountStatus": "pending_payment",
  "message": "Account created successfully. Please complete payment to access dashboard."
}
\`\`\`

#### GET /api/auth/check-access
Check if user can access dashboard
\`\`\`json
Response:
{
  "hasAccess": false,
  "accountStatus": "pending_payment", // pending_payment, active, suspended
  "message": "Payment verification required",
  "paymentDetails": {
    "orderId": "ord_789xyz",
    "amount": 889,
    "paymentMethods": ["stripe", "bank_transfer"]
  }
}
\`\`\`

#### POST /api/auth/login
User login
\`\`\`json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "usr_123abc",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "accountStatus": "active"
  },
  "hasAccess": true
}
\`\`\`

#### POST /api/auth/logout
Invalidate user session

#### POST /api/auth/refresh-token
Refresh JWT token

#### POST /api/auth/forgot-password
Send password reset email

#### POST /api/auth/reset-password
Reset password with token

---

## 1.5 Payment Gate & Dashboard Access Control

### Overview
Users CANNOT access the dashboard until their **INITIAL payment** is verified. This prevents unauthorized access and ensures only paying customers can use the platform.

### Access Control Logic
\`\`\`javascript
// Middleware: checkDashboardAccess
async function checkDashboardAccess(req, res, next) {
  const user = await User.findById(req.userId);
  
  if (user.accountStatus === 'pending_payment') {
    return res.status(403).json({
      hasAccess: false,
      message: "Payment required to access dashboard",
      redirectUrl: "/payment-pending"
    });
  }
  
  if (user.accountStatus === 'suspended') {
    return res.status(403).json({
      hasAccess: false,
      message: "Account suspended. Contact support via WhatsApp."
    });
  }
  
  next();
}
\`\`\`

### Payment Verification Flow
1. User completes checkout form
2. User selects payment method (Stripe OR Bank Transfer)
3. **If Stripe**: Instant verification via Stripe webhook
4. **If Bank Transfer**: User submits transaction reference → Admin verifies via WhatsApp → Manual approval
5. Once verified, `accountStatus` changes from `pending_payment` to `active`
6. User can now access dashboard

---

## 2. Order Management

### API Endpoints

#### POST /api/orders/create
Create new formation order
\`\`\`json
Request:
{
  "userId": "usr_123abc",
  "state": "Delaware",
  "package": "starter", // or "advanced"
  "businessInfo": {
    "name": "Tech Innovations LLC",
    "category": "technology",
    "address": "123 Main St",
    "city": "Wilmington",
    "zipCode": "19801",
    "website": "https://techinnovations.com"
  },
  "members": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "address": "456 Oak Ave",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "ssn": "123-45-6789", // optional
      "isResponsiblePerson": true
    }
  ],
  "addons": ["website", "itin", "reseller-certificate"],
  "pricing": {
    "package": 299,
    "stateFee": 90,
    "addons": 500,
    "total": 889
  }
}

Response:
{
  "success": true,
  "orderId": "ord_789xyz",
  "orderNumber": "BF-2025-001234",
  "status": "pending_payment",
  "totalAmount": 889,
  "paymentMethods": ["stripe", "bank_transfer"],
  "paymentUrl": "/checkout/payment?orderId=ord_789xyz"
}
\`\`\`

#### GET /api/orders/:orderId
Get order details
\`\`\`json
Response:
{
  "orderId": "ord_789xyz",
  "orderNumber": "BF-2025-001234",
  "userId": "usr_123abc",
  "status": "processing", // pending_payment, processing, completed, cancelled
  "createdAt": "2025-01-15T10:30:00Z",
  "businessInfo": { /* ... */ },
  "members": [ /* ... */ ],
  "addons": [ /* ... */ ],
  "pricing": { /* ... */ },
  "timeline": [
    {
      "step": "order_placed",
      "status": "completed",
      "completedAt": "2025-01-15T10:30:00Z"
    },
    {
      "step": "registered_agent_assigned",
      "status": "in_progress",
      "startedAt": "2025-01-15T11:00:00Z"
    },
    {
      "step": "business_mailing_address",
      "status": "pending"
    },
    {
      "step": "company_formation",
      "status": "pending"
    },
    {
      "step": "ein_processing",
      "status": "pending"
    },
    {
      "step": "boi_report",
      "status": "pending"
    }
  ]
}
\`\`\`

#### GET /api/orders/user/:userId
Get all orders for a user
\`\`\`json
Response:
{
  "orders": [
    {
      "orderId": "ord_789xyz",
      "orderNumber": "BF-2025-001234",
      "businessName": "Tech Innovations LLC",
      "status": "processing",
      "totalAmount": 889,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
\`\`\`

#### PATCH /api/orders/:orderId/status
Update order status (Admin only)
\`\`\`json
Request:
{
  "status": "processing",
  "step": "registered_agent_assigned",
  "stepStatus": "completed",
  "notes": "Registered agent assigned successfully"
}

Response:
{
  "success": true,
  "orderId": "ord_789xyz",
  "status": "processing",
  "updatedTimeline": [ /* ... */ ]
}
\`\`\`

#### GET /api/admin/orders
Get all orders (Admin only)
\`\`\`json
Query Parameters:
- status: filter by status
- state: filter by state
- dateFrom: start date
- dateTo: end date
- search: search by business name or order number
- page: pagination
- limit: items per page

Response:
{
  "orders": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`

---

## 3. Company Management

### API Endpoints

#### POST /api/companies/create
Create a new company for a user
\`\`\`json
Request:
{
  "userId": "usr_123abc",
  "businessName": "Green Energy Solutions LLC",
  "businessType": "LLC", // LLC, Corporation, S-Corp, C-Corp
  "state": "Texas",
  "category": "energy",
  "address": "456 Oak St",
  "city": "Austin",
  "zipCode": "78701",
  "website": "https://greenenergy.com",
  "ein": "12-3456789", // optional
  "formationDate": "2025-01-15" // optional
}

Response:
{
  "success": true,
  "companyId": "cmp_789xyz",
  "businessName": "Green Energy Solutions LLC",
  "status": "active",
  "createdAt": "2025-01-15T10:00:00Z"
}
\`\`\`

#### GET /api/companies/user/:userId
Get all companies for a user
\`\`\`json
Response:
{
  "companies": [
    {
      "companyId": "cmp_123abc",
      "businessName": "Acme Corporation LLC",
      "businessType": "LLC",
      "state": "Delaware",
      "status": "active", // active, processing, inactive
      "formationDate": "2024-06-15",
      "createdAt": "2024-06-01T10:00:00Z",
      "totalOrders": 1,
      "totalDocuments": 8,
      "totalMailItems": 12
    },
    {
      "companyId": "cmp_456def",
      "businessName": "Tech Innovations Inc",
      "businessType": "Corporation",
      "state": "California",
      "status": "processing",
      "formationDate": null,
      "createdAt": "2025-01-10T14:00:00Z",
      "totalOrders": 1,
      "totalDocuments": 3,
      "totalMailItems": 2
    }
  ],
  "total": 2
}
\`\`\`

#### GET /api/companies/:companyId
Get company details
\`\`\`json
Response:
{
  "companyId": "cmp_123abc",
  "userId": "usr_123abc",
  "businessName": "Acme Corporation LLC",
  "businessType": "LLC",
  "state": "Delaware",
  "category": "technology",
  "address": "123 Main St",
  "city": "Wilmington",
  "zipCode": "19801",
  "website": "https://acmecorp.com",
  "ein": "98-7654321",
  "formationDate": "2024-06-15",
  "status": "active",
  "registeredAgent": {
    "name": "Delaware Registered Agent Service",
    "address": "100 W 10th St, Wilmington, DE 19801"
  },
  "createdAt": "2024-06-01T10:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z"
}
\`\`\`

#### PATCH /api/companies/:companyId
Update company information
\`\`\`json
Request:
{
  "businessName": "Acme Corporation LLC",
  "address": "123 Main St, Suite 200",
  "website": "https://newacmecorp.com",
  "status": "active"
}

Response:
{
  "success": true,
  "companyId": "cmp_123abc",
  "updatedAt": "2025-01-15T15:00:00Z"
}
\`\`\`

#### DELETE /api/companies/:companyId
Delete/deactivate company (Admin only)

#### GET /api/admin/companies
Get all companies (Admin only)
\`\`\`json
Query Parameters:
- userId: filter by user
- state: filter by state
- status: filter by status
- businessType: filter by business type
- search: search by business name
- page: pagination
- limit: items per page

Response:
{
  "companies": [ /* ... */ ],
  "pagination": { /* ... */ },
  "stats": {
    "total": 1234,
    "active": 1100,
    "processing": 89,
    "inactive": 45,
    "byState": {
      "Delaware": 456,
      "Wyoming": 234,
      "Texas": 189
    },
    "byType": {
      "LLC": 789,
      "Corporation": 345,
      "S-Corp": 67,
      "C-Corp": 33
    }
  }
}
\`\`\`

---

## 4. Document Management

### API Endpoints

#### POST /api/documents/upload
Upload document (User or Admin)
\`\`\`json
Request (multipart/form-data):
{
  "file": File,
  "orderId": "ord_789xyz",
  "documentType": "articles_of_organization", // or "ein_letter", "operating_agreement", etc.
  "uploadedBy": "admin" // or "customer"
}

Response:
{
  "success": true,
  "documentId": "doc_456def",
  "fileName": "articles_of_organization.pdf",
  "fileSize": 245678,
  "uploadedAt": "2025-01-15T14:30:00Z",
  "downloadUrl": "/api/documents/download/doc_456def"
}
\`\`\`

#### GET /api/documents/order/:orderId
Get all documents for an order
\`\`\`json
Response:
{
  "documents": [
    {
      "documentId": "doc_456def",
      "fileName": "articles_of_organization.pdf",
      "documentType": "articles_of_organization",
      "fileSize": 245678,
      "uploadedBy": "admin",
      "uploadedAt": "2025-01-15T14:30:00Z",
      "downloadUrl": "/api/documents/download/doc_456def"
    }
  ]
}
\`\`\`

#### GET /api/documents/download/:documentId
Download document (returns file stream)

#### DELETE /api/documents/:documentId
Delete document (Admin only)

#### GET /api/admin/documents
Get all documents (Admin only)
\`\`\`json
Query Parameters:
- orderId: filter by order
- documentType: filter by type
- uploadedBy: filter by uploader
- dateFrom: start date
- dateTo: end date
- page: pagination
- limit: items per page

Response:
{
  "documents": [ /* ... */ ],
  "pagination": { /* ... */ }
}
\`\`\`

#### PATCH /api/documents/:documentId
Update document metadata (Admin only)
\`\`\`json
Request:
{
  "documentName": "Updated Document Name",
  "documentType": "operating_agreement",
  "category": "formation",
  "notes": "Updated notes"
}

Response:
{
  "success": true,
  "documentId": "doc_789ghi",
  "updatedAt": "2025-01-15T16:00:00Z"
}
\`\`\`

#### POST /api/documents/:documentId/share
Share document with another user (Admin only)
\`\`\`json
Request:
{
  "shareWithUserId": "usr_456def",
  "accessLevel": "view", // view, download
  "expiresAt": "2025-02-15T00:00:00Z" // optional
}

Response:
{
  "success": true,
  "shareId": "shr_123mno",
  "shareUrl": "/documents/shared/shr_123mno"
}
\`\`\`

#### GET /api/documents/shared/:shareId
Access shared document

---

## 5. Mailroom Management

### Overview
The mailroom system manages physical mail and documents received for clients. Admin can upload scanned mail items, and clients can view, download, and manage their mail.

### API Endpoints

#### POST /api/mailroom/upload
Upload mailroom document (Admin only)
\`\`\`json
Request (multipart/form-data):
{
  "file": File,
  "userId": "usr_123abc",
  "companyId": "cmp_789xyz", // optional, if user has multiple companies
  "subject": "IRS Notice",
  "sender": "Internal Revenue Service",
  "documentType": "tax_notice", // tax_notice, legal_document, bank_statement, government_correspondence, other
  "receivedDate": "2025-01-15",
  "notes": "Important tax notice requiring attention"
}

Response:
{
  "success": true,
  "mailId": "mail_456def",
  "fileName": "irs_notice_2025.pdf",
  "fileSize": 345678,
  "uploadedAt": "2025-01-15T14:30:00Z",
  "status": "new"
}
\`\`\`

#### GET /api/mailroom/user/:userId
Get all mailroom items for a user
\`\`\`json
Query Parameters:
- status: filter by status (new, read, archived)
- documentType: filter by document type
- dateFrom: start date
- dateTo: end date
- companyId: filter by company (if user has multiple)
- page: pagination
- limit: items per page

Response:
{
  "mailItems": [
    {
      "mailId": "mail_456def",
      "subject": "IRS Notice",
      "sender": "Internal Revenue Service",
      "documentType": "tax_notice",
      "receivedDate": "2025-01-15",
      "status": "new", // new, read, archived
      "fileSize": 345678,
      "uploadedAt": "2025-01-15T14:30:00Z",
      "downloadUrl": "/api/mailroom/download/mail_456def",
      "companyId": "cmp_789xyz",
      "companyName": "Tech Innovations LLC"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "stats": {
    "total": 45,
    "new": 12,
    "read": 28,
    "archived": 5
  }
}
\`\`\`

#### GET /api/mailroom/:mailId
Get mailroom item details
\`\`\`json
Response:
{
  "mailId": "mail_456def",
  "userId": "usr_123abc",
  "companyId": "cmp_789xyz",
  "subject": "IRS Notice",
  "sender": "Internal Revenue Service",
  "documentType": "tax_notice",
  "receivedDate": "2025-01-15",
  "status": "new",
  "fileName": "irs_notice_2025.pdf",
  "fileSize": 345678,
  "uploadedBy": "admin_789",
  "uploadedAt": "2025-01-15T14:30:00Z",
  "notes": "Important tax notice requiring attention",
  "downloadUrl": "/api/mailroom/download/mail_456def"
}
\`\`\`

#### GET /api/mailroom/download/:mailId
Download mailroom document (returns file stream)

#### PATCH /api/mailroom/:mailId/status
Update mailroom item status
\`\`\`json
Request:
{
  "status": "read" // new, read, archived
}

Response:
{
  "success": true,
  "mailId": "mail_456def",
  "status": "read",
  "updatedAt": "2025-01-15T15:00:00Z"
}
\`\`\`

#### DELETE /api/mailroom/:mailId
Delete mailroom item (Admin only)

#### GET /api/admin/mailroom
Get all mailroom items (Admin only)
\`\`\`json
Query Parameters:
- userId: filter by user
- companyId: filter by company
- status: filter by status
- documentType: filter by document type
- dateFrom: start date
- dateTo: end date
- search: search by subject or sender
- page: pagination
- limit: items per page

Response:
{
  "mailItems": [
    {
      "mailId": "mail_456def",
      "userId": "usr_123abc",
      "userName": "John Doe",
      "companyId": "cmp_789xyz",
      "companyName": "Tech Innovations LLC",
      "subject": "IRS Notice",
      "sender": "Internal Revenue Service",
      "documentType": "tax_notice",
      "receivedDate": "2025-01-15",
      "status": "new",
      "uploadedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": { /* ... */ },
  "stats": {
    "total": 234,
    "new": 45,
    "read": 156,
    "archived": 33,
    "byType": {
      "tax_notice": 67,
      "legal_document": 89,
      "bank_statement": 45,
      "government_correspondence": 23,
      "other": 10
    }
  }
}
\`\`\`

#### PATCH /api/admin/mailroom/:mailId
Update mailroom item (Admin only)
\`\`\`json
Request:
{
  "subject": "Updated IRS Notice",
  "sender": "Internal Revenue Service",
  "documentType": "tax_notice",
  "receivedDate": "2025-01-15",
  "notes": "Updated notes"
}

Response:
{
  "success": true,
  "mailId": "mail_456def",
  "updatedAt": "2025-01-15T16:00:00Z"
}
\`\`\`

#### POST /api/admin/mailroom/bulk-upload
Bulk upload mailroom documents (Admin only)
\`\`\`json
Request (multipart/form-data):
{
  "files": [File, File, File],
  "userId": "usr_123abc",
  "companyId": "cmp_789xyz",
  "documentType": "government_correspondence",
  "notes": "Batch upload from January mail"
}

Response:
{
  "success": true,
  "uploaded": 3,
  "failed": 0,
  "mailItems": [
    {
      "mailId": "mail_456def",
      "fileName": "document1.pdf"
    },
    {
      "mailId": "mail_789ghi",
      "fileName": "document2.pdf"
    }
  ]
}
\`\`\`

---

## 6. Add-ons & Services

### API Endpoints

#### GET /api/services/available
Get available add-on services
\`\`\`json
Response:
{
  "services": [
    {
      "serviceId": "svc_website",
      "name": "Professional Website",
      "description": "Custom business website with hosting",
      "price": 299,
      "category": "digital",
      "isRecurring": false
    },
    {
      "serviceId": "svc_registered_agent",
      "name": "Registered Agent Service",
      "description": "Annual registered agent service",
      "price": 199,
      "category": "compliance",
      "isRecurring": true,
      "recurringPeriod": "yearly"
    }
  ]
}
\`\`\`

#### POST /api/services/purchase
Purchase add-on service
\`\`\`json
Request:
{
  "userId": "usr_123abc",
  "orderId": "ord_789xyz",
  "serviceId": "svc_website",
  "paymentMethod": "stripe"
}

Response:
{
  "success": true,
  "purchaseId": "pur_789jkl",
  "serviceId": "svc_website",
  "amount": 299,
  "status": "active"
}
\`\`\`

#### GET /api/services/user/:userId
Get user's active services

#### POST /api/services/:purchaseId/renew
Renew recurring service

#### PATCH /api/admin/services/:serviceId
Update service details (Admin only)

---

## 7. Payment Processing

### Overview
Two payment methods supported:
1. **Stripe** - Instant automated verification
2. **Bank Transfer** - Manual verification via WhatsApp

### Payment Flow

#### Stripe Payment Flow
1. User selects "Pay with Stripe"
2. Frontend creates Stripe checkout session via API
3. User completes payment on Stripe
4. Stripe webhook confirms payment
5. Backend updates order status to "processing"
6. User account status changes to "active"
7. User can access dashboard immediately

#### Bank Transfer Payment Flow
1. User selects "Bank Transfer"
2. System shows bank details
3. User makes bank transfer
4. User submits transaction reference number in the form
5. User sends payment screenshot to WhatsApp
6. Admin receives notification
7. Admin verifies payment manually
8. Admin marks payment as verified in system
9. Order status updates to "processing"
10. User account status changes to "active"
11. User receives WhatsApp confirmation

### API Endpoints

#### POST /api/payments/create-stripe-session
Create Stripe checkout session
\`\`\`json
Request:
{
  "orderId": "ord_789xyz",
  "amount": 889,
  "currency": "usd",
  "successUrl": "https://buzzfiling.com/payment-success",
  "cancelUrl": "https://buzzfiling.com/checkout/payment"
}

Response:
{
  "success": true,
  "sessionId": "cs_test_123abc",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_123abc"
}
\`\`\`

#### POST /api/payments/stripe-webhook
Handle Stripe webhook events
\`\`\`json
// Webhook payload from Stripe
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123abc",
      "payment_status": "paid",
      "amount_total": 88900,
      "metadata": {
        "orderId": "ord_789xyz",
        "userId": "usr_123abc"
      }
    }
  }
}

// Backend Action:
// 1. Verify webhook signature
// 2. Update order status to "processing"
// 3. Update user accountStatus to "active"
// 4. Create payment record with status "verified"
// 5. Send confirmation via WhatsApp
\`\`\`

#### POST /api/payments/submit-bank-transfer
Submit bank transfer payment details
\`\`\`json
Request:
{
  "orderId": "ord_789xyz",
  "transactionReference": "TXN123456789",
  "amount": 889,
  "paymentDate": "2025-01-15",
  "whatsappNumber": "+1234567890",
  "notes": "Payment sent via Bank of America"
}

Response:
{
  "success": true,
  "paymentId": "pay_789ghi",
  "status": "pending_verification",
  "message": "Payment submitted. Please send screenshot to WhatsApp: +1-800-BUZZFIL",
  "whatsappInstructions": "Send payment screenshot with reference: TXN123456789"
}
\`\`\`

#### GET /api/payments/order/:orderId
Get payment status for order
\`\`\`json
Response:
{
  "orderId": "ord_789xyz",
  "payments": [
    {
      "paymentId": "pay_789ghi",
      "paymentMethod": "bank_transfer",
      "transactionReference": "TXN123456789",
      "amount": 889,
      "status": "pending_verification",
      "submittedAt": "2025-01-15T10:30:00Z",
      "verifiedAt": null
    }
  ],
  "totalPaid": 0,
  "totalDue": 889,
  "isPaid": false
}
\`\`\`

#### PATCH /api/admin/payments/:paymentId/verify
Verify bank transfer payment (Admin only)
\`\`\`json
Request:
{
  "status": "verified",
  "verificationNotes": "Payment verified via WhatsApp screenshot",
  "actualAmount": 889
}

Response:
{
  "success": true,
  "paymentId": "pay_789ghi",
  "status": "verified",
  "verifiedAt": "2025-01-15T14:30:00Z",
  "orderStatus": "processing",
  "userAccountStatus": "active"
}
\`\`\`

#### GET /api/admin/payments/pending
Get all pending bank transfer payments (Admin only)
\`\`\`json
Query Parameters:
- dateFrom: start date
- dateTo: end date
- page: pagination
- limit: items per page

Response:
{
  "payments": [
    {
      "paymentId": "pay_789ghi",
      "orderId": "ord_789xyz",
      "orderNumber": "BF-2025-001234",
      "userId": "usr_123abc",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "whatsappNumber": "+1234567890",
      "transactionReference": "TXN123456789",
      "amount": 889,
      "status": "pending_verification",
      "submittedAt": "2025-01-15T10:30:00Z",
      "businessName": "Tech Innovations LLC"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "stats": {
    "totalPending": 45,
    "totalAmount": 39905
  }
}
\`\`\`

#### PATCH /api/admin/payments/:paymentId/reject
Reject bank transfer payment (Admin only)
\`\`\`json
Request:
{
  "rejectionReason": "Amount mismatch - received $800 instead of $889"
}

Response:
{
  "success": true,
  "paymentId": "pay_789ghi",
  "status": "rejected",
  "message": "Payment rejected. User will be notified via WhatsApp."
}
\`\`\`

---

## 8. Invoice Management

### API Endpoints

#### POST /api/invoices/create
Create invoice (Admin only)
\`\`\`json
Request:
{
  "userId": "usr_123abc",
  "orderId": "ord_789xyz",
  "items": [
    {
      "description": "Annual Registered Agent Service",
      "amount": 199
    },
    {
      "description": "State Filing Fee",
      "amount": 90
    }
  ],
  "dueDate": "2025-02-15",
  "notes": "Annual renewal invoice"
}

Response:
{
  "success": true,
  "invoiceId": "inv_321ghi",
  "invoiceNumber": "INV-2025-001234",
  "totalAmount": 289,
  "status": "unpaid",
  "dueDate": "2025-02-15"
}
\`\`\`

#### GET /api/invoices/user/:userId
Get all invoices for a user
\`\`\`json
Response:
{
  "invoices": [
    {
      "invoiceId": "inv_321ghi",
      "invoiceNumber": "INV-2025-001234",
      "totalAmount": 289,
      "status": "unpaid", // unpaid, paid, overdue, cancelled
      "dueDate": "2025-02-15",
      "createdAt": "2025-01-15T10:00:00Z",
      "items": [ /* ... */ ]
    }
  ]
}
\`\`\`

#### GET /api/invoices/:invoiceId
Get invoice details

#### PATCH /api/invoices/:invoiceId/pay
Mark invoice as paid
\`\`\`json
Request:
{
  "paymentMethod": "stripe", // or "whatsapp"
  "transactionId": "txn_123abc",
  "referenceNumber": "WA-REF-12345", // for WhatsApp payments
  "paidAmount": 289
}

Response:
{
  "success": true,
  "invoiceId": "inv_321ghi",
  "status": "paid",
  "paidAt": "2025-01-20T15:30:00Z"
}
\`\`\`

#### GET /api/admin/invoices
Get all invoices (Admin only)

---

## 9. User Profile & Settings

### API Endpoints

#### GET /api/users/profile
Get user profile
\`\`\`json
Response:
{
  "userId": "usr_123abc",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "whatsappNumber": "+1234567890",
  "accountStatus": "active",
  "createdAt": "2025-01-15T10:00:00Z"
}
\`\`\`

#### PATCH /api/users/profile
Update user profile
\`\`\`json
Request:
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "whatsappNumber": "+1234567890"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully"
}
\`\`\`

#### POST /api/users/change-password
Change password
\`\`\`json
Request:
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
\`\`\`

---

## 10. Admin User & Company Management

### API Endpoints

#### PATCH /api/admin/users/:userId
Update user information (Admin only)
\`\`\`json
Request:
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1 (555) 123-4567",
  "status": "active", // active, inactive, suspended
  "notes": "Premium customer, fast response time"
}

Response:
{
  "success": true,
  "userId": "usr_123abc",
  "updatedAt": "2025-01-15T16:00:00Z",
  "message": "User information updated successfully"
}
\`\`\`

#### PATCH /api/admin/companies/:companyId
Update company information (Admin only)
\`\`\`json
Request:
{
  "businessName": "Acme Corporation LLC",
  "businessType": "LLC",
  "state": "Delaware",
  "address": "123 Main St",
  "city": "Wilmington",
  "zipCode": "19801",
  "ein": "12-3456789",
  "itemNumber": "5432109", // Registration/License number
  "formationDate": "2024-06-15",
  "status": "active", // active, processing, inactive
  "notes": "Company notes and additional information"
}

Response:
{
  "success": true,
  "companyId": "cmp_789xyz",
  "updatedAt": "2025-01-15T16:00:00Z",
  "message": "Company information updated successfully"
}
\`\`\`

#### POST /api/admin/companies/:companyId/upload-ein
Upload EIN document for company (Admin only)
\`\`\`json
Request (multipart/form-data):
{
  "file": File, // PDF, JPG, PNG
  "ein": "12-3456789", // optional, update EIN number
  "notes": "EIN certificate from IRS"
}

Response:
{
  "success": true,
  "companyId": "cmp_789xyz",
  "documentId": "doc_ein_123",
  "fileName": "ein_certificate.pdf",
  "fileSize": 234567,
  "uploadedAt": "2025-01-15T14:30:00Z",
  "downloadUrl": "/api/documents/download/doc_ein_123"
}
\`\`\`

#### POST /api/admin/companies/:companyId/upload-registration
Upload registration/item number document (Admin only)
\`\`\`json
Request (multipart/form-data):
{
  "file": File, // PDF, JPG, PNG
  "itemNumber": "5432109", // optional, update item number
  "documentType": "business_license", // business_license, registration_certificate, other
  "notes": "State business registration certificate"
}

Response:
{
  "success": true,
  "companyId": "cmp_789xyz",
  "documentId": "doc_reg_456",
  "fileName": "business_license.pdf",
  "fileSize": 345678,
  "uploadedAt": "2025-01-15T14:30:00Z",
  "downloadUrl": "/api/documents/download/doc_reg_456"
}
\`\`\`

#### POST /api/admin/companies/:companyId/upload-document
Upload additional company document (Admin only)
\`\`\`json
Request (multipart/form-data):
{
  "file": File,
  "documentType": "operating_agreement", // operating_agreement, articles_of_organization, bylaws, certificate_of_good_standing, other
  "documentName": "Operating Agreement",
  "category": "formation",
  "notes": "Signed operating agreement"
}

Response:
{
  "success": true,
  "companyId": "cmp_789xyz",
  "documentId": "doc_789ghi",
  "fileName": "operating_agreement.pdf",
  "fileSize": 456789,
  "uploadedAt": "2025-01-15T14:30:00Z",
  "downloadUrl": "/api/documents/download/doc_789ghi"
}
\`\`\`

#### GET /api/admin/companies/:companyId/documents
Get all documents for a company (Admin only)
\`\`\`json
Query Parameters:
- documentType: filter by document type
- category: filter by category
- dateFrom: start date
- dateTo: end date

Response:
{
  "companyId": "cmp_789xyz",
  "companyName": "Acme Corporation LLC",
  "documents": [
    {
      "documentId": "doc_ein_123",
      "fileName": "ein_certificate.pdf",
      "documentType": "ein_certificate",
      "category": "tax",
      "fileSize": 234567,
      "uploadedBy": "admin_789",
      "uploadedAt": "2025-01-15T14:30:00Z",
      "downloadUrl": "/api/documents/download/doc_ein_123"
    },
    {
      "documentId": "doc_reg_456",
      "fileName": "business_license.pdf",
      "documentType": "business_license",
      "category": "registration",
      "fileSize": 345678,
      "uploadedBy": "admin_789",
      "uploadedAt": "2025-01-15T14:35:00Z",
      "downloadUrl": "/api/documents/download/doc_reg_456"
    },
    {
      "documentId": "doc_789ghi",
      "fileName": "operating_agreement.pdf",
      "documentType": "operating_agreement",
      "category": "formation",
      "fileSize": 456789,
      "uploadedBy": "admin_789",
      "uploadedAt": "2025-01-15T14:40:00Z",
      "downloadUrl": "/api/documents/download/doc_789ghi"
    }
  ],
  "total": 3
}
\`\`\`

#### DELETE /api/admin/companies/:companyId/documents/:documentId
Delete company document (Admin only)
\`\`\`json
Response:
{
  "success": true,
  "documentId": "doc_789ghi",
  "message": "Document deleted successfully"
}
\`\`\`

#### GET /api/admin/users/:userId/full-profile
Get complete user profile with all companies and documents (Admin only)
\`\`\`json
Response:
{
  "user": {
    "userId": "usr_123abc",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "+1 (555) 123-4567",
    "status": "active",
    "joinDate": "2024-12-15",
    "notes": "Premium customer, fast response time"
  },
  "companies": [
    {
      "companyId": "cmp_789xyz",
      "businessName": "Acme Corporation LLC",
      "businessType": "LLC",
      "state": "Delaware",
      "ein": "12-3456789",
      "itemNumber": "5432109",
      "status": "active",
      "totalOrders": 3,
      "totalDocuments": 15,
      "totalMailItems": 8
    }
  ],
  "stats": {
    "totalCompanies": 1,
    "totalOrders": 3,
    "totalSpent": "$1,497",
    "totalDocuments": 15,
    "totalMailItems": 8
  }
}
\`\`\`

---

## 11. Analytics & Reporting

### API Endpoints

#### GET /api/admin/analytics/overview
Get dashboard overview (Admin only)
\`\`\`json
Response:
{
  "totalOrders": 1234,
  "totalRevenue": 1098876,
  "pendingPayments": 45,
  "activeCustomers": 987,
  "ordersThisMonth": 156,
  "revenueThisMonth": 138684,
  "averageOrderValue": 889,
  "conversionRate": 78.5
}
\`\`\`

#### GET /api/admin/analytics/orders
Get order analytics (Admin only)
\`\`\`json
Query Parameters:
- period: "day", "week", "month", "year"
- dateFrom: start date
- dateTo: end date

Response:
{
  "period": "month",
  "data": [
    {
      "date": "2025-01-01",
      "orders": 45,
      "revenue": 40005,
      "averageValue": 889
    }
  ],
  "totals": {
    "orders": 156,
    "revenue": 138684,
    "averageValue": 889
  }
}
\`\`\`

#### GET /api/admin/analytics/payments
Get payment analytics (Admin only)
\`\`\`json
Response:
{
  "totalPayments": 1234,
  "stripePayments": 987,
  "bankTransferPayments": 247,
  "pendingVerification": 45,
  "verifiedPayments": 1189,
  "rejectedPayments": 0,
  "totalAmount": 1098876,
  "averageVerificationTime": "4.5 hours"
}
\`\`\`

---

## 12. Database Schema

### Users Collection
\`\`\`javascript
{
  _id: ObjectId,
  userId: "usr_123abc",
  email: "john@example.com",
  password: "hashed_password",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  whatsappNumber: "+1234567890",
  role: "customer", // customer, admin
  accountStatus: "active", // pending_payment, active, suspended
  createdAt: ISODate("2025-01-15T10:00:00Z"),
  updatedAt: ISODate("2025-01-15T10:00:00Z")
}

// Indexes
db.users.createIndex({ userId: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ accountStatus: 1 })
\`\`\`

### Orders Collection
\`\`\`javascript
{
  _id: ObjectId,
  orderId: "ord_789xyz",
  orderNumber: "BF-2025-001234",
  userId: "usr_123abc",
  status: "processing", // pending_payment, processing, completed, cancelled
  state: "Delaware",
  package: "starter",
  businessInfo: {
    name: "Tech Innovations LLC",
    category: "technology",
    address: "123 Main St",
    city: "Wilmington",
    zipCode: "19801",
    website: "https://techinnovations.com"
  },
  members: [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone": "555-0123",
      address": "456 Oak Ave",
      city": "New York",
      state": "NY",
      zipCode": "10001",
      ssn": "123-45-6789",
      isResponsiblePerson": true
    }
  ],
  addons": ["website", "itin", "reseller-certificate"],
  pricing": {
    package": 299,
    stateFee": 90,
    addons": 500,
    total": 889
  },
  timeline": [
    {
      step": "order_placed",
      status": "completed",
      completedAt": ISODate("2025-01-15T10:30:00Z")
    }
  ],
  createdAt": ISODate("2025-01-15T10:30:00Z"),
  updatedAt": ISODate("2025-01-15T10:30:00Z")
}

// Indexes
db.orders.createIndex({ orderId: 1 }, { unique: true })
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ userId: 1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: -1 })
\`\`\`

### Payments Collection
\`\`\`javascript
{
  _id: ObjectId,
  paymentId: "pay_789ghi",
  orderId: "ord_789xyz",
  userId: "usr_123abc",
  paymentMethod: "bank_transfer", // stripe, bank_transfer
  
  // For Stripe payments
  stripeSessionId: "cs_test_123abc",
  stripePaymentIntentId: "pi_123abc",
  
  // For Bank Transfer payments
  transactionReference: "TXN123456789",
  whatsappNumber: "+1234567890",
  
  amount: 889,
  currency: "usd",
  status: "verified", // pending_verification, verified, rejected
  paymentDate: ISODate("2025-01-15"),
  submittedAt: ISODate("2025-01-15T10:30:00Z"),
  verifiedAt: ISODate("2025-01-15T14:30:00Z"),
  verifiedBy: "admin_789",
  verificationNotes: "Payment verified via WhatsApp screenshot",
  rejectionReason: null,
  notes: "Payment sent via Bank of America",
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-01-15T14:30:00Z")
}

// Indexes
db.payments.createIndex({ paymentId: 1 }, { unique: true })
db.payments.createIndex({ orderId: 1 })
db.payments.createIndex({ userId: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ paymentMethod: 1 })
db.payments.createIndex({ transactionReference: 1 })
db.payments.createIndex({ createdAt: -1 })
\`\`\`

### Companies Collection
\`\`\`javascript
{
  _id: ObjectId,
  companyId: "cmp_789xyz",
  userId: "usr_123abc",
  orderId: "ord_789xyz",
  businessName: "Tech Innovations LLC",
  businessType: "LLC",
  state: "Delaware",
  address: "123 Main St",
  city": "Wilmington",
  zipCode": "19801",
  ein": "12-3456789",
  itemNumber": "5432109",
  formationDate": ISODate("2024-06-15"),
  status": "active",
  createdAt": ISODate("2025-01-15T10:00:00Z"),
  updatedAt": ISODate("2025-01-15T10:00:00Z")
}

// Indexes
db.companies.createIndex({ companyId: 1 }, { unique: true })
db.companies.createIndex({ userId: 1 })
db.companies.createIndex({ orderId: 1 })
db.companies.createIndex({ ein: 1 })
db.companies.createIndex({ status: 1 })
\`\`\`

### Documents Collection
\`\`\`javascript
{
  _id: ObjectId,
  documentId: "doc_456def",
  userId": "usr_123abc",
  companyId": "cmp_789xyz",
  orderId": "ord_789xyz",
  fileName": "articles_of_organization.pdf",
  fileSize": 234567,
  fileType": "application/pdf",
  documentType": "articles_of_organization",
  category": "formation",
  blobUrl": "https://blob.vercel-storage.com/...",
  uploadedBy": "admin_789",
  uploadedAt": ISODate("2025-01-15T14:30:00Z"),
  expiresAt": null,
  notes": "Official articles of organization",
  createdAt": ISODate("2025-01-15T14:30:00Z")
}

// Indexes
db.documents.createIndex({ documentId: 1 }, { unique: true })
db.documents.createIndex({ userId: 1 })
db.documents.createIndex({ companyId: 1 })
db.documents.createIndex({ orderId: 1 })
db.documents.createIndex({ documentType: 1 })
db.documents.createIndex({ uploadedAt: -1 })
\`\`\`

### Mailroom Collection
\`\`\`javascript
{
  _id: ObjectId,
  mailId: "mail_789pqr",
  userId": "usr_123abc",
  companyId": "cmp_789xyz",
  sender": "Delaware Division of Corporations",
  subject": "Annual Report Notice",
  receivedDate": ISODate("2025-01-15"),
  status": "unread",
  category": "official",
  priority": "high",
  scannedDocuments": [
    {
      documentId": "doc_123abc",
      fileName": "annual_report_notice.pdf",
      blobUrl": "https://blob.vercel-storage.com/..."
    }
  ],
  notes": "Annual report due by March 1st",
  createdAt": ISODate("2025-01-15T14:00:00Z"),
  updatedAt": ISODate("2025-01-15T14:00:00Z")
}

// Indexes
db.mailroom.createIndex({ mailId: 1 }, { unique: true })
db.mailroom.createIndex({ userId: 1 })
db.mailroom.createIndex({ companyId: 1 })
db.mailroom.createIndex({ status: 1 })
db.mailroom.createIndex({ receivedDate: -1 })
\`\`\`

### Invoices Collection
\`\`\`javascript
{
  _id: ObjectId,
  invoiceId": "inv_321ghi",
  invoiceNumber": "INV-2025-001234",
  userId": "usr_123abc",
  orderId": "ord_789xyz",
  companyId": "cmp_789xyz",
  items": [
    {
      description": "Annual Registered Agent Service",
      amount": 199
    }
  ],
  totalAmount": 199,
  status": "unpaid",
  dueDate": ISODate("2025-02-15"),
  paidAt": null,
  paymentId": null,
  notes": "Annual renewal invoice",
  createdAt": ISODate("2025-01-15T10:00:00Z"),
  updatedAt": ISODate("2025-01-15T10:00:00Z")
}

// Indexes
db.invoices.createIndex({ invoiceId: 1 }, { unique: true })
db.invoices.createIndex({ invoiceNumber: 1 }, { unique: true })
db.invoices.createIndex({ userId: 1 })
db.invoices.createIndex({ status: 1 })
db.invoices.createIndex({ dueDate: 1 })
\`\`\`

### Services Collection
\`\`\`javascript
{
  _id: ObjectId,
  serviceId": "svc_website",
  name": "Professional Website",
  description": "Custom business website with hosting",
  price": 299,
  category": "digital",
  isRecurring": false,
  recurringPeriod": null,
  isActive": true,
  createdAt": ISODate("2025-01-15T10:00:00Z"),
  updatedAt": ISODate("2025-01-15T10:00:00Z")
}

// Indexes
db.services.createIndex({ serviceId: 1 }, { unique: true })
db.services.createIndex({ category: 1 })
db.services.createIndex({ isActive: 1 })
\`\`\`

### User Services Collection
\`\`\`javascript
{
  _id: ObjectId,
  purchaseId": "pur_789jkl",
  userId": "usr_123abc",
  orderId": "ord_789xyz",
  serviceId": "svc_website",
  status": "active",
  purchasedAt": ISODate("2025-01-15T10:00:00Z"),
  expiresAt": ISODate("2026-01-15T10:00:00Z")
}

// Indexes
db.userServices.createIndex({ purchaseId: 1 }, { unique: true })
db.userServices.createIndex({ userId: 1 })
db.userServices.createIndex({ serviceId: 1 })
db.userServices.createIndex({ status: 1 })
\`\`\`

---

## 13. Environment Variables

\`\`\`env
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Email (for password reset only)
EMAIL_SERVICE_API_KEY=...
EMAIL_FROM=noreply@buzzfiling.com

# WhatsApp (for reference only - not used in API)
WHATSAPP_SUPPORT_NUMBER=+1-800-BUZZFIL

# App URLs
FRONTEND_URL=https://buzzfiling.com
API_URL=https://api.buzzfiling.com
\`\`\`

---

## 14. API Response Standards

### Success Response
\`\`\`json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
\`\`\`

### Error Codes
- `INVALID_CREDENTIALS` - Invalid login credentials
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized to access resource
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `PAYMENT_REQUIRED` - Payment verification required
- `PAYMENT_FAILED` - Payment processing failed
- `DUPLICATE_ENTRY` - Resource already exists
- `SERVER_ERROR` - Internal server error

---

## 15. Security Requirements

### Authentication
- JWT tokens with 7-day expiration
- Secure password hashing (bcrypt, 10 rounds)
- Password requirements: min 8 characters, 1 uppercase, 1 lowercase, 1 number

### Authorization
- Role-based access control (customer, admin)
- Payment gate middleware for dashboard access
- Admin-only endpoints protected

### Data Protection
- HTTPS only
- Sensitive data encrypted at rest
- PII (SSN, etc.) encrypted in database
- Secure file upload validation

### Rate Limiting
- Auth endpoints: 5 requests per minute
- API endpoints: 100 requests per minute
- File uploads: 10 per hour

---

## 16. Removed Features

The following features are NOT required and have been removed from the original requirements:

### Support Ticket System (REMOVED)
- All support handled via WhatsApp
- No in-app ticket system needed

### Notification System (REMOVED)
- All notifications sent via WhatsApp
- No in-app notification bell or system needed

### Email Verification (OPTIONAL)
- Not required for MVP
- Can be added later if needed

### Complex Payment Gateway (SIMPLIFIED)
- Only Stripe + Bank Transfer needed
- No other payment gateways required

---

## Summary

This backend supports a simplified business model with:
- ✅ User authentication with payment gate
- ✅ Order management
- ✅ Stripe + Bank Transfer payments
- ✅ Manual payment verification via WhatsApp
- ✅ Company management
- ✅ Document management
- ✅ Mailroom management
- ✅ Invoice management
- ✅ Add-ons & services
- ✅ Admin dashboard
- ✅ Analytics & reporting
- ❌ No support ticket system (using WhatsApp)
- ❌ No notification system (using WhatsApp)
- ❌ No complex payment gateway (just Stripe + Bank Transfer)

**Total API Endpoints: ~60** (reduced from ~90 in original requirements)

**Estimated Development Time: 4-6 weeks**
