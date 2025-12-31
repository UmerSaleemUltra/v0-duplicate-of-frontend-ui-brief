"""
Comprehensive Security Test Suite
Runs all attack tests in sequence
"""

import subprocess
import sys
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

TEST_SCRIPTS = [
    ("DDoS Attack", "scripts/test-ddos.py"),
    ("Login Brute Force", "scripts/test-login-brute-force.py"),
    ("XSS Injection", "scripts/test-xss-injection.py"),
    ("SQL Injection", "scripts/test-sql-injection.py"),
]

def run_test(name, script_path):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print(f"RUNNING: {name}")
    print(f"{'='*70}{Colors.END}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except Exception as e:
        print(f"{Colors.RED}Error running test: {e}{Colors.END}")
        return False

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print("COMPREHENSIVE SECURITY TEST SUITE")
    print(f"{'='*70}{Colors.END}")
    print(f"\nStarting tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total Tests: {len(TEST_SCRIPTS)}\n")
    
    results = []
    
    for name, script in TEST_SCRIPTS:
        success = run_test(name, script)
        results.append((name, success))
        
        if len(results) < len(TEST_SCRIPTS):
            print(f"\n{Colors.YELLOW}Waiting 5 seconds before next test...{Colors.END}")
            import time
            time.sleep(5)
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print("FINAL SUMMARY")
    print(f"{'='*70}{Colors.END}\n")
    
    for name, success in results:
        status = f"{Colors.GREEN}✓ COMPLETED{Colors.END}" if success else f"{Colors.RED}✗ FAILED{Colors.END}"
        print(f"{name}: {status}")
    
    completed = sum(1 for _, success in results if success)
    print(f"\n{Colors.BOLD}Tests Completed: {completed}/{len(TEST_SCRIPTS)}{Colors.END}")
    print(f"Finished at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

if __name__ == "__main__":
    main()
