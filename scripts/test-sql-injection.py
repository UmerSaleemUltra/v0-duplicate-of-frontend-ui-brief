"""
SQL Injection Test Script
Tests SQL injection protection and input validation
"""

import requests
from datetime import datetime

# Configuration
BASE_URL = "https://v0-frontend-ui-brief.vercel.app"  # UPDATE THIS
TEST_ENDPOINTS = [
    "/api/auth/login",
    "/api/contact",
]

SQL_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' OR 1=1--",
    "admin'--",
    "' UNION SELECT * FROM users--",
    "1' AND '1'='1",
    "' OR 'x'='x",
    "1; DROP TABLE users",
    "' OR ''='",
    "1' ORDER BY 1--",
]

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test_sql_payload(endpoint, payload):
    try:
        response = requests.post(
            f"{BASE_URL}{endpoint}",
            json={"email": payload, "password": "test"},
            timeout=5
        )
        return {
            'status': response.status_code,
            'blocked': response.status_code == 403,
            'error_handled': response.status_code in [400, 401]
        }
    except requests.exceptions.RequestException as e:
        return {
            'status': 'ERROR',
            'blocked': False,
            'error_handled': False,
            'error': str(e)
        }

def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print("SQL INJECTION TEST")
    print(f"{'='*60}{Colors.END}\n")
    print(f"Target: {BASE_URL}")
    print(f"Payloads: {len(SQL_PAYLOADS)}")
    print(f"Endpoints: {len(TEST_ENDPOINTS)}")
    print(f"\nStarting test at {datetime.now().strftime('%H:%M:%S')}\n")
    
    results = {
        'blocked': 0,
        'error_handled': 0,
        'vulnerable': 0,
        'errors': 0
    }
    
    for endpoint in TEST_ENDPOINTS:
        print(f"\nTesting endpoint: {endpoint}")
        print("-" * 60)
        
        for i, payload in enumerate(SQL_PAYLOADS, 1):
            print(f"[{i}/{len(SQL_PAYLOADS)}] Testing: {payload[:40]}...", end=" ")
            
            result = test_sql_payload(endpoint, payload)
            
            if result['blocked']:
                results['blocked'] += 1
                print(f"{Colors.GREEN}✓ BLOCKED{Colors.END}")
            elif result['error_handled']:
                results['error_handled'] += 1
                print(f"{Colors.YELLOW}⚠ ERROR HANDLED{Colors.END}")
            elif result['status'] == 'ERROR':
                results['errors'] += 1
                print(f"{Colors.RED}✗ ERROR{Colors.END}")
            else:
                results['vulnerable'] += 1
                print(f"{Colors.RED}✗ VULNERABLE{Colors.END}")
    
    total_tests = len(SQL_PAYLOADS) * len(TEST_ENDPOINTS)
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print("RESULTS")
    print(f"{'='*60}{Colors.END}")
    print(f"\nTotal Tests: {total_tests}")
    print(f"{Colors.GREEN}Blocked: {results['blocked']}{Colors.END}")
    print(f"{Colors.YELLOW}Error Handled: {results['error_handled']}{Colors.END}")
    print(f"{Colors.RED}Vulnerable: {results['vulnerable']}{Colors.END}")
    print(f"{Colors.RED}Errors: {results['errors']}{Colors.END}")
    
    if results['blocked'] > 0:
        print(f"\n{Colors.GREEN}✓ SQL Injection Protection ACTIVE{Colors.END}")
    elif results['vulnerable'] > 0:
        print(f"\n{Colors.RED}⚠️ VULNERABILITIES FOUND{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}⚠ Inputs validated but not explicitly blocked{Colors.END}")

if __name__ == "__main__":
    main()
