# Complete Security System Documentation

## Overview

Your Buzz Filing system implements a **multi-layered, enterprise-grade security architecture** with 8 distinct security components. This document provides comprehensive coverage of all security features, how they work, and their implementation details.

---

## 🔐 1. Authentication & Authorization System

### Location
- `config/jwt.ts` - JWT configuration & token signing
- `lib/auth.ts` - Client-side authentication logic
- `lib/auth-server.ts` - Server-side authentication utilities
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/refresh/route.ts` - Token refresh endpoint

### How It Works

**JWT Token Structure:**
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId, email, role, iat, exp }
Signature: HMAC-SHA256(header + payload, SECRET)
```

**Token Configuration:**
- Secret Key: `@Saleem8637` (stored in JWT_SECRET)
- Expiration: 7 days
- Algorithm: HS256 (HMAC-SHA256)
- Cookie Storage: SameSite=Strict (prevents CSRF attacks)

**Flow:**
1. User logs in → `POST /api/auth/login`
2. Backend verifies credentials using bcrypt
3. JWT token generated and stored in httpOnly cookie
4. Token automatically sent with all requests
5. Backend verifies token signature on each request
6. Token expires after 7 days (user must login again)

**Password Security:**
- Hashed with bcrypt (salt rounds: 10)
- Never stored in plain text
- Compared using bcrypt.compare() (prevents timing attacks)

**User Roles:**
- `admin` - Full system access, can manage users, view all data
- `client` - Limited access, view only their own orders

---

## 🎯 2. Device Fingerprinting & IP Binding

### Location
- `lib/device-fingerprint.ts` - Device identification logic
- `lib/geolocation.ts` - IP-to-location mapping
- `lib/middleware/verify-device.ts` - Device verification middleware

### What It Does

**Prevents Token Theft:** Even if an attacker steals your auth token via XSS or MitM:
- Token is bound to your specific device
- If attacker opens token in their browser = **INSTANT 403 REJECTION**
- Only the original device/browser can use the token

**How Device Fingerprinting Works:**
```
Device Fingerprint = SHA256(
  user-agent +
  screen resolution +
  color depth +
  timezone +
  browser language +
  canvas fingerprint
)
```

**Example:**
- Your device: `a3f7c2d1e9b4...` (64-character hash)
- Attacker's device: `b4g8d3e2f0c5...` (different hash)
- Even with stolen token, attacker's fingerprint doesn't match
- Request rejected with 403 Forbidden

**IP Address Binding:**
- Every login captures your IP address
- Tokens tied to login IP
- Request from different IP = rejected
- Exception: Same city geolocation (for mobile users switching networks)

**Impossible Travel Detection:**
- If token used from NYC then Tokyo in <1 hour = auto-blocked
- Physically impossible to travel that distance
- User receives security alert email
- All user sessions invalidated

---

## 🔑 3. Session Management

### Location
- Database collection: `sessions`
- `lib/secure-token-service.ts` - Session creation & validation

### Session Database Schema
```
{
  id: ObjectId,
  userId: String,
  deviceFingerprint: String (64-char hash),
  ipAddress: String,
  country: String,
  city: String,
  userAgent: String,
  lastUsed: Date,
  createdAt: Date,
  expiresAt: Date (30 days),
  isTrusted: Boolean,
  accessToken: String (encrypted),
  refreshToken: String (encrypted),
  tokenVersion: Number
}
```

### Session Lifecycle

1. **Login** → Session created with device fingerprint + IP
2. **Token Use** → Device/IP verified before allowing access
3. **Refresh** → New token issued, session updated
4. **Logout** → Session deleted, tokens invalidated
5. **Expire** → Auto-deleted after 30 days

### Token Rotation
- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (longer-lived)
- Tokens automatically rotated on each refresh
- Old tokens become invalid

---

## 🛡️ 4. DDoS & Rate Limiting Protection

### Location
- `lib/middleware/ddos-protection.ts` - DDoS mitigation
- `lib/security/security-db.ts` - Threat logging

### Protection Mechanisms

**1. Request Rate Limiting**
```
MAX_REQUESTS_PER_SECOND: 20 (per IP)
MAX_REQUESTS_PER_MINUTE: 200 (per IP)
AGGRESSIVE_BLOCK_THRESHOLD: 200 (instant block)
```

