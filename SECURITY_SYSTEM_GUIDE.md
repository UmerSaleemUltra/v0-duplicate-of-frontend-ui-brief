# Security System Guide - Complete Documentation

## Overview
Your website has a comprehensive multi-layer security system with automatic threat detection, manual admin controls, and real-time monitoring capabilities.

---

## Security Status Summary

### Active Protection Layers (Always On)
- **Security Headers** - CSP, XSS protection, clickjacking prevention
- **Manual IP Banning** - Admin-controlled IP blocking with flexible durations
- **IP Whitelisting** - Trusted IPs bypass all security measures
- **DDoS Protection** - Active blocking at 20 req/sec, 200 req/min thresholds
- **XSS Detection** - Monitors and blocks script injection attempts
- **SQL Injection Detection** - Detects and blocks database attack patterns
- **Real-Time Monitoring** - Tracks all IP activity with detailed logging
- **Blocked Page Redirect** - Beautiful error page for banned users

### Security Thresholds (Automatic Blocking)
- **20 requests per second** - Warning threshold
- **200 requests per minute** - Rate limit threshold
- **500 requests in 60 seconds** - Immediate permanent ban + 30min temp block
- **10 warnings** - Results in 30-minute temporary block

---

## Admin Dashboard Access

### Getting to the Security Dashboard
1. Login at `/login` with admin credentials
2. Navigate to `/admin/security` or click "Security" in admin sidebar
3. Dashboard auto-refreshes every 30 seconds (toggleable)

### Dashboard Features

#### Real-Time Statistics
Four key metrics displayed with live updates:
- **Blocked IPs** - Currently banned addresses (red indicator)
- **Total Threats** - All detected suspicious activities today
- **Requests Today** - Complete request count across all IPs
- **Active Threats** - Ongoing suspicious patterns requiring attention

#### IP Management Tabs
1. **Banned IPs Tab**
   - View all currently blocked IP addresses
   - See ban reason, threat level, and timestamps
   - Request count and last attempt time
   - One-click unblock functionality
   - Search and filter capabilities

2. **Active IPs Tab**
   - Monitor all current connections in real-time
   - Request counts per IP address
   - Suspicious activity scores
   - Last seen timestamps
   - Quick-ban button for instant blocking

#### Threat Logs Section
- Real-time threat detection logs
- Color-coded severity levels (low, medium, high, critical)
- Detailed threat descriptions
- IP addresses and timestamps
- Automatic blocking status

#### Security Status Grid
- DDoS Protection status and thresholds
- XSS Protection with CSP details
- Rate Limiting configuration
- Security Headers status
- All protection layers displayed with green active badges

---

## How to Ban IP Addresses

### Method 1: Manual Ban Form (Recommended)

Located at the top of the security dashboard:

1. **Enter IP Address**
   - Type the IP address (e.g., 192.168.1.1)
   - Format is automatically validated

2. **Select Ban Duration**
   - **30 Minutes** - For testing, minor violations, or suspicious patterns
   - **24 Hours** - For repeated violations or confirmed bot activity
   - **Permanent** - For DDoS attacks, hack attempts, or severe threats

3. **Provide Ban Reason**
   - Enter detailed reason (e.g., "DDoS attack detected - 1000+ requests in 60 seconds")
   - Reason is logged and displayed to other admins
   - Required field for audit trail

4. **Click "Ban IP Address"**
   - IP is immediately added to blacklist
   - All future requests from this IP are blocked
   - Toast notification confirms the ban

**What Happens When You Ban:**
- IP added to permanent blacklist Set in memory
- Request tracker updated with block duration
- All subsequent requests return 403 Forbidden
- User sees beautiful blocked page with details
- Ban logged in server console with ASCII art box
- Dashboard updates immediately

### Method 2: Quick Ban from Active IPs

Perfect for responding to ongoing threats:

1. Go to **Active IPs tab**
2. Find suspicious IP (look for high request counts or suspicious activity warnings)
3. Click **Quick Ban** button (red ban icon)
4. IP address auto-fills in manual ban form
5. Reason pre-populated as "Suspicious activity detected"
6. Select duration and confirm ban

### Method 3: API Endpoint (for Automation)

```bash
curl -X POST https://yoursite.com/api/admin/security/ban \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.1",
    "duration": "30min",
    "reason": "Automated ban - DDoS pattern detected"
  }'
```

**Valid duration values:**
- `"30min"` - 30 minutes
- `"24hr"` - 24 hours  
- `"permanent"` - Never expires

---

## How to Unban IP Addresses

