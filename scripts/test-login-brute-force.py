"""
Login Brute Force Test Script
Tests login rate limiting and automatic IP blocking for failed login attempts
"""

import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "https://buzzfiling.com"  # Production domain
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TEST_EMAIL = "us800750@gmail.com"
FAILED_ATTEMPTS = 15

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def attempt_login(attempt_num, email, password):
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json={"email": email, "password": password},
            timeout=5
        )
        return {
            'attempt': attempt_num,
            'status': response.status_code,
            'success': response.status_code == 200
        }
    except requests.exceptions.RequestException as e:
        return {
            'attempt': attempt_num,
            'status': 'ERROR',
            'success': False,
            'error': str(e)
        }

def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print("LOGIN BRUTE FORCE TEST")
    print(f"{'='*60}{Colors.END}\n")
    print(f"Target: {LOGIN_ENDPOINT}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Failed Attempts: {FAILED_ATTEMPTS}")
    print(f"\nStarting test at {datetime.now().strftime('%H:%M:%S')}\n")
    
    results = {
        'failed_login': 0,
        'blocked': 0,
        'rate_limited': 0,
        'errors': 0
    }
    
    for i in range(1, FAILED_ATTEMPTS + 1):
        print(f"Attempt {i}/{FAILED_ATTEMPTS}...", end=" ")
        
        result = attempt_login(i, TEST_EMAIL, f"wrong_password_{i}")
        
        if result['status'] == 401:
            results['failed_login'] += 1
            print(f"{Colors.YELLOW}✗ Failed Login (401){Colors.END}")
        elif result['status'] == 403:
            results['blocked'] += 1
            print(f"{Colors.RED}✗ BLOCKED (403){Colors.END}")
        elif result['status'] == 429:
            results['rate_limited'] += 1
            print(f"{Colors.YELLOW}⚠ RATE LIMITED (429){Colors.END}")
        elif result['status'] == 'ERROR':
            results['errors'] += 1
            print(f"{Colors.RED}✗ ERROR ({result.get('error', 'Unknown')}){Colors.END}")
        else:
            print(f"{Colors.BLUE}Status: {result['status']}{Colors.END}")
        
        time.sleep(0.5)  # Small delay between attempts
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print("RESULTS")
    print(f"{'='*60}{Colors.END}")
    print(f"\nTotal Attempts: {FAILED_ATTEMPTS}")
    print(f"{Colors.YELLOW}Failed Logins: {results['failed_login']}{Colors.END}")
    print(f"{Colors.YELLOW}Rate Limited: {results['rate_limited']}{Colors.END}")
    print(f"{Colors.RED}Blocked: {results['blocked']}{Colors.END}")
    print(f"{Colors.RED}Errors: {results['errors']}{Colors.END}")
    
    if results['blocked'] > 0:
        print(f"\n{Colors.RED}🚨 Login Protection ACTIVE - IP was blocked after {results['failed_login']} attempts{Colors.END}")
    elif results['rate_limited'] > 0:
        print(f"\n{Colors.YELLOW}⚠️ Rate Limiting ACTIVE{Colors.END}")
    else:
        print(f"\n{Colors.GREEN}✓ No blocking detected - Security may need adjustment{Colors.END}")

if __name__ == "__main__":
    main()