**2. Auto-Blocking**
- If IP exceeds 200 req/min → automatic 30-minute temporary block
- If IP exceeds 20 req/sec → escalating response
- Multiple violations → permanent ban

**3. Manual IP Management**
- Admins can permanently ban IPs
- Admins can whitelist IPs (bypass all checks)
- Bans synced to database, persist across server restarts

**4. Threat Logging**
All security events logged to database:
- DDoS attacks detected
- Rate limit violations
- Failed login attempts
- IP bans/unbans
- Manual admin actions

**5. Detection Thresholds**
```
Low:       1-20 requests/min
Medium:   21-100 requests/min
High:     101-400 requests/min
Critical: 400+ requests/min
```

---

## 🔒 5. Account Lockout & Brute Force Protection

### Location
- `lib/middleware/account-lockout.ts` - Account lockout logic
- Database collection: `security_logs`

### How It Works

**Failed Login Tracking:**
- Tracks failed login attempts per email address
- Time window: 15 minutes
- Max attempts: 5

**Lockout Triggers:**
- 5 failed login attempts within 15 minutes → Account locked for 15 minutes
- Lockout period: 15 minutes (automatically expires)
- User cannot login during lockout (all attempts rejected)

**Logging:**
Each login attempt logged to database:
```
{
  type: "login_success" | "login_failed" | "account_locked",
  email: String,
  ip: String,
  timestamp: Date,
  attemptCount: Number (if failed)
}
```

**User Notification:**
- On 4th failed attempt: "1 attempt remaining before lockout"
- On 5th failed attempt: "Account locked for 15 minutes"
- Email notification sent (optional future feature)

---

## 🚨 6. Security Threat Monitoring & Database

### Location
- `lib/security/security-db.ts` - Threat logging functions

### Threat Types Tracked
```
1. DDoS attacks
2. Brute force login attempts
3. XSS attack attempts
4. SQL injection attempts
5. Manual IP bans
6. Account lockouts
7. Device mismatches
8. Impossible travel detected
```

### Severity Levels
```
LOW:      Non-critical, informational
MEDIUM:   Suspicious activity, rate limit
HIGH:     Attack pattern detected, auto-block
CRITICAL: Severe threat, immediate action
```

### Database Collections
- `security_threats` - All threat events
- `banned_ips` - Temporarily/permanently banned IPs
- `whitelisted_ips` - Whitelisted IPs (bypass checks)
- `security_logs` - Detailed audit trail
- `sessions` - Active user sessions

---

## 🎪 7. Input Validation & Sanitization

### Location
- `lib/validation.ts` - Validation functions
- `lib/api-middleware.ts` - API request validation

### Validation Rules
```
Email:        RFC 5322 standard + custom rules
Password:     Min 8 chars, uppercase, lowercase, number
Phone:        International format (E.164)
Company Name: No special characters, 2-100 chars
LLC State:    2-letter US state code
```

### Sanitization
- Remove HTML tags from all text inputs
- Escape special characters in strings
- Validate data types before processing
- Remove null bytes

### XSS Prevention
- All user input escaped before rendering
- Content Security Policy headers
- JavaScript sanitization on frontend

---

## 🔐 8. Data Protection & Encryption

### Location
- `config/database.ts` - Database configuration
- MongoDB encryption at rest (if enabled)

### What's Encrypted
1. **Passwords** - bcrypt hashing (one-way, salted)
2. **JWT Tokens** - HMAC-SHA256 signature
3. **Session Data** - Stored encrypted in database
4. **API Keys** - Environment variables (never in code)

### What's Protected
1. **HTTPS/TLS** - All communication encrypted in transit
2. **Cookies** - httpOnly (inaccessible to JavaScript)
3. **CORS** - Restricted origins, prevent cross-origin attacks
4. **CSRF** - SameSite=Strict cookies, token validation

### Database Security
- MongoDB Atlas encryption at rest
- Authentication required (username + password)
- IP whitelisting (only app servers can connect)
- Automatic backups encrypted

---

## 📊 Security Architecture Diagram

```
User Request
    ↓
[1] DDoS Protection → Rate limit check, IP validation
    ↓
[2] Account Lockout → Check if account is locked
    ↓
[3] JWT Verification → Token signature validation
    ↓
[4] Device Fingerprint → Device/IP binding check
    ↓
[5] Geolocation → Impossible travel detection
    ↓
[6] Role Authorization → Permission check
    ↓
[7] Input Validation → Sanitize & validate data
    ↓
[8] Threat Logging → Log to security database
    ↓
Request Processed (if all checks pass)
    ↓
Response sent with Security Headers
```

