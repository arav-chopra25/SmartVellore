from app.database import SessionLocal
from app.models import Issue

session = SessionLocal()
issues = session.query(Issue).all()
print('All issues:')
for issue in issues:
    summary = issue.ai_summary[:60] if issue.ai_summary else "None"
    print(f'ID {issue.id}: {issue.title[:25]} | Conf: {issue.ai_confidence} | {summary}')
session.close()
