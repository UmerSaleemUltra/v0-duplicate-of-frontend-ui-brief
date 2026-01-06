"""
DDoS Attack Test Script
Tests rate limiting and automatic IP blocking for high-volume requests
"""

import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Configuration
BASE_URL = "https://buzzfiling.com"  # Production domain
TOTAL_REQUESTS = 1000
CONCURRENT_THREADS = 50

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def make_request(req_num):
    try:
        start_time = time.time()
        response = requests.get(BASE_URL, timeout=5)
        duration = time.time() - start_time
        
        return {
            'num': req_num,
            'status': response.status_code,
            'duration': duration,
            'success': response.status_code == 200
        }
    except requests.exceptions.RequestException as e:
        return {
            'num': req_num,
            'status': 'ERROR',
            'duration': 0,
            'success': False,
            'error': str(e)
        }

def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print("DDoS ATTACK TEST")
    print(f"{'='*60}{Colors.END}\n")
    print(f"Target: {BASE_URL}")
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Concurrent Threads: {CONCURRENT_THREADS}")
    print(f"\nStarting attack at {datetime.now().strftime('%H:%M:%S')}\n")
    
    results = {
        'success': 0,
        'blocked': 0,
        'rate_limited': 0,
        'errors': 0
    }
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=CONCURRENT_THREADS) as executor:
        futures = [executor.submit(make_request, i) for i in range(1, TOTAL_REQUESTS + 1)]
        
        for future in as_completed(futures):
            result = future.result()
            
            if result['status'] == 200:
                results['success'] += 1
                print(f"{Colors.GREEN}[{result['num']}] ✓ OK (200){Colors.END}")
            elif result['status'] == 403:
                results['blocked'] += 1
                print(f"{Colors.RED}[{result['num']}] ✗ BLOCKED (403){Colors.END}")
            elif result['status'] == 429:
                results['rate_limited'] += 1
                print(f"{Colors.YELLOW}[{result['num']}] ⚠ RATE LIMITED (429){Colors.END}")
            else:
                results['errors'] += 1
                error_msg = result.get('error', f"Status {result['status']}")
                print(f"{Colors.RED}[{result['num']}] ✗ ERROR ({error_msg}){Colors.END}")
    
    duration = time.time() - start_time
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print("RESULTS")
    print(f"{'='*60}{Colors.END}")
    print(f"\nTotal Requests: {TOTAL_REQUESTS}")
    print(f"{Colors.GREEN}Success: {results['success']}{Colors.END}")
    print(f"{Colors.YELLOW}Rate Limited: {results['rate_limited']}{Colors.END}")
    print(f"{Colors.RED}Blocked: {results['blocked']}{Colors.END}")
    print(f"{Colors.RED}Errors: {results['errors']}{Colors.END}")
    print(f"\nDuration: {duration:.2f} seconds")
    print(f"Requests/second: {TOTAL_REQUESTS/duration:.2f}")
    
    if results['blocked'] > 0:
        print(f"\n{Colors.RED}🚨 DDoS Protection ACTIVE - IP was blocked{Colors.END}")
    elif results['rate_limited'] > 0:
        print(f"\n{Colors.YELLOW}⚠️ Rate Limiting ACTIVE{Colors.END}")
    else:
        print(f"\n{Colors.GREEN}✓ All requests succeeded - Security may be disabled{Colors.END}")

if __name__ == "__main__":
    main()
