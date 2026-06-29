# BuzzFiling Bug Report - Critical Issues Found

## 1. CRITICAL: Framer Motion Dependency Conflict

**Severity:** CRITICAL  
**Location:** Package Dependencies  
**Issue:** Version mismatch between `framer-motion@12.23.26` and `motion-dom@12.42.0`

**Error:**
```
Export activeAnimations doesn't exist in target module motion-dom
```

**Root Cause:** Framer Motion is trying to import `activeAnimations` from motion-dom, but that export doesn't exist in version 12.42.0. The versions are incompatible.

**Impact:** Breaks all animations in the trust-social-proof component and potentially other framer-motion-dependent components.

**Fix:**
- Update `framer-motion` to match `motion-dom` version compatibility
- Or downgrade `motion-dom` to a compatible version
- Run `pnpm update framer-motion motion-dom` and verify exports

---

## 2. HIGH: Missing Error Handling in JSON Parsing

**Severity:** HIGH  
**Location:** `app/admin/promo-codes/page.tsx:124`, `app/admin/users/[id]/page.tsx:289`  
**Issue:** Unsafe `JSON.parse()` without try-catch blocks

**Code:**
```typescript
const data = JSON.parse(event.data)  // Line 124
const errorData = JSON.parse(errorText)  // Line 289
```

**Problem:** If the JSON is malformed, the app will throw an unhandled exception, crashing the component.

**Fix:** Wrap in try-catch:
```typescript
try {
  const data = JSON.parse(event.data)
  // ...
} catch (error) {
  console.error("Invalid JSON data:", error)
  // Handle error gracefully
}
```

---

## 3. HIGH: Hardcoded API URL

**Severity:** HIGH  
**Location:** `lib/api-client.ts:6`  
**Issue:** Production API URL hardcoded

**Code:**
```typescript
const API_BASE_URL = "https://www.buzzfiling.com"
```

**Problem:** 
- Development environment won't work (dev domain won't point to production API)
- Environment variables are being ignored
- API calls fail in non-production environments

**Fix:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.origin) || 
  "/api"
```

---

## 4. HIGH: Unhandled Promise in Signup Route

**Severity:** HIGH  
**Location:** `app/api/auth/signup/route.ts:87-99`  
**Issue:** Unhandled Promise rejection in email sending

**Code:**
```typescript
sendEmail({...})
  .then((result) => {
    console.log(" Welcome email result:", result)
  })
  .catch((error) => {
    console.error(" Welcome email failed:", error)
  })
```

**Problem:** If `sendEmail` throws before `.then()` is attached, it won't be caught. Also, silent failures mean users don't know if signup worked.

**Fix:**
```typescript
(async () => {
  try {
    const result = await sendEmail({...})
  } catch (error) {
    console.error("Welcome email failed:", error)
    // Log to error tracking service
  }
})()
```

---

## 5. MEDIUM: Race Condition in Checkout Token Cleanup

**Severity:** MEDIUM  
**Location:** `lib/checkout-token.ts:25-30`  
**Issue:** Non-blocking cleanup can cause race conditions

**Code:**
```typescript
tokensCollection.deleteMany({...}).catch(console.error)
```

**Problem:** 
- Token cleanup runs asynchronously without awaiting
- Multiple concurrent signups might create duplicate tokens
- Old tokens might not be cleaned up properly

**Fix:**
```typescript
try {
  await tokensCollection.deleteMany({...})
} catch (error) {
  console.error("Failed to cleanup checkout tokens:", error)
}
```

---

## 6. MEDIUM: Missing Input Validation in API Routes

**Severity:** MEDIUM  
**Location:** `app/api/companies/[id]/route.ts`, `app/api/orders/route.ts` and many others  
**Issue:** No validation of `id` parameter format before database queries

**Problem:**
- Invalid ObjectId strings cause database errors
- No proper 400 error response to client
- Could allow NoSQL injection if sanitization is bypassed

**Fix:**
```typescript
import { ObjectId, isValidObjectId } from "mongodb"

