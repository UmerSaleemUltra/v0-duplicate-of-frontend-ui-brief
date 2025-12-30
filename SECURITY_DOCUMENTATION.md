# Complete Security System Documentation

## Overview

Your website has a comprehensive, multi-layered security system that automatically protects against various types of attacks. All security measures are **ACTIVE** and working in production.

---

## Security Features

### 1. DDoS Protection (Active)

**Automatic IP Blocking for DDoS Attacks**

**Thresholds:**
- 20 requests per second = Warning
- 200 requests per minute = Rate limit
- 500 requests in 60 seconds = **AUTOMATIC PERMANENT BAN + 30min temp block**
- 10 sustained warnings = **AUTOMATIC 30-MINUTE BLOCK**

**What Happens:**
1. System detects excessive request rate
2. IP is automatically blocked
3. Console shows ASCII art alert
4. Admin dashboard updates in real-time
5. User sees blocked page with details

**Admin Dashboard Location:** `/admin/security`

---

### 2. Login Brute Force Protection (Active)

**Automatic IP Blocking for Failed Login Attempts**

**Thresholds:**
- **5 failed attempts per email** in 15 minutes = **IP BLOCKED FOR 30 MINUTES**
- **10 failed attempts from same IP** in 15 minutes = **IP BLOCKED FOR 30 MINUTES**

**What Happens:**
1. User attempts login with wrong password
2. System tracks attempts by email and IP
3. After threshold exceeded:
   - IP automatically blocked
   - Console shows "BRUTE FORCE ATTACK DETECTED" alert
   - User receives 429 error with block message
   - Blocked IP redirected to blocked page on next page request

**Protection Against:**
- Password guessing attacks
- Credential stuffing
- Account takeover attempts

---

### 3. XSS (Cross-Site Scripting) Protection (Active)

**Automatic Detection and Blocking**

**Patterns Detected:**
- `<script>` tags in inputs
- `javascript:` protocol in URLs
- Event handlers like `onclick`, `onerror`
- `<iframe>` injection attempts

**Action:** 
- Request blocked immediately
- No data processing occurs
- Security event logged

---

### 4. SQL Injection Protection (Active)

**Automatic Detection and Blocking**

**Patterns Detected:**
- `UNION SELECT` statements
- `DROP TABLE` commands
- `DELETE FROM` queries
- `OR 1=1` patterns
- SQL comment markers `--` or `/* */`

**Action:**
- **AUTOMATIC PERMANENT IP BAN**
- Critical security alert logged
- Admin notification (console)

---

### 5. Path Traversal Protection (Active)

**Blocks attempts to access:**
- `/../` (directory traversal)
- `/etc/passwd` (system files)
- `/.env` (environment variables)
- `/.git/` (source code)

**Action:**
- Request blocked
- IP marked as suspicious
- Logged in admin dashboard

---

### 6. Security Headers (Active)