### From Admin Dashboard
1. Go to **Banned IPs tab**
2. Find the IP address you want to unblock
3. Click green **Unblock** button
4. IP is immediately removed from blacklist
5. User can access the site instantly

### Via API
```bash
curl -X POST https://yoursite.com/api/admin/security/unblock \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.1"}'
```

### Automatic Expiry
- **30-minute bans** expire automatically after 30 minutes
- **24-hour bans** expire automatically after 24 hours
- **Permanent bans** never expire (must be manually unblocked)
- System checks expiry on each request attempt

---

## IP Whitelisting

### When to Whitelist
Whitelist IPs that should NEVER be blocked:
- Your own IP addresses (home, office)
- Company network IP ranges
- CDN or proxy IPs
- Trusted API clients
- Monitoring service IPs
- Business partner connections
- Payment gateway IPs

### How to Whitelist

1. Go to **Whitelist IP Address** section (blue gradient card)
2. Enter trusted IP address
3. Click **Whitelist** button
4. IP bypasses ALL security checks permanently

**What Whitelisting Does:**
- IP checked before any other security measures
- Bypasses DDoS protection completely
- Bypasses rate limiting
- Bypasses blacklist (even if manually banned)
- Bypasses all threat detection
- Never appears in blocked IPs
- Remains whitelisted until manually removed

**Important:** Whitelist takes precedence over everything, including manual bans.

---

## Security Flows - How It All Works

### 1. Every Request Processing Flow

```
User Request
    ↓
Proxy Middleware (proxy.ts)
    ↓
Extract IP Address
    ↓
Check Blacklist → BLOCKED if found (403 Forbidden)
    ↓
Check Whitelist → ALLOWED if found (skip all checks)
    ↓
DDoS Protection Check
    ↓
Track Request (increment counters)
    ↓
Rate Limit Analysis
    ↓
Threat Detection (XSS, SQL injection)
    ↓
Apply Security Headers
    ↓
Continue to Application
```

### 2. DDoS Protection (Active Blocking)

**Tracking:**
- Every IP has a request tracker
- Stores timestamps of last 60 seconds of requests
- Counts suspicious activity score
- Maintains blocked status and expiry time

**Thresholds:**
1. **20 requests in 1 second** → Warning (increases suspicious score)
2. **10 warnings accumulated** → 30-minute temporary block
3. **200 requests in 1 minute** → Rate limit warning
4. **500 requests in 60 seconds** → PERMANENT blacklist + 30min temp block

**Blocking Actions:**
- High rate detected → Increase suspicious activity counter
- Threshold exceeded → Block IP with duration
- Aggressive attack → Add to permanent blacklist
- Log event with ASCII art box in console
- Update dashboard stats

### 3. Blocked Page Experience

When a blocked IP tries to access any page:

**Browser Detection:**
- System checks Accept header for "text/html"
- Browser requests get redirected to `/blocked` page
- API requests get JSON error response

**Blocked Page Shows:**
- Large animated warning icon
- "Access Blocked" heading with pulse animation
- Specific block reason
- User's IP address
- Unblock time (for temporary bans)
- Permanent status indicator (if applicable)
- Request ID and timestamp
- Professional, beautiful design with gradients

**API Response:**
```json
{
  "error": "Access denied",
  "blocked": true,
  "details": {
    "ip": "192.168.1.1",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "url": "/api/endpoint",
    "method": "POST"
  }
}
```

### 4. Security Headers (Always Applied)

Every response includes:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; 
  frame-src 'self' https://www.youtube.com;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Protection Against:**
- XSS attacks (Content-Security-Policy)
- Clickjacking (X-Frame-Options)
- MIME sniffing (X-Content-Type-Options)
- Information leakage (Referrer-Policy)
- Unauthorized device access (Permissions-Policy)

### 5. Threat Detection & Logging

**Monitored Patterns:**
- `<script>` tags in requests
- `javascript:` protocol URLs
- SQL keywords (SELECT, DROP, INSERT, UNION, DELETE)
- SQL comment markers (`--`, `/*`)
- Path traversal patterns (`../`, `..\\`)
- Event handlers (onclick, onerror, onload)
- Large payload sizes (>10MB)

**Logging Output:**
```
╔════════════════════════════════════════════════════════════╗
║         🚨 DDOS ATTACK DETECTED - IP BLOCKED 🚨           ║
╚════════════════════════════════════════════════════════════╝
IP Address: 192.168.1.1
Total Requests: 550 in 60 seconds
Threshold: 500 requests
Action: PERMANENTLY BLACKLISTED + 30min temporary block
Timestamp: 2025-01-01T12:00:00.000Z
URL: https://yoursite.com/api/endpoint
Method: POST
════════════════════════════════════════════════════════════
```