---

## 🚀 How All Systems Work Together

### Scenario 1: Successful Login
```
1. User enters email + password
2. DDoS check passes (not suspicious)
3. Account not locked (less than 5 failed attempts)
4. Password hash verified with bcrypt
5. Device fingerprint captured
6. IP address captured
7. JWT token generated + session created
8. Token sent in httpOnly cookie
9. User logged in ✅
```

### Scenario 2: Failed Login (Brute Force)
```
1. Attacker tries 5 wrong passwords
2. Failed attempt 1: "4 attempts remaining"
3. Failed attempt 2: "3 attempts remaining"
4. Failed attempt 3: "2 attempts remaining"
5. Failed attempt 4: "1 attempt remaining"
6. Failed attempt 5: Account locked for 15 minutes
7. Subsequent attempts: "Account is locked"
8. After 15 minutes: Auto-unlock, can login again
```

### Scenario 3: Token Theft (XSS Attack)
```
1. Attacker steals auth token via XSS
2. Attacker tries to use token from their device
3. Device fingerprint check fails (different device)
4. Request rejected: 403 Forbidden
5. Attacker tries different IP (geolocation)
6. IP check fails (different location)
7. Request rejected: 403 Forbidden
8. Impossible travel check triggers
9. User's all sessions invalidated
10. User gets security alert email
11. User must login again ✅
```

### Scenario 4: DDoS Attack
```
1. Attacker sends 1000 requests from single IP in 1 minute
2. Request 1-20: Allowed (within limit)
3. Request 21-100: Warning (suspicious)
4. Request 101-200: Rate limited response
5. Request 201+: IP blocked for 30 minutes
6. Threat logged to database (severity: CRITICAL)
7. Admin notified via dashboard
8. After 30 mins: IP automatically unblocked
9. If repeated: Permanent ban
```

---

## 🛠️ Admin Security Management

### Checking Security Threats
```
GET /api/admin/security/threats → List all threat events
GET /api/admin/security/stats → Security statistics
GET /api/admin/security/logs → Audit trail
```

### Managing IP Bans
```
POST /api/admin/security/ban-ip
  { ip: "192.168.1.1", duration: 3600000, reason: "DDoS" }

POST /api/admin/security/whitelist-ip
  { ip: "203.0.113.1", reason: "Corporate office" }

POST /api/admin/security/unban-ip
  { ip: "192.168.1.1" }
```

### Viewing Active Sessions
```
GET /api/admin/users/{userId}/sessions → All user sessions
DELETE /api/admin/users/{userId}/sessions → Logout all devices
```

---

## 📋 Security Best Practices

### For Users
1. Use strong, unique passwords (min 12 characters)
2. Don't share your login link with anyone
3. Logout when done, especially on shared devices
4. Enable browser autofill for passwords (remembers secure credentials)
5. Report suspicious activity immediately
6. Don't open suspicious emails/links

### For Developers
1. Never log passwords or tokens
2. Always validate user input server-side
3. Use HTTPS only (never HTTP)
4. Keep dependencies updated
5. Follow OWASP Top 10 guidelines
6. Regular security audits

### For Admins
1. Monitor security dashboard daily
2. Review threat logs weekly
3. Update IP bans as needed
4. Whitelist known safe IPs
5. Notify users of suspicious activity
6. Have incident response plan

---

## 🔍 Security Checklist

- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] Device fingerprinting
- [x] IP address binding
- [x] DDoS protection
- [x] Rate limiting
- [x] Account lockout
- [x] Brute force protection
- [x] Threat logging & monitoring
- [x] CORS configuration
- [x] CSRF protection
- [x] Input validation
- [x] Data encryption (at rest & in transit)
- [x] httpOnly cookies
- [x] Session management
- [x] Impossible travel detection
- [x] Admin IP management
- [x] Automatic ban expiration
- [x] Security audit logs
- [x] Email notifications

---

## 📞 Support & Security Issues

If you discover a security vulnerability:
1. **DO NOT** post it publicly
2. Email security@buzzfiling.com with details
3. Include steps to reproduce
4. Allow 48 hours for response
5. Do not exploit the vulnerability further

---

**Last Updated:** July 2026
**Version:** 1.0
**Status:** Active & Maintained
