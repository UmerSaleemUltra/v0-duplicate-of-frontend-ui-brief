# BuzzFiling Email Events Documentation

This document outlines all the events in the system that trigger email sends to users and admins.

## User Account Events

### 1. **Welcome Email - User Signup**
- **Trigger**: User creates a new account via `/auth/signup`
- **Email Template**: `emailTemplates.welcome()`
- **Recipient**: New user's email
- **Content**: Welcome message, account activation, getting started guide
- **Status**: ✅ Implemented

### 2. **Password Reset Email**
- **Trigger**: User requests password reset via `/auth/forgot-password`
- **Email Template**: `emailTemplates.passwordReset()`
- **Recipient**: User's registered email
- **Content**: Password reset link with token
- **Status**: ❓ To be implemented

### 3. **Email Verification Email**
- **Trigger**: New account created or email change requested
- **Email Template**: `emailTemplates.emailVerification()`
- **Recipient**: Email to be verified
- **Content**: Email verification link
- **Status**: ❓ To be implemented

---

## Order & Business Formation Events

### 4. **Order Confirmation Email**
- **Trigger**: Order is placed successfully via `/api/orders` POST
- **Email Template**: `emailTemplates.orderConfirmation()`
- **Recipient**: Customer's email
- **Content**: Order ID, company details, package type, pricing breakdown, expected timeline
- **Status**: ✅ Implemented

### 5. **Order Status Update Email**
- **Trigger**: Admin updates order status (pending → processing → completed)
- **Email Template**: `emailTemplates.orderStatusUpdate()`
- **Recipient**: Customer's email
- **Content**: New status, action items, next steps
- **Status**: ❓ To be implemented

### 6. **EIN Application Approved Email**
- **Trigger**: Admin marks EIN application as approved
- **Email Template**: `emailTemplates.einApproved()`
- **Recipient**: Customer's email
- **Content**: EIN number, confirmation details, next steps
- **Status**: ❓ To be implemented

### 7. **ITIN Application Approved Email**
- **Trigger**: Admin marks ITIN application as approved
- **Email Template**: `emailTemplates.itinApproved()`
- **Recipient**: Customer's email
- **Content**: ITIN details, confirmation, instructions
- **Status**: ❓ To be implemented

---

## Document & Mailroom Events

### 8. **Document Upload Confirmation Email**
- **Trigger**: Document uploaded to company via `/api/documents` POST
- **Email Template**: `emailTemplates.documentUploaded()`
- **Recipient**: Company owner's email
- **Content**: Document name, upload timestamp, document type
- **Status**: ❓ To be implemented

### 9. **Incoming Mail Notification Email**
- **Trigger**: Admin creates mail entry via `/api/mail` POST
- **Email Template**: `emailTemplates.mailReceived()`
- **Recipient**: User's email
- **Content**: From address, subject, sender company name
- **Status**: ✅ Implemented

### 10. **Mail Processing Complete Email**
- **Trigger**: Admin marks mail as processed with notes
- **Email Template**: `emailTemplates.mailProcessingComplete()`
- **Recipient**: User's email
- **Content**: Mail details, processing notes, actions taken
- **Status**: ❓ To be implemented

---

## Add-ons & Services Events

### 11. **Add-on Purchase Confirmation Email**
- **Trigger**: Add-on is purchased via `/api/email/addon-purchase` POST
- **Email Template**: `emailTemplates.addonPurchaseConfirmation()`
- **Recipient**: Customer's email
- **Content**: Add-on name, price, activation details
- **Status**: ✅ Implemented

### 12. **Add-on Activation Email**
- **Trigger**: Add-on is activated/enabled by admin
- **Email Template**: `emailTemplates.addonActivated()`
- **Recipient**: Customer's email
- **Content**: Add-on details, how to use, support contact
- **Status**: ❓ To be implemented

### 13. **Mailing Address Update Email**
- **Trigger**: Mailing address is updated via admin
- **Email Template**: `emailTemplates.mailingAddressUpdated()`
- **Recipient**: Customer's email
- **Content**: New mailing address, effective date
- **Status**: ❓ To be implemented

---

## Payment & Invoicing Events

### 14. **Payment Received Email**
- **Trigger**: Payment is received and verified
- **Email Template**: `emailTemplates.paymentReceived()`
- **Recipient**: Customer's email
- **Content**: Amount, transaction ID, receipt link
- **Status**: ❓ To be implemented

### 15. **Invoice Generated Email**
- **Trigger**: Invoice is generated for an order
- **Email Template**: `emailTemplates.invoiceGenerated()`
- **Recipient**: Customer's email
- **Content**: Invoice number, PDF attachment, payment terms
- **Status**: ❓ To be implemented

### 16. **Payment Failed Email**
- **Trigger**: Payment processing fails
- **Email Template**: `emailTemplates.paymentFailed()`
- **Recipient**: Customer's email
- **Content**: Failure reason, retry instructions, support
- **Status**: ❓ To be implemented

---

## Compliance & Legal Events

### 17. **Document Request Email**
- **Trigger**: Admin requests documents from customer
- **Email Template**: `emailTemplates.documentRequest()`
- **Recipient**: Customer's email
- **Content**: List of required documents, deadline, submission instructions
- **Status**: ❓ To be implemented

### 18. **Compliance Reminder Email**
- **Trigger**: Annual compliance reminder scheduled
- **Email Template**: `emailTemplates.complianceReminder()`
- **Recipient**: Customer's email
- **Content**: Annual filing deadline, required documents, fees
- **Status**: ❓ To be implemented

### 19. **Amendment Filing Reminder Email**
- **Trigger**: Amendment filing reminder scheduled
- **Email Template**: `emailTemplates.amendmentReminder()`
- **Recipient**: Customer's email
- **Content**: Amendment type, deadline, benefits
- **Status**: ❓ To be implemented

---

## Admin & Internal Events

### 20. **New Order Alert - Admin Email**
- **Trigger**: New order is placed
- **Email Template**: `emailTemplates.adminNewOrderAlert()`
- **Recipient**: Admin/Support team email
- **Content**: Order ID, customer details, company info, urgency level
- **Status**: ❓ To be implemented

### 21. **Document Awaiting Review - Admin Email**
- **Trigger**: Customer uploads required documents
- **Email Template**: `emailTemplates.adminDocumentReview()`
- **Recipient**: Admin email
- **Content**: Document list, company name, review deadline
- **Status**: ❓ To be implemented

---

## Email Configuration

All emails are sent using the `sendEmail()` function from `@/config/email` with the following settings:
- **SMTP Service**: Configured in environment variables
- **From Address**: noreply@buzzfiling.com
- **Error Handling**: Non-blocking (email failures don't prevent order/account creation)
- **Retry Logic**: Automatic retries on transient failures

## How to Add New Email Events

1. Add email template to `config/email.tsx`
2. Call `sendEmail()` in the appropriate API route
3. Wrap in try-catch to prevent blocking operations
4. Update this documentation with the new event
5. Test in development environment before production deploy

## Email Template Priority

- 🟢 **Implemented**: Welcome, Order Confirmation, Addon Purchase, Mail Received
- 🟡 **Priority**: Order Status, EIN/ITIN Approval, Document Upload
- 🔴 **Future**: Payment/Invoice, Compliance Reminders, Admin Alerts
