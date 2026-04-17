"""
Migration script to retroactively apply AI triage to existing issues.
Run this once to populate all existing issues with Gemini AI analysis.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Issue
from app.services.ai_service import triage_issue
from app.config import settings
import time


def migrate_existing_issues():
    """Apply AI triage to all issues that don't have it yet."""
    
    if not settings.GEMINI_ENABLED:
        print("ERROR: Gemini is not enabled. Set GEMINI_ENABLED=true in .env")
        return
    
    if not settings.GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY is not set in .env")
        return
    
    session = SessionLocal()
    
    try:
        # Find all issues without AI triage
        issues_needing_triage = session.query(Issue).filter(
            (Issue.ai_category.is_(None)) | (Issue.ai_category == '')
        ).all()
        
        total = len(issues_needing_triage)
        print(f"\nFound {total} issues needing AI triage")
        
        if total == 0:
            print("All issues already have AI triage!")
            session.close()
            return
        
        # Process each issue
        for idx, issue in enumerate(issues_needing_triage, 1):
            try:
                print(f"\n[{idx}/{total}] Processing: {issue.title} (ID: {issue.id})")
                
                # Call Gemini triage
                ai_result = triage_issue(
                    title=issue.title,
                    description=issue.description,
                    citizen_department=issue.department
                )
                
                # Update issue with AI results
                issue.ai_category = ai_result.get("category")
                issue.ai_priority = ai_result.get("priority")
                issue.ai_department_suggestion = ai_result.get("department_suggestion")
                issue.ai_confidence = ai_result.get("confidence")
                issue.ai_summary = ai_result.get("summary")
                issue.ai_phase = ai_result.get("phase")
                
                # Mark as approved if department is set (not "Others")
                if issue.department and issue.department != "Others":
                    issue.ai_department_approved = True
                
                session.commit()
                
                print(f"  ✓ Category: {ai_result.get('category')}")
                print(f"  ✓ Priority: {ai_result.get('priority')}")
                print(f"  ✓ Department: {ai_result.get('department_suggestion')}")
                print(f"  ✓ Confidence: {(ai_result.get('confidence', 0) * 100):.0f}%")
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)[:100]}")
                session.rollback()
                continue
        
        print(f"\n{'='*60}")
        print(f"✓ Migration complete! Processed {total} issues")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        session.rollback()
    
    finally:
        session.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("SmartVellore AI Triage Migration")
    print("="*60)
    print("\nThis will apply Gemini AI triage to all existing issues.")
    print("Make sure:")
    print("  - Backend is NOT running")
    print("  - GEMINI_ENABLED=true in .env")
    print("  - GEMINI_API_KEY is set in .env")
    
    response = input("\nContinue? (yes/no): ").strip().lower()
    
    if response == "yes":
        migrate_existing_issues()
    else:
        print("Migration cancelled.")
