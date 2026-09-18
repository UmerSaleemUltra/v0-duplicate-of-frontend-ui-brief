# Backend API Documentation

## Overview
This document provides comprehensive information about all API endpoints available in the BuzzFiling application.

## Base URL
All API endpoints are relative to: `/api`

## Authentication
Most endpoints require authentication using a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

Tokens are valid for 7 days and are automatically refreshed when users log in.

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate user with email and password.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin" | "client",
    "token": "string"
  },
  "token": "string",
  "expiresAt": number
}
\`\`\`

**Error Response (401):**
\`\`\`json
{
  "success": false,
  "error": "Invalid email or password"
}
\`\`\`

---

### POST /api/auth/register
Register a new user account.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string (optional)"
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "client",
    "status": "active"
  },
  "token": "string"
}
\`\`\`

**Error Response (400):**
\`\`\`json
{
  "success": false,
  "error": "User with this email already exists"
}
\`\`\`

---

### POST /api/auth/logout
Log out current user and invalidate token.

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Logged out successfully"
}
\`\`\`

---

### GET /api/auth/verify
Verify if current user is authenticated.

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "authenticated": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin" | "client"
  },
  "expiresAt": number,
  "daysRemaining": number
}
\`\`\`

**Error Response (401):**
\`\`\`json
{
  "authenticated": false
}
\`\`\`

---

## User Endpoints

### GET /api/users
Get all users (admin only).

**Authentication:** Required (Admin only)

**Success Response (200):**
\`\`\`json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "admin" | "client",
      "status": "active" | "inactive" | "pending",
      "phone": "string (optional)",
      "createdAt": "string (ISO date)"
    }
  ]
}
\`\`\`

---

### POST /api/users
Create a new user (admin only).

**Authentication:** Required (Admin only)

**Request Body:**
\`\`\`json
{
  "email": "string",
  "name": "string",
  "role": "admin" | "client",
  "password": "string (optional)",
  "phone": "string (optional)"
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin" | "client",
    "status": "active"
  }
}
\`\`\`

---

### GET /api/users/[id]
Get user by ID.

**Authentication:** Required (Users can only access their own data unless admin)

**Success Response (200):**
\`\`\`json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin" | "client",
    "status": "active" | "inactive" | "pending"
  }
}
\`\`\`

---

### PATCH /api/users/[id]
Update user by ID.

**Authentication:** Required (Users can only update their own data unless admin)

**Request Body:** Partial user object

**Success Response (200):**
\`\`\`json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
\`\`\`

---

### DELETE /api/users/[id]
Delete user by ID (admin only).

**Authentication:** Required (Admin only)

**Success Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

---

## Company Endpoints

### GET /api/companies
Get all companies (filtered by user if not admin).

**Authentication:** Required

**Query Parameters:**
- `userId`: Filter by user ID (optional)

**Success Response (200):**
\`\`\`json
{
  "companies": [
    {
      "id": "string",
      "userId": "string",
      "name": "string",
      "entityType": "LLC" | "S-Corp" | "C-Corp" | "Non-Profit",
      "state": "string",
      "status": "pending" | "processing" | "active" | "completed",
      "businessId": "string (optional)",
      "createdAt": "string (ISO date)"
    }
  ]
}
\`\`\`

---

### POST /api/companies
Create a new company.

**Authentication:** Required

**Request Body:**
\`\`\`json
{
  "userId": "string",
  "name": "string",
  "entityType": "LLC" | "S-Corp" | "C-Corp" | "Non-Profit",
  "state": "string",
  "status": "string (optional)",
  "packageType": "string (optional)"
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "company": {
    "id": "string",
    "userId": "string",
    "name": "string",
    "entityType": "string",
    "state": "string",
    "status": "pending"
  }
}
\`\`\`

---

### GET /api/companies/[id]
Get company by ID.

**Authentication:** Required

**Success Response (200):**
\`\`\`json
{
  "company": {
    "id": "string",
    "userId": "string",
    "name": "string",
    "entityType": "LLC" | "S-Corp" | "C-Corp" | "Non-Profit",
    "state": "string",
    "status": "pending" | "processing" | "active" | "completed"
  }
}
\`\`\`

---

### PATCH /api/companies/[id]
Update company by ID.

**Authentication:** Required

**Request Body:** Partial company object

**Success Response (200):**
\`\`\`json
{
  "company": {
    "id": "string",
    "name": "string"
  }
}
\`\`\`

---

### DELETE /api/companies/[id]
Delete company by ID (admin only).

**Authentication:** Required (Admin only)

**Success Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

---

## Document Endpoints

### GET /api/documents
Get documents (filtered by user/company if not admin).

**Authentication:** Required

**Query Parameters:**
- `companyId`: Filter by company ID (optional)
- `userId`: Filter by user ID (optional)
- `excludeMailDocuments`: Exclude mail documents (optional, default: false)

**Success Response (200):**
\`\`\`json
{
  "documents": [
    {
      "id": "string",
      "companyId": "string",
      "userId": "string",
      "name": "string",
      "type": "string",
      "category": "formation" | "compliance" | "tax" | "other" | "mail",
      "status": "pending" | "ready" | "downloaded",
      "title": "string (optional)",
      "isMailDocument": boolean,
      "uploadedAt": "string (ISO date)"
    }
  ]
}
\`\`\`

---

### POST /api/documents
Create a new document.

**Authentication:** Required

**Request Body:**
\`\`\`json
{
  "companyId": "string",
  "userId": "string",
  "name": "string",
  "type": "string",
  "category": "formation" | "compliance" | "tax" | "other" | "mail",
  "title": "string (optional)",
  "isMailDocument": boolean (optional)
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "document": {
    "id": "string",
    "companyId": "string",
    "userId": "string",
    "name": "string",
    "status": "ready"
  }
}
\`\`\`

---

### GET /api/documents/[id]
Get document by ID.

**Authentication:** Required

**Success Response (200):**
\`\`\`json
{
  "document": {
    "id": "string",
    "companyId": "string",
    "name": "string",
    "type": "string"
  }
}
\`\`\`

---

### PATCH /api/documents/[id]
Update document by ID.

**Authentication:** Required

**Request Body:** Partial document object

**Success Response (200):**
\`\`\`json
{
  "document": {
    "id": "string",
    "name": "string"
  }
}
\`\`\`

---

### DELETE /api/documents/[id]
Delete document by ID.

**Authentication:** Required

**Success Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

---

## Mail Endpoints

### GET /api/mail
Get mail items (filtered by user/company if not admin).

**Authentication:** Required

**Query Parameters:**
- `companyId`: Filter by company ID (optional)
- `userId`: Filter by user ID (optional)
- `status`: Filter by status - unread, read, archived (optional)

**Success Response (200):**
\`\`\`json
{
  "mail": [
    {
      "id": "string",
      "companyId": "string",
      "userId": "string",
      "subject": "string",
      "sender": "string",
      "type": "letter" | "package" | "legal" | "tax" | "other",
      "status": "unread" | "read" | "archived",
      "receivedAt": "string (ISO date)",
      "documentId": "string (optional)"
    }
  ]
}
\`\`\`

---

### POST /api/mail
Create a new mail item (admin only).

**Authentication:** Required (Admin only)

**Request Body:**
\`\`\`json
{
  "companyId": "string",
  "userId": "string",
  "subject": "string",
  "sender": "string",
  "type": "letter" | "package" | "legal" | "tax" | "other",
  "description": "string (optional)",
  "documentId": "string (optional)"
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "mail": {
    "id": "string",
    "companyId": "string",
    "subject": "string",
    "status": "unread"
  }
}
\`\`\`

---

### GET /api/mail/[id]
Get mail item by ID.

**Authentication:** Required

**Success Response (200):**
\`\`\`json
{
  "mail": {
    "id": "string",
    "subject": "string",
    "sender": "string",
    "type": "string",
    "status": "unread" | "read" | "archived"
  }
}
\`\`\`

---

### PATCH /api/mail/[id]
Update mail item by ID.

**Authentication:** Required

**Request Body:** Partial mail object

**Success Response (200):**
\`\`\`json
{
  "mail": {
    "id": "string",
    "status": "read"
  }
}
\`\`\`

---

### DELETE /api/mail/[id]
Delete mail item by ID (admin only).

**Authentication:** Required (Admin only)

**Success Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

---

## Order Endpoints

### GET /api/orders
Get orders (filtered by user if not admin).

**Authentication:** Required

**Query Parameters:**
- `userId`: Filter by user ID (optional)
- `status`: Filter by status (optional)

**Success Response (200):**
\`\`\`json
{
  "orders": [
    {
      "id": "string",
      "companyId": "string",
      "userId": "string",
      "companyName": "string",
      "service": "string",
      "amount": number,
      "status": "pending" | "processing" | "completed" | "cancelled" | "paid",
      "createdAt": "string (ISO date)"
    }
  ]
}
\`\`\`

---

### POST /api/orders
Create a new order.

**Authentication:** Required

**Request Body:**
\`\`\`json
{
  "companyId": "string",
  "userId": "string",
  "companyName": "string",
  "service": "string",
  "amount": number,
  "packageType": "string (optional)",
  "state": "string (optional)",
  "items": "array (optional)"
}
\`\`\`

**Success Response (201):**
\`\`\`json
{
  "order": {
    "id": "string",
    "companyId": "string",
    "companyName": "string",
    "service": "string",
    "amount": number,
    "status": "pending"
  }
}
\`\`\`

---

### GET /api/orders/[id]
Get order by ID.

**Authentication:** Required

**Success Response (200):**
\`\`\`json
{
  "order": {
    "id": "string",
    "companyName": "string",
    "service": "string",
    "amount": number,
    "status": "pending" | "processing" | "completed"
  }
}
\`\`\`

---

### PATCH /api/orders/[id]
Update order by ID.

**Authentication:** Required

**Request Body:** Partial order object

**Success Response (200):**
\`\`\`json
{
  "order": {
    "id": "string",
    "status": "completed"
  }
}
\`\`\`

---

### DELETE /api/orders/[id]
Delete order by ID (admin only).

**Authentication:** Required (Admin only)

**Success Response (200):**
\`\`\`json
{
  "success": true
}
\`\`\`

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
\`\`\`json
{
  "error": "Validation error message"
}
\`\`\`

**401 Unauthorized:**
\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

**500 Internal Server Error:**
\`\`\`json
{
  "error": "Internal server error"
}
\`\`\`

---

## Authorization Rules

1. **Admin Users:**
   - Can access all endpoints
   - Can view/modify all resources
   - Can create/delete any resource

2. **Client Users:**
   - Can only access their own resources
   - Cannot delete most resources
   - Cannot access other users' data

3. **Token Expiration:**
   - Tokens expire after 7 days
   - Users must log in again to get a new token
   - Token expiration is checked on every request

---

## Example Usage

### Login Example
\`\`\`javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const data = await response.json()
// Store token for future requests
localStorage.setItem('token', data.token)
\`\`\`

### Authenticated Request Example
\`\`\`javascript
const token = localStorage.getItem('token')

const response = await fetch('/api/companies', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const data = await response.json()