**Automatically applied to all responses:**
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-XSS-Protection: 1; mode=block` (enables XSS filter)
- `Content-Security-Policy` (restricts resource loading)
- `Strict-Transport-Security` (enforces HTTPS)

---

## Admin Security Dashboard

**URL:** `/admin/security`

**Features:**

### Real-Time Monitoring
- Live statistics (auto-refresh every 30 seconds)
- Blocked IPs count
- Total threats detected
- Requests today
- Active threats

### Banned IPs Tab
- View all blocked IPs
- See block reason and duration
- One-click unblock button
- Search and filter

### Active IPs Tab
- Monitor currently connected IPs
- See request counts
- Suspicious activity levels
- Quick-ban suspicious IPs

### Manual Controls
- **Ban Any IP:** Enter IP, select duration (30min/24hr/permanent), add reason
- **Whitelist IPs:** Add trusted IPs that bypass all security
- **Unblock IPs:** Remove any IP from blacklist

---

## Blocked Page Experience

**URL:** `/blocked`

When an IP is blocked, users see:
- Clear explanation of why they're blocked
- Their IP address
- Block duration (if temporary)
- Unblock time
- Contact information for false positives

---

## How Automatic Blocking Works

### DDoS Attack Flow
```
1. User sends 500+ requests in 60 seconds
2. DDoS protection detects pattern
3. IP added to permanent blacklist
4. IP also temp blocked for 30 minutes
5. Console shows ASCII box alert
6. Admin dashboard updates
7. User redirected to /blocked page
```

### Login Brute Force Flow
```
1. User tries wrong password 5 times for same email
2. Rate limit system detects pattern
3. IP automatically blocked for 30 minutes
4. Console shows "BRUTE FORCE ATTACK" alert
5. User receives 429 error
6. Next request redirects to /blocked page
7. Admin sees blocked IP in dashboard
```

### SQL Injection Flow
```
1. Attacker sends SQL in form input
2. Security guard detects SQL pattern
3. IP PERMANENTLY BANNED immediately
4. Critical alert logged
5. Request terminated
6. User sees blocked page
```

---

## Testing the Security System

### Test DDoS Protection

**Method 1: Python Script**
```python
import requests
for i in range(100):
    try:
        r = requests.get("https://your-site.com")
        print(f"[{i}] {r.status_code}")
    except Exception as e:
        print(f"[{i}] BLOCKED: {e}")
```

**Expected Result:**
- First 20-50 requests succeed
- Then receive 403 Forbidden
- Terminal shows ASCII security alert
- IP appears in admin dashboard

### Test Login Protection

**Method 1: Manual Test**
1. Go to `/login`
2. Enter wrong password 6 times
3. Should see "Your IP has been temporarily blocked"
4. Check `/admin/security` to see your IP listed

### Test Manual Ban

**Method 1: Admin Dashboard**
1. Go to `/admin/security`
2. Enter any IP address
3. Select ban duration
4. Click "Ban IP"
5. Try accessing site from that IP
6. Should see blocked page

---

## Monitoring Security

### Console Logs

When attacks are detected, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║         🚨 DDOS ATTACK DETECTED - IP BLOCKED 🚨           ║
╚════════════════════════════════════════════════════════════╝
IP Address: 123.456.789.0
Total Requests: 500 in 60 seconds
Action: PERMANENTLY BLACKLISTED + 30min temp block
```

### Admin Dashboard

Check `/admin/security` to see:
- All blocked IPs with reasons
- Active connection patterns
- Threat statistics
- Recent security events

### Vercel Logs

View deployment logs for:
- Security alerts
- Block events
- Attack patterns
- System health

---

## Whitelisting Trusted IPs

### Method 1: Admin Dashboard
1. Go to `/admin/security`
2. Enter IP in "Whitelist IP" section
3. Click "Whitelist"
4. IP bypasses all security checks

### Method 2: Code (for permanent whitelist)
Edit `lib/middleware/ddos-protection.ts`:
```typescript
const whitelistedIPs = new Set<string>([
  "123.456.789.0", // Your office IP
  "98.765.432.1",  // Admin IP
])
```

**Note:** Whitelisted IPs bypass ALL security including DDoS, rate limiting, and attack detection.

---

## Unblocking IPs

### Temporary Blocks
- Auto-expire after duration (30 minutes or 24 hours)
- No action needed

### Permanent Blocks
Must be manually unblocked:

1. Go to `/admin/security`
2. Find IP in "Banned IPs" tab
3. Click "Unblock" button
4. IP immediately removed from blacklist

---

## Security Best Practices

### For Admins

1. **Monitor regularly:** Check `/admin/security` daily
2. **Review threat logs:** Look for patterns
3. **Whitelist known IPs:** Add your office/admin IPs
4. **Don't whitelist unknown IPs:** Only trust verified addresses
5. **Check Vercel logs:** Review security alerts

### For Users

1. **Don't use automated scripts** without rate limiting
2. **Keep requests reasonable:** Under 10 per second
3. **Use proper authentication:** Don't brute force passwords
4. **Contact admin if blocked:** False positives can be unblocked