---

## Testing Your Security System

### Test 1: Manual Ban
1. Find your IP in Active IPs tab
2. Ban it using manual form (30min duration)
3. Open new incognito window
4. Try to access any page
5. **Expected:** Beautiful blocked page with your IP and reason
6. Unblock yourself from admin dashboard
7. **Expected:** Immediate access restored

### Test 2: DDoS Simulation
Run this script to trigger DDoS protection:

```python
import requests

url = "https://yoursite.com"
for i in range(100):
    try:
        response = requests.get(url, timeout=5)
        print(f"[{i}] {response.status_code}")
    except Exception as e:
        print(f"[{i}] Error: {e}")
```

**Expected Results:**
- First 20-50 requests succeed (200 OK)
- Around request 50-100: Rate limit warnings (429)
- After threshold: Connection errors or 403 Forbidden
- Server logs show ASCII art boxes for each security event
- Your IP appears in Banned IPs tab
- Dashboard shows increased threat count

### Test 3: Whitelist Override
1. Whitelist your IP address
2. Ban your IP address (any duration)
3. Try to access the site
4. **Expected:** Full access despite being banned
5. Whitelist takes precedence over blacklist

### Test 4: Auto-Expiry
1. Ban a test IP for 30 minutes
2. Verify it's blocked immediately
3. Wait 30 minutes
4. **Expected:** IP automatically unblocked
5. Access should be restored without manual intervention

---

## Common Scenarios & Solutions

### Scenario 1: Legitimate User Gets Banned
**Problem:** Real customer reports they can't access site
**Solution:**
1. Go to `/admin/security`
2. Search for their IP in Banned IPs tab
3. Check ban reason and timestamp
4. If legitimate, click Unblock
5. Consider adding their IP to whitelist if they're a VIP customer
6. Check threat logs to understand why they were banned

### Scenario 2: Ongoing DDoS Attack
**Problem:** Site under active attack, many IPs making thousands of requests
**Solution:**
1. Monitor Active IPs tab in real-time
2. DDoS protection will auto-ban aggressive IPs
3. Manually ban suspicious IPs using Quick Ban
4. Check server logs for attack patterns
5. Consider temporarily increasing rate limits if legitimate traffic is affected
6. After attack subsides, review and unblock any false positives

### Scenario 3: API Client Getting Rate Limited
**Problem:** Your mobile app or API integration keeps getting blocked
**Solution:**
1. Identify the API client's IP address
2. Add it to whitelist immediately
3. API client will never be rate limited or blocked
4. For multiple IPs, whitelist each one
5. Future: Consider API key authentication instead of IP-based

### Scenario 4: Office Network Blocked
**Problem:** Entire office can't access admin panel
**Solution:**
1. From home or mobile connection, access admin dashboard
2. Identify office network IP in Banned IPs
3. Unblock the IP
4. Immediately whitelist the office IP range
5. Never worry about office blocks again

### Scenario 5: False Positive DDoS Detection
**Problem:** Legitimate high-traffic event triggers DDoS protection
**Solution:**
1. Before event, whitelist known traffic sources (CDN IPs, etc.)
2. If blocking occurs, quickly unblock legitimate IPs
3. Monitor Active IPs to distinguish real users from attackers
4. Temporarily increase thresholds in `lib/middleware/ddos-protection.ts`:
   ```typescript
   MAX_REQUESTS_PER_SECOND: 50  // Increase from 20
   MAX_REQUESTS_PER_MINUTE: 500  // Increase from 200
   ```
5. After event, restore original thresholds

---

## Advanced Configuration

### Adjusting Rate Limits

Edit `lib/middleware/ddos-protection.ts`:

```typescript
const DDOS_CONFIG = {
  MONITORING_ONLY: false,  // Keep false for active protection
  MAX_REQUESTS_PER_SECOND: 20,  // Increase for high traffic sites
  MAX_REQUESTS_PER_MINUTE: 200,  // Increase for high traffic sites
  AGGRESSIVE_BLOCK_THRESHOLD: 500,  // Lower for stricter protection
  TRACKING_WINDOW: 60000,  // 60 seconds tracking window
  BLOCK_DURATION: 1800000,  // 30 minutes in milliseconds
  SUSPICIOUS_THRESHOLD: 10,  // Warnings before temp block
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024,  // 10MB max
}
```

### Custom Ban Durations

Modify `app/api/admin/security/ban/route.ts`:

