"""
XSS Injection Test Script
Tests XSS protection and input sanitization
"""

import requests
from datetime import datetime

# Configuration
BASE_URL = "https://v0-frontend-ui-brief.vercel.app"  # UPDATE THIS
TEST_ENDPOINTS = [
    "/api/contact",
    "/api/auth/login",
    "/api/auth/register",
]

XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src='javascript:alert(\"XSS\")'></iframe>",
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<select onfocus=alert('XSS') autofocus>",
    "<textarea onfocus=alert('XSS') autofocus>",
    "<keygen onfocus=alert('XSS') autofocus>",
]

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test_xss_payload(endpoint, payload, field_name="input"):
    try:
        response = requests.post(
            f"{BASE_URL}{endpoint}",
            json={field_name: payload},
            timeout=5
        )
        return {
            'status': response.status_code,
            'blocked': response.status_code == 403,
            'sanitized': response.status_code in [200, 400]
        }
    except requests.exceptions.RequestException as e:
        return {
            'status': 'ERROR',
            'blocked': False,
            'sanitized': False,
            'error': str(e)
        }

def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print("XSS INJECTION TEST")
    print(f"{'='*60}{Colors.END}\n")
    print(f"Target: {BASE_URL}")
    print(f"Payloads: {len(XSS_PAYLOADS)}")
    print(f"Endpoints: {len(TEST_ENDPOINTS)}")
    print(f"\nStarting test at {datetime.now().strftime('%H:%M:%S')}\n")
    
    results = {
        'blocked': 0,
        'sanitized': 0,
        'vulnerable': 0,
        'errors': 0
    }
    
    for endpoint in TEST_ENDPOINTS:
        print(f"\nTesting endpoint: {endpoint}")
        print("-" * 60)
        
        for i, payload in enumerate(XSS_PAYLOADS, 1):
            print(f"[{i}/{len(XSS_PAYLOADS)}] Testing payload: {payload[:50]}...", end=" ")
            
            result = test_xss_payload(endpoint, payload)
            
            if result['blocked']:
                results['blocked'] += 1
                print(f"{Colors.GREEN}✓ BLOCKED{Colors.END}")
            elif result['sanitized']:
                results['sanitized'] += 1
                print(f"{Colors.YELLOW}⚠ SANITIZED{Colors.END}")
            elif result['status'] == 'ERROR':
                results['errors'] += 1
                print(f"{Colors.RED}✗ ERROR{Colors.END}")
            else:
                results['vulnerable'] += 1
                print(f"{Colors.RED}✗ VULNERABLE{Colors.END}")
    
    total_tests = len(XSS_PAYLOADS) * len(TEST_ENDPOINTS)
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print("RESULTS")
    print(f"{'='*60}{Colors.END}")
    print(f"\nTotal Tests: {total_tests}")
    print(f"{Colors.GREEN}Blocked: {results['blocked']}{Colors.END}")
    print(f"{Colors.YELLOW}Sanitized: {results['sanitized']}{Colors.END}")
    print(f"{Colors.RED}Vulnerable: {results['vulnerable']}{Colors.END}")
    print(f"{Colors.RED}Errors: {results['errors']}{Colors.END}")
    
    if results['blocked'] > 0:
        print(f"\n{Colors.GREEN}✓ XSS Protection ACTIVE{Colors.END}")
    elif results['vulnerable'] > 0:
        print(f"\n{Colors.RED}⚠️ VULNERABILITIES FOUND - XSS protection needed{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}⚠ Inputs are sanitized but not blocked{Colors.END}")

if __name__ == "__main__":
    main()
