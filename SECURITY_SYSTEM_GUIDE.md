# Security System Guide

## Overview
Your website now has a comprehensive security system with both automatic threat detection and manual admin controls.

---

## Current Security Status

### Automatic Protection (Currently Active)
✅ **Security Headers** - Applied to all requests automatically
✅ **Manual IP Banning** - Admins can ban specific IPs  
✅ **IP Whitelisting** - Trusted IPs bypass all checks
✅ **XSS Detection** - Logs suspicious script injection attempts
✅ **SQL Injection Detection** - Monitors for database attack patterns
✅ **Request Monitoring** - Tracks all IP activity in real-time

### Automatic Blocking (Currently DISABLED)
⚠️ **DDoS Auto-Block** - Set to monitoring mode only
⚠️ **Rate Limiting Auto-Block** - Set to monitoring mode only

**Note:** Auto-blocking is disabled because it was causing false positives and blocking legitimate users. The system now only monitors and logs suspicious activity.

---

## How Manual IP Banning Works

### Admin Dashboard Access
1. Navigate to `/admin/security`
2. Login with admin credentials
3. View all active and banned IPs in real-time

### Ban an IP Address (3 Methods)

#### Method 1: Manual Ban Form
1. Go to "Manual IP Ban" section
2. Enter IP address (e.g., 192.168.1.1)
3. Select duration:
   - **30 Minutes** - Temporary ban for minor issues
   - **24 Hours** - Medium-term ban for repeated violations
   - **Permanent** - Permanent blacklist for serious threats
4. Enter reason (e.g., "DDoS attempt", "Suspicious activity")
5. Click "Ban IP Address"

#### Method 2: Quick Ban from Active IPs
1. Go to "Active IPs" tab
2. Find the suspicious IP
3. Click "Quick Ban" button next to any active IP
4. Confirm the ban

#### Method 3: API Endpoint
```bash
curl -X POST /api/admin/security/ban \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.1",
    "duration": "30min",
    "reason": "Suspicious activity"
  }'
```

### Unban an IP Address
1. Go to "Banned IPs" tab in `/admin/security`
2. Find the IP address
3. Click "Unblock" button
4. IP is immediately removed from blacklist

### Whitelist an IP Address (Never Gets Banned)
1. Go to "Whitelist IP Address" section
2. Enter trusted IP address
3. Click "Whitelist" button
4. This IP will bypass ALL security checks permanently

---

## Security Flows (What Works Automatically)

### 1. Request Processing Flow
```
User Request → Proxy Middleware → Security Checks → Response
```

**Every Request Goes Through:**
1. **IP Extraction** - Identifies user's IP address
2. **Blacklist Check** - Blocks if IP is banned
3. **Whitelist Check** - Bypasses security if whitelisted
4. **Request Tracking** - Logs IP activity
5. **Security Headers** - Adds protection headers to response

### 2. Blacklist Check (Always Active)
- Manually banned IPs are **immediately blocked**
- Returns 403 Forbidden response
- Shows custom error message
- Works even with auto-blocking disabled

### 3. Request Monitoring (Always Active)
- Tracks requests per IP
- Counts suspicious activities
- Logs high request rates
- Updates dashboard in real-time
- **Does NOT block** - only monitors

### 4. Security Headers (Always Active)
Every response includes:
- **Content-Security-Policy** - Prevents XSS attacks
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Strict-Transport-Security** - Enforces HTTPS
- **X-XSS-Protection** - Browser-level XSS protection

### 5. Threat Detection (Monitoring Only)
Logs but doesn't block:
- XSS attempts (script tags, javascript: URLs)
- SQL injection patterns (SELECT, DROP, UNION)
- Path traversal (../ patterns)
- Suspicious request patterns
- Abnormal payload sizes

---

## Admin Security Dashboard Features

### Real-Time Statistics
- **Blocked IPs** - Currently banned addresses
- **Total Threats** - Detected suspicious activities today
- **Requests Today** - Total request count
- **Active Threats** - Ongoing suspicious patterns

### Banned IPs Tab
- View all currently banned IPs
- See ban reason and threat level
- Check request counts and timestamps
- Unblock IPs with one click
- Search and filter by IP or reason

