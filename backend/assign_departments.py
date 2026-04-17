"""
Migration script to assign AI-suggested departments to old issues.
Runs AI triage and updates department for issues that don't have proper department assignment.
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


def assign_departments_to_old_issues():
    """Assign AI-suggested departments to issues that are missing department assignment."""
    
    if not settings.GEMINI_ENABLED:
        print("WARNING: Gemini is not enabled. Will use keyword-based triage.")
    
    session = SessionLocal()
    
    try:
        # Find all issues without proper department or marked as "Others"
        issues_needing_dept = session.query(Issue).filter(
            (Issue.department.is_(None)) | 
            (Issue.department == '') |
            (Issue.department == 'Others')
        ).all()
        
        total = len(issues_needing_dept)
        print(f"\n{'='*70}")
        print(f"Found {total} issues needing department assignment")
        print(f"{'='*70}\n")
        
        if total == 0:
            print("All issues already have proper departments!")
            session.close()
            return
        
        # Process each issue
        updated_count = 0
        for idx, issue in enumerate(issues_needing_dept, 1):
            try:
                print(f"[{idx}/{total}] Processing: {issue.title} (ID: {issue.id})")
                
                # Call AI triage to get department suggestion
                ai_result = triage_issue(
                    title=issue.title,
                    description=issue.description,
                    citizen_department=issue.department
                )
                
                suggested_dept = ai_result.get("department_suggestion", "Others")
                
                # Update issue with AI-suggested department
                old_dept = issue.department or "UNASSIGNED"
                issue.department = suggested_dept
                
                # Update AI fields if not already set
                if not issue.ai_category:
                    issue.ai_category = ai_result.get("category")
                if not issue.ai_priority:
                    issue.ai_priority = ai_result.get("priority")
                if not issue.ai_department_suggestion:
                    issue.ai_department_suggestion = ai_result.get("department_suggestion")
                if not issue.ai_confidence:
                    issue.ai_confidence = ai_result.get("confidence")
                if not issue.ai_summary:
                    issue.ai_summary = ai_result.get("summary")
                if issue.ai_phase is None:
                    issue.ai_phase = ai_result.get("phase")
                
                session.commit()
                updated_count += 1
                
                print(f"  ✓ {old_dept} → {suggested_dept}")
                print(f"    Priority: {ai_result.get('priority')}")
                print(f"    Confidence: {(ai_result.get('confidence', 0) * 100):.0f}%")
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)[:100]}")
                session.rollback()
                continue
        
        print(f"\n{'='*70}")
        print(f"✓ Complete! Updated {updated_count}/{total} issues")
        print(f"{'='*70}\n")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        session.rollback()
    
    finally:
        session.close()


if __name__ == "__main__":
    print("\n" + "="*70)
    print("SmartVellore - Assign Departments to Old Issues")
    print("="*70)
    print("\nThis script will:")
    print("  1. Find all issues with missing or 'Others' department")
    print("  2. Run AI triage to suggest proper department")
    print("  3. Update issues with AI-suggested departments\n")
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response == 'yes':
        assign_departments_to_old_issues()
    else:
        print("Cancelled.")