### For Developers

1. **Keep security thresholds:** Don't increase limits without reason
2. **Test before deployment:** Use staging environment
3. **Monitor false positives:** Adjust thresholds if legitimate users blocked
4. **Review security logs:** Regular audits

---

## Configuration

### Adjusting Thresholds

Edit `lib/middleware/ddos-protection.ts`:

```typescript
const DDOS_CONFIG = {
  MONITORING_ONLY: false, // Set true to disable blocking
  MAX_REQUESTS_PER_SECOND: 20, // Lower = stricter
  MAX_REQUESTS_PER_MINUTE: 200,
  AGGRESSIVE_BLOCK_THRESHOLD: 500,
  BLOCK_DURATION: 1800000, // 30 minutes in ms
  SUSPICIOUS_THRESHOLD: 10,
}
```

Edit `lib/middleware/advanced-rate-limit.ts`:

```typescript
const LIMITS = {
  LOGIN: {
    PER_USER: { max: 5, windowMs: 900000 }, // 5 attempts per 15 min
    PER_IP: { max: 10, windowMs: 900000 },  // 10 attempts per 15 min
  },
}
```

---

## Troubleshooting

### False Positives

**Symptom:** Legitimate users getting blocked

**Solution:**
1. Check admin dashboard for their IP
2. Click "Unblock"
3. Add to whitelist if trusted
4. Consider increasing thresholds

### Not Blocking Attacks

**Symptom:** Attacks not being blocked

**Check:**
1. Is `MONITORING_ONLY: false` in ddos-protection.ts?
2. Are security functions being called in proxy.ts?
3. Check Vercel logs for errors
4. Verify middleware is running

### Dashboard Not Updating

**Symptom:** Admin dashboard shows old data

**Solution:**
1. Toggle auto-refresh on
2. Click manual refresh button
3. Check browser console for errors
4. Verify API endpoints are working

---

## API Endpoints

### Security Dashboard Data
`GET /api/admin/security/dashboard`
- Returns: blocked IPs, active IPs, stats, your IP

### Ban IP
`POST /api/admin/security/ban`
- Body: `{ ip, duration, reason }`
- Requires: Admin authentication

### Unblock IP
`POST /api/admin/security/unblock`
- Body: `{ ip }`
- Requires: Admin authentication

### Whitelist IP
`POST /api/admin/security/whitelist`
- Body: `{ ip }`
- Requires: Admin authentication

---

## System Status

**All Security Features: ACTIVE ✅**

- DDoS Protection: Active with automatic blocking
- Login Brute Force Protection: Active with automatic blocking
- XSS Protection: Active
- SQL Injection Detection: Active with permanent bans
- Path Traversal Blocking: Active
- Security Headers: Active on all responses
- Admin Dashboard: Fully functional
- Blocked Page: Working with redirects

---

## Support

If you encounter issues:

1. Check `/admin/security` dashboard
2. Review Vercel deployment logs
3. Check browser console for errors
4. Verify environment variables are set
5. Test in incognito mode (to rule out cache issues)

For persistent issues, check:
- Next.js version compatibility
- Vercel runtime configuration
- Middleware execution order
- Database connectivity (for logging)

---

## Quick Reference

| Attack Type | Threshold | Action | Duration |
|------------|-----------|--------|----------|
| DDoS | 500 req/60s | Permanent + Temp Ban | Permanent + 30min |
| Login Brute Force (per email) | 5 attempts/15min | Temp Ban | 30 minutes |
| Login Brute Force (per IP) | 10 attempts/15min | Temp Ban | 30 minutes |
| SQL Injection | First detection | Permanent Ban | Permanent |
| XSS Attempt | First detection | Temp Ban | 30 minutes |
| Path Traversal | First detection | Warning → Ban | Escalating |

---

Last Updated: 2025-12-31
Security System Version: 2.0
Status: Production Ready ✅