if (!isValidObjectId(id)) {
  return apiError("Invalid ID format", 400)
}
```

---

## 7. MEDIUM: Weak Password Validation

**Severity:** MEDIUM  
**Location:** `lib/validation.ts` (referenced but pattern weak)  
**Issue:** Password validation may be too lenient

**Problem:**
- No minimum length enforcement visible in signup
- No complexity requirements (uppercase, numbers, symbols)
- Users can set weak passwords

**Fix:** Implement OWASP password guidelines:
```typescript
export function validatePassword(password: string) {
  const minLength = 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*]/.test(password)

  if (password.length < minLength) {
    return { valid: false, error: "Password must be at least 12 characters" }
  }
  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
    return { valid: false, error: "Password must contain uppercase, lowercase, numbers, and special characters" }
  }
  return { valid: true }
}
```

---

## 8. MEDIUM: Missing CORS Headers

**Severity:** MEDIUM  
**Location:** API routes (`app/api/**/*.ts`)  
**Issue:** No CORS headers set on API responses

**Problem:**
- Cross-origin requests may be blocked
- Frontend calls from different domains will fail
- No explicit CORS policy defined

**Fix:** Add to API responses:
```typescript
const headers = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

---

## 9. MEDIUM: Unsafe String Sanitization

**Severity:** MEDIUM  
**Location:** `lib/middleware/input-sanitization.ts:6-8`  
**Issue:** Simple regex replacement is not sufficient for security

**Code:**
```typescript
return input.replace(/[${}]/g, '')
```

**Problem:**
- Only removes `$`, `{`, `}` - but NoSQL injection uses many other patterns
- Doesn't handle encoded characters
- MongoDB operators can use different formats like `$where`, `$ne`, etc.

**Fix:** Use MongoDB's built-in validation:
```typescript
export function sanitizeInput(input: any): any {
  // Use parameterized queries instead of string concatenation
  // MongoDB automatically handles escaping when using query parameters
  if (typeof input === 'string') {
    // Reject objects that look like operators
    if (input.startsWith('$')) {
      throw new Error("Invalid input: cannot start with $")
    }
  }
  // Always use parameterized queries in actual database calls
}
```

---

## 10. LOW: Console Logging in Production

**Severity:** LOW  
**Location:** Throughout codebase (many files)  
**Issue:** Excessive `console.log()` calls in production code

**Example:**
```typescript
console.log(" Attempting to send welcome email to:", email)
console.log(" Welcome email result:", result)
```

**Problem:**
- Leaks information in browser console
- Impacts performance
- Makes debugging harder

**Fix:** Use proper logging service or environment check:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log("Debug info:", data)
}
```

---

## 11. LOW: Missing TypeScript Type Safety

**Severity:** LOW  
**Location:** `lib/data-layer.ts:24`, multiple API files  
**Issue:** Using `any` type throughout the codebase

**Code:**
```typescript
create: async (data: any) => {
  const response = await api.post<T>(`/${endpoint}`, data)
  return response
}
```

**Problem:**
- No compile-time type checking
- Easy to pass invalid data to API
- Makes refactoring risky

**Fix:** Use proper generic types:
```typescript
create: async <D extends Omit<T, "id" | "createdAt">>(data: D) => {
  const response = await api.post<T>(`/${endpoint}`, data)
  return response
}
```

---

## 12. LOW: Missing Environment Variable Validation

**Severity:** LOW  
**Location:** `config/*.ts` files  
**Issue:** No validation that required env vars exist at startup

**Problem:**
- App starts without critical configuration
- Errors occur at runtime instead of startup
- Difficult debugging

**Fix:** Add startup validation:
```typescript
// At app startup
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'NEXT_PUBLIC_API_URL']
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})
```

---

## Summary of Issues by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 1 | Framer Motion dependency conflict |
| HIGH | 3 | JSON parsing, hardcoded API URL, unhandled promises |
| MEDIUM | 4 | Token race condition, missing validation, weak passwords, CORS headers |
| LOW | 2 | Console logging, TypeScript type safety, env validation |

**Total Critical Bugs:** 10+

---

## Recommended Priority Order

1. **Immediately:** Fix framer-motion dependency (breaks UI)
2. **High Priority:** Fix API URL hardcoding (breaks dev environment)
3. **High Priority:** Add JSON.parse error handling (crash risk)
4. **Medium Priority:** Improve input validation (security)
5. **Medium Priority:** Remove console logs (performance)
6. **Low Priority:** Improve type safety (code quality)