### Active IPs Tab
- Monitor all current connections
- See request counts per IP
- Track suspicious activity scores
- Last seen timestamps
- Quick-ban suspicious IPs instantly

### Auto-Refresh
- Toggle on/off for real-time updates
- Refreshes every 30 seconds when enabled
- Manual refresh button available

---

## How Bans Actually Work (Technical)

### When You Ban an IP:
```typescript
// API receives ban request
POST /api/admin/security/ban
{
  ip: "192.168.1.1",
  duration: "30min", // or "24h" or "permanent"
  reason: "DDoS attempt"
}

// IP is added to blacklist Set
blacklistedIPs.add(ip)

// Tracker is updated with duration
tracker.blocked = true
tracker.blockedUntil = Date.now() + durationMs // or undefined for permanent
```

### When Banned IP Makes Request:
```typescript
// Proxy middleware checks blacklist first
if (blacklistedIPs.has(ip)) {
  return NextResponse.json({ 
    error: "Access denied. Your IP has been blocked by administrator." 
  }, { status: 403 })
}
```

### Ban Expiry (for timed bans):
- System checks `blockedUntil` timestamp
- If current time > blockedUntil, ban auto-expires
- IP is removed from blacklist
- Tracker is reset to unblocked state

---

## Testing the Ban System

### Test Manual Ban:
1. Get your current IP: Visit `/admin/security` and find it in "Active IPs"
2. Ban your IP using manual ban form (use 30min duration)
3. Try to access any page on the website
4. You should see: "Access denied. Your IP has been blocked by administrator."
5. Wait for ban to expire or unblock from admin dashboard
6. Access should be restored

### Test Whitelist:
1. Add your IP to whitelist
2. Even if you ban it, you should still have access
3. Whitelist takes precedence over blacklist

---

## Common Questions

**Q: Why was I banned without doing anything suspicious?**
A: Auto-blocking is now disabled. If you're banned, it was done manually by an admin. Contact support if you believe this was an error.

**Q: How do I avoid getting banned?**
A: 
- Keep request rate under 100 requests/second
- Don't try to inject scripts or SQL commands
- Use the website normally through the browser
- Don't use aggressive automation or scrapers

**Q: Can I ban IP ranges or subnets?**
A: Currently only individual IPs are supported. Future updates may add CIDR notation support.

**Q: What if I accidentally ban myself?**
A: Have another admin unblock your IP, or add your IP to the whitelist before banning, or wait for temporary ban to expire.

**Q: How do I enable automatic blocking?**
A: Edit `lib/middleware/ddos-protection.ts` and set `MONITORING_ONLY: false`. However, this is NOT recommended as it caused false positives in testing.

---

## Security Best Practices

### For Admins:
1. **Whitelist your office/home IP** before enabling strict rules
2. **Use 30-minute bans** for testing suspicious IPs
3. **Use 24-hour bans** for confirmed minor threats
4. **Use permanent bans** only for serious attacks
5. **Document ban reasons** clearly for audit trails
6. **Monitor Active IPs tab** regularly for anomalies
7. **Keep auto-refresh enabled** during active incidents

### Ban Criteria Recommendations:
- **30min:** Unusual traffic spikes, possible bot behavior
- **24hr:** Repeated violations, confirmed bot activity
- **Permanent:** DDoS attacks, hack attempts, persistent abuse

### When to Whitelist:
- Your own IP addresses
- Office network IPs
- CDN/proxy IP addresses
- Trusted API clients
- Monitoring services
- Business partner IPs

---

## Monitoring Logs

Check Vercel logs for security events:
```
[DDOS] IP blocked: 192.168.1.1
[ADMIN BAN] IP 192.168.1.1 banned by admin for 30min. Reason: DDoS attempt
[SECURITY] IP 192.168.1.1 removed from blacklist
[DDOS] IP 192.168.1.1 added to whitelist
```

---

## Support

If you need to:
- Enable automatic blocking
- Adjust rate limits
- Customize ban durations
- Add more security rules
- Integrate with external security services

Contact your development team for configuration changes.