```typescript
const durationMap = {
  "30min": 30 * 60 * 1000,
  "24hr": 24 * 60 * 60 * 1000,
  "1week": 7 * 24 * 60 * 60 * 1000,  // Add new duration
  permanent: undefined,
}
```

### Adding More Security Headers

Edit `lib/middleware/security-headers.ts`:

```typescript
response.headers.set(
  "Content-Security-Policy",
  "your-custom-csp-policy"
)
```

---

## Best Practices for Admins

### Daily Operations
1. Check security dashboard first thing each day
2. Review overnight threat logs
3. Investigate any high suspicious activity scores
4. Unblock any obvious false positives
5. Keep auto-refresh enabled during work hours

### When to Use Each Ban Duration

**30 Minutes:**
- Testing suspicious patterns
- First-time offenders with minor violations
- Automated scrapers (non-malicious)
- Rate limit violations
- Unusual but not dangerous behavior

**24 Hours:**
- Repeated violations after warnings
- Confirmed bot activity
- Brute force login attempts
- Multiple suspicious patterns
- Known vulnerability scanners

**Permanent:**
- Active DDoS attacks
- Confirmed malicious hackers
- SQL injection attempts
- XSS attack attempts
- Persistent abusers despite multiple bans
- Blacklisted IPs from threat intelligence

### Whitelisting Best Practices
- Always whitelist your own IPs first
- Document why each IP is whitelisted
- Regularly audit whitelist for old/unused entries
- Whitelist by specific IP, not ranges (more secure)
- Remove whitelist entries when no longer needed

### Monitoring Tips
- Watch for patterns in Active IPs (same subnet, similar timing)
- High request counts aren't always bad (CDNs, proxies)
- Suspicious activity score > 5 needs investigation
- Multiple IPs with same behavior = coordinated attack
- Sudden spikes in total requests = possible DDoS

---

## Troubleshooting

### Problem: Admin can't access security dashboard
**Solution:** Make sure you're logged in with admin role. Check `/admin/layout.tsx` for auth requirements.

### Problem: Banned IPs still accessing site
**Solution:** Check whitelist - whitelisted IPs bypass all bans. Remove from whitelist if needed.

### Problem: Too many false positives
**Solution:** Increase rate limit thresholds in DDOS_CONFIG or whitelist legitimate high-traffic sources.

### Problem: Not blocking obvious attacks
**Solution:** Verify MONITORING_ONLY is set to `false` in ddos-protection.ts configuration.

### Problem: Dashboard not updating
**Solution:** Enable auto-refresh toggle, or manually click refresh button. Check network tab for API errors.

### Problem: Can't unblock an IP
**Solution:** Check if IP is both banned AND whitelisted. Remove from whitelist first, then try unblocking.

### Problem: Blocked page not showing
**Solution:** Verify proxy.ts is properly checking for blocked IPs and redirecting to /blocked route.

---

## Security Metrics to Monitor

### Key Performance Indicators
- **Blocked IPs Growth Rate** - Steady or increasing = working well
- **Active Threats Count** - Should be low (<5) during normal operation
- **Requests Per Day** - Establish baseline, watch for anomalies
- **Average Suspicious Score** - Most IPs should have score of 0-2

### Red Flags
- Sudden spike in blocked IPs (coordinated attack)
- Many IPs with same suspicious activity score (botnet)
- High request count from single IP (scraper or DDoS)
- Repeated blocks from same IP range (persistent attacker)
- Many permanent bans in short time (active threat period)

---

## Support & Maintenance

### Regular Maintenance Tasks
- **Weekly:** Review and clean up old bans (if needed)
- **Monthly:** Audit whitelist for outdated entries
- **Quarterly:** Review rate limit thresholds and adjust

### Need Help?
- Check server logs for detailed security events
- Review threat logs in admin dashboard
- Test in incognito mode to verify blocking behavior
- Check browser console for client-side errors

### Future Enhancements
Consider implementing:
- IP range banning (CIDR notation)
- Country-based blocking (GeoIP)
- Custom security rules engine
- Email alerts for critical threats
- Integration with external threat intelligence
- Rate limit per endpoint (not just per IP)
- Captcha challenges for suspicious IPs

---

## Summary

Your security system provides:
- **Automatic Protection** - DDoS, XSS, SQL injection detection with active blocking
- **Manual Control** - Flexible IP banning with multiple duration options  
- **Real-Time Monitoring** - Beautiful dashboard with live statistics
- **Smart Detection** - Tracks patterns and blocks aggressive attackers
- **User Experience** - Professional blocked page for banned users
- **Admin Power** - Whitelist, quick-ban, search, and detailed logs

All protection layers work together to keep your site secure while giving you complete control over who can access it.
