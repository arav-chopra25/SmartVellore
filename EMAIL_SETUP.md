# Email Setup Guide for SmartVellore

## Overview
SmartVellore automatically sends:
1. **Confirmation Email** - When a citizen submits a new issue
2. **Status Update Email** - When issue status changes (OPEN → IN_PROGRESS → RESOLVED)

## Configuration

### For Gmail (Recommended for Testing)

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the 16-character app password

3. **Update .env file**
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   SENDER_EMAIL=your-email@gmail.com
   ```

### For Outlook/Office 365

```
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
SENDER_EMAIL=your-email@outlook.com
```

### For SendGrid

1. Create account at https://sendgrid.com
2. Get API key from Settings
3. Configure:
   ```
   SMTP_SERVER=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USERNAME=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxx
   SENDER_EMAIL=your-sendgrid-verified-sender@example.com
   ```

### For Amazon SES

```
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-username
SMTP_PASSWORD=your-ses-password
SENDER_EMAIL=verified-email@yourdomain.com
```

## Testing Email Configuration

1. **Check if email service is enabled**
   ```bash
   python -c "from app.services.email_service import email_service; print('Enabled:', email_service.enabled)"
   ```

2. **Test by submitting an issue** in the citizen portal and check if email is received

3. **Monitor logs** for email sending status

## Logging

When sending emails, you'll see logs like:
- ✅ `✅ Confirmation email sent to user@example.com for issue VLR-00000001`
- ❌ `❌ Failed to send email to user@example.com: [error details]`
- ⚠️ `⚠️ Email service not configured. Skipping email notification.`

## Troubleshooting

### "Email service not configured"
- Make sure SMTP_USERNAME and SMTP_PASSWORD are set in .env
- Restart the backend server after changing .env

### "Authentication failed"
- For Gmail: Make sure you're using App Password, not regular password
- For others: Verify username and password are correct
- Check firewall/network restrictions on port 587

### "Connection refused"
- Verify SMTP_SERVER and SMTP_PORT are correct
- Check internet connection
- Some networks block port 587 - try port 465 or 2525

### Email received in spam folder
- Add sender email to contacts
- Verify SENDER_EMAIL matches configured account
- For custom domains: Set up SPF, DKIM records

## Disabling Email

If you want to disable email notifications temporarily:
- Leave SMTP_USERNAME and SMTP_PASSWORD empty in .env
- System will skip email sending without errors

## Advanced Configuration

### Custom Email Templates
Edit the email templates in `backend/app/services/email_service.py`:
- `_create_confirmation_email_html()` - Confirmation email template
- `_create_status_update_email_html()` - Status update email template

### Adding More Email Events
To add new email events (e.g., issue resolution photos, escalation alerts):
1. Add method in `EmailService` class
2. Call from appropriate endpoint
3. Wrap in try-except to prevent failures

## Security Notes

⚠️ **Never commit .env file to version control**
- Use .env.example as template
- Each environment (dev, staging, production) has its own .env
- Rotate credentials periodically

---

For more help, check the SmartVellore documentation or GitHub issues.
