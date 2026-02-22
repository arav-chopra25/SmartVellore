# SmartVellore Backend

## Email Confirmation Feature

The backend now sends automatic confirmation emails to citizens when they submit new issues.

### Setup (Optional)

Email notifications are **optional**. The system works fine without them - emails will just be skipped gracefully.

#### For Gmail:

1. Create a `.env` file in the `backend/` directory (copy from `.env.example`)
2. Enable 2-Factor Authentication on your Gmail account
3. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other" device
   - Copy the 16-character password
4. Add to `.env`:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SENDER_EMAIL=noreply@smartvellore.com
```

#### For Render Deployment:

Add environment variables in Render dashboard:
- `SMTP_SERVER` = smtp.gmail.com
- `SMTP_PORT` = 587
- `SMTP_USERNAME` = your-email@gmail.com
- `SMTP_PASSWORD` = your-app-password
- `SENDER_EMAIL` = noreply@smartvellore.com

### Email Content

Citizens receive an HTML email with:
- Report ID (VLR-XXXXXXXX format)
- Issue title and description
- Department assigned
- Current status
- Submission timestamp
- Next steps information

### Error Handling

- Email failures do NOT interrupt issue creation
- System logs email errors but continues normally
- If SMTP credentials are missing, emails are gracefully skipped
