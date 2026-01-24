# Security Testing Guide

## Overview
This directory contains comprehensive security test scripts to validate your website's protection against various attack vectors.

## Prerequisites

\`\`\`bash
pip install requests
\`\`\`

## Configuration

**IMPORTANT:** Update the `BASE_URL` in each script before running:

\`\`\`python
BASE_URL = "https://www.buzzfiling.com"  # UPDATE THIS
\`\`\`

## Test Scripts

### 1. DDoS Attack Test (`test-ddos.py`)
Tests rate limiting and automatic IP blocking for high-volume requests.

**What it tests:**
- Rate limiting (20 req/sec, 200 req/min)
- Automatic IP blocking after threshold
- Concurrent request handling

**Run:**
\`\`\`bash
python scripts/test-ddos.py
\`\`\`

**Expected Results:**
- First 20-50 requests: Success (200)
- Next requests: Rate Limited (429)
- After 200-500 requests: Blocked (403)

---

### 2. Login Brute Force Test (`test-login-brute-force.py`)
Tests login rate limiting and account protection.

**What it tests:**
- Failed login attempt tracking
- IP-based blocking (10 attempts)
- Account-based blocking (5 attempts per email)

**Run:**
\`\`\`bash
python scripts/test-login-brute-force.py
\`\`\`

**Expected Results:**
- First 5 attempts: Failed Login (401)
- After 10 attempts: Blocked (403)

---

### 3. XSS Injection Test (`test-xss-injection.py`)
Tests XSS protection and input sanitization.

**What it tests:**
- Script tag injection
- Event handler injection
- JavaScript protocol injection
- Input sanitization

**Run:**
\`\`\`bash
python scripts/test-xss-injection.py
\`\`\`

**Expected Results:**
- Dangerous inputs: Blocked (403) or Sanitized
- Security guard detecting XSS patterns

---

### 4. SQL Injection Test (`test-sql-injection.py`)
Tests SQL injection protection.

**What it tests:**
- SQL command injection
- Union-based injection
- Comment-based injection
- Input validation

**Run:**
\`\`\`bash
python scripts/test-sql-injection.py
\`\`\`

**Expected Results:**
- SQL patterns: Blocked (403) or Error Handled (400/401)

---

### 5. Run All Tests (`test-all-attacks.py`)
Runs all security tests in sequence.

**Run:**
\`\`\`bash
python scripts/test-all-attacks.py
\`\`\`

This will execute all tests with 5-second delays between them and provide a final summary.

---

## Safety Guidelines

### Before Testing

1. **Whitelist Your IP:**
   - Go to `/admin/security`
   - Add your IP to the whitelist
   - This prevents you from being locked out

2. **Test Environment:**
   - Use a staging/preview deployment first
   - Avoid testing on production during peak hours

3. **Admin Access:**
   - Keep admin dashboard open in another browser
   - Be ready to unblock your IP if needed

### During Testing

- Monitor server logs in real-time
- Watch the admin security dashboard
- Check for ASCII art security alerts in terminal

### After Testing

1. Unblock your test IP from `/admin/security`
2. Review threat logs in MongoDB
3. Check that legitimate traffic still works
4. Document any issues found

---

## Interpreting Results

### Success Indicators
✓ Initial requests succeed (200)
✓ Rate limiting activates (429)
✓ IP gets blocked after threshold (403)
✓ Console shows ASCII security alerts
✓ Admin dashboard updates with blocks
✓ Browser redirects to `/blocked` page

### Failure Indicators
✗ All requests succeed even after 1000+ requests
✗ No console alerts appear
✗ Admin dashboard doesn't show blocks
✗ No redirects to blocked page

---

## Troubleshooting

### Test IP Gets Blocked Immediately
- Your IP was already in the blacklist
- Unblock from `/admin/security` first

### No Blocking Occurs
- Security may be in monitoring mode
- Check `MONITORING_ONLY` setting in ddos-protection.ts
- Verify thresholds are set correctly

### Connection Errors
- Check if BASE_URL is correct
- Ensure website is accessible
- Verify network connectivity

---

## Advanced Testing

### Custom Payloads
Edit the payload arrays in each script to add custom test cases:

\`\`\`python
XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "your-custom-payload-here",
]
\`\`\`

### Adjust Thresholds
Modify request counts to test specific thresholds:

\`\`\`python
TOTAL_REQUESTS = 500  # Test at different levels
FAILED_ATTEMPTS = 12  # Test specific blocking point
\`\`\`

### Monitor Database
Check MongoDB for threat logs:
- Collection: `security_threats`
- Collection: `blocked_ips`

---

## Support

If tests reveal vulnerabilities:
1. Check SECURITY_DOCUMENTATION.md for configuration
2. Review admin security dashboard for patterns
3. Adjust thresholds in ddos-protection.ts if needed
4. Contact support if issues persist
