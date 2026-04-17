# AI Triage Migration Guide

## Overview
This script applies Gemini AI triage retroactively to all existing issues in the database.

## What It Does
- Scans for all issues without AI triage data
- Calls Gemini API for category, priority, and department suggestion
- Updates database with AI results and confidence scores
- Marks issues as approved if they were submitted to a specific department

## Before Running

1. **Stop the backend server** (if running)
   ```powershell
   # Press Ctrl+C in the backend terminal to stop Uvicorn
   ```

2. **Verify .env configuration**
   ```
   GEMINI_ENABLED=true
   GEMINI_API_KEY=AIzaSyAtnOTjMOs8-u5SQjbCc-6XQanEq6KdTUk
   ```

3. **Activate virtual environment** (if not already active)
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

## Run Migration

Navigate to backend directory and run:

```powershell
cd C:\Users\Arav Chopra\Desktop\SmartVellore\backend
python migrate_ai_triage.py
```

Then type `yes` when prompted.

## Expected Output

```
============================================================
SmartVellore AI Triage Migration
============================================================

Found 8 issues needing AI triage

[1/8] Processing: Broken Electric Pole (ID: 1)
  ✓ Category: electrical_infrastructure
  ✓ Priority: CRITICAL
  ✓ Department: Electricity Department
  ✓ Confidence: 95%

[2/8] Processing: Road Pothole (ID: 2)
  ✓ Category: infrastructure_damage
  ...

============================================================
✓ Migration complete! Processed 8 issues
============================================================
```

## After Migration

1. **Restart the backend**
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Verify in Admin Dashboard**
   - Login to admin panel
   - All issues should now show AI analysis
   - Issues submitted under "Others" will need approval

## Notes

- Small delay (0.5s) between issues to avoid Gemini API rate limiting
- Failed issues will show error message but migration continues
- Safe to re-run: only processes issues without existing AI data
- All issue data is preserved; only AI fields are added
