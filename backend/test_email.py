#!/usr/bin/env python
"""
Quick test script to verify email configuration and send a test email
Run from backend directory: python test_email.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Load .env FIRST
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

print(f"Loading .env from: {Path(__file__).parent / '.env'}")
print(f"SMTP_USERNAME from env: {os.getenv('SMTP_USERNAME')}")
print(f"SMTP_PASSWORD from env: {os.getenv('SMTP_PASSWORD')}")

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import email service
from app.services.email_service import email_service

def test_email_config():
    """Test if email service is properly configured"""
    print("=" * 60)
    print("SmartVellore Email Configuration Test")
    print("=" * 60)
    
    print(f"\n📧 Email Service Status: {'✅ ENABLED' if email_service.enabled else '❌ DISABLED'}")
    print(f"   SMTP Server: {email_service.smtp_server}")
    print(f"   SMTP Port: {email_service.smtp_port}")
    print(f"   Username: {email_service.smtp_username}")
    print(f"   Sender Email: {email_service.sender_email}")
    
    if not email_service.enabled:
        print("\n⚠️  Email service is NOT configured!")
        print("   Please set SMTP_USERNAME and SMTP_PASSWORD in .env file")
        return False
    
    print("\n✅ Email Configuration looks good!")
    return True

def send_test_email():
    """Send a test confirmation email"""
    print("\n" + "=" * 60)
    print("Sending Test Confirmation Email...")
    print("=" * 60)
    
    test_email = "smartvellore.helpdesk@gmail.com"
    report_id = "VLR-TEST-001"
    
    success = email_service.send_issue_confirmation(
        citizen_email=test_email,
        issue_id=999,
        report_id=report_id,
        title="Test Issue - Email Configuration Verification",
        department="Test Department",
        status="OPEN",
        created_at=datetime.utcnow()
    )
    
    if success:
        print(f"\n✅ Test email sent successfully to {test_email}")
        print(f"   Report ID: {report_id}")
        return True
    else:
        print(f"\n❌ Failed to send test email")
        return False

def send_test_status_update():
    """Send a test status update email"""
    print("\n" + "=" * 60)
    print("Sending Test Status Update Email...")
    print("=" * 60)
    
    test_email = "smartvellore.helpdesk@gmail.com"
    report_id = "VLR-TEST-001"
    
    success = email_service.send_status_update(
        citizen_email=test_email,
        report_id=report_id,
        title="Test Issue - Email Configuration Verification",
        old_status="OPEN",
        new_status="IN_PROGRESS",
        updated_at=datetime.utcnow(),
        update_notes="This is a test status update email"
    )
    
    if success:
        print(f"\n✅ Status update email sent successfully to {test_email}")
        print(f"   Status: OPEN → IN_PROGRESS")
        return True
    else:
        print(f"\n❌ Failed to send status update email")
        return False

if __name__ == "__main__":
    print("\n🚀 Starting SmartVellore Email Test Suite...\n")
    
    # Test 1: Check configuration
    config_ok = test_email_config()
    
    if not config_ok:
        print("\n❌ Email service not properly configured. Exiting.")
        sys.exit(1)
    
    # Test 2: Send test confirmation email
    confirmation_ok = send_test_email()
    
    # Test 3: Send test status update email
    status_update_ok = send_test_status_update()
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Configuration: {'✅ PASS' if config_ok else '❌ FAIL'}")
    print(f"Confirmation Email: {'✅ PASS' if confirmation_ok else '❌ FAIL'}")
    print(f"Status Update Email: {'✅ PASS' if status_update_ok else '❌ FAIL'}")
    
    if all([config_ok, confirmation_ok, status_update_ok]):
        print("\n🎉 All tests passed! Email service is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        sys.exit(1)
