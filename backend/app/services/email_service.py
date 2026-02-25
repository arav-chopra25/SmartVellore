import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from datetime import datetime


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", self.smtp_username)
        self.enabled = bool(self.smtp_username and self.smtp_password)

    def send_issue_confirmation(
        self,
        citizen_email: str,
        issue_id: int,
        report_id: str,
        title: str,
        department: str,
        status: str,
        created_at: datetime
    ) -> bool:
        """
        Send confirmation email to citizen after issue submission.
        Returns True if successful, False otherwise.
        """
        if not self.enabled:
            print("⚠️ Email service not configured. Skipping email notification.")
            return False

        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"SmartVellore: Issue Registered - {report_id}"
            message["From"] = self.sender_email
            message["To"] = citizen_email

            # Create HTML email body
            html_body = self._create_confirmation_email_html(
                report_id, title, department, status, created_at
            )

            # Create plain text version as fallback
            text_body = self._create_confirmation_email_text(
                report_id, title, department, status, created_at
            )

            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            print(f"✅ Confirmation email sent to {citizen_email} for issue {report_id}")
            return True

        except Exception as e:
            print(f"❌ Failed to send email to {citizen_email}: {str(e)}")
            return False

    def send_status_update(
        self,
        citizen_email: str,
        report_id: str,
        title: str,
        old_status: str,
        new_status: str,
        updated_at: datetime,
        update_notes: Optional[str] = None
    ) -> bool:
        """
        Send status update email to citizen when issue status changes.
        Returns True if successful, False otherwise.
        """
        if not self.enabled:
            print("⚠️ Email service not configured. Skipping email notification.")
            return False

        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"SmartVellore: Status Update - {report_id}"
            message["From"] = self.sender_email
            message["To"] = citizen_email

            # Create HTML email body
            html_body = self._create_status_update_email_html(
                report_id, title, old_status, new_status, updated_at, update_notes
            )

            # Create plain text version as fallback
            text_body = self._create_status_update_email_text(
                report_id, title, old_status, new_status, updated_at, update_notes
            )

            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            print(f"✅ Status update email sent to {citizen_email} for issue {report_id}")
            return True

        except Exception as e:
            print(f"❌ Failed to send status update email to {citizen_email}: {str(e)}")
            return False

    def _create_confirmation_email_html(
        self, report_id: str, title: str, department: str, status: str, created_at: datetime
    ) -> str:
        """Create HTML email body"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .issue-box {{ background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
        .label {{ font-weight: bold; color: #64748b; }}
        .value {{ color: #1e293b; }}
        .status-badge {{ background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }}
        .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏙️ SmartVellore</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Issue Confirmation</p>
        </div>
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Thank you for reporting!</h2>
            <p>Your issue has been successfully registered in the SmartVellore system. Our team will review and address it promptly.</p>
            
            <div class="issue-box">
                <div class="detail-row">
                    <span class="label">Report ID:</span>
                    <span class="value" style="font-weight: bold; color: #3b82f6;">{report_id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Title:</span>
                    <span class="value">{title}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Department:</span>
                    <span class="value">{department}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value"><span class="status-badge">{status}</span></span>
                </div>
                <div class="detail-row" style="border-bottom: none;">
                    <span class="label">Submitted:</span>
                    <span class="value">{created_at.strftime("%B %d, %Y at %I:%M %p")}</span>
                </div>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
                <li>The relevant department will review your report</li>
                <li>You can track the status using your Report ID: <strong>{report_id}</strong></li>
                <li>Updates will be visible in the SmartVellore portal</li>
            </ul>

            <div class="footer">
                <p>This is an automated message from SmartVellore Citizen Reporting System.</p>
                <p style="font-size: 12px; color: #94a3b8;">Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    def _create_confirmation_email_text(
        self, report_id: str, title: str, department: str, status: str, created_at: datetime
    ) -> str:
        """Create plain text email body"""
        return f"""
SmartVellore - Issue Confirmation

Thank you for reporting!

Your issue has been successfully registered in the SmartVellore system.

ISSUE DETAILS:
--------------
Report ID: {report_id}
Title: {title}
Department: {department}
Status: {status}
Submitted: {created_at.strftime("%B %d, %Y at %I:%M %p")}

WHAT HAPPENS NEXT:
- The relevant department will review your report
- You can track the status using your Report ID: {report_id}
- Updates will be visible in the SmartVellore portal

---
This is an automated message from SmartVellore Citizen Reporting System.
Please do not reply to this email.
"""

    def _get_status_badge_color(self, status: str) -> str:
        """Get color code for status badge"""
        status_colors = {
            "OPEN": "#ef4444",
            "IN_PROGRESS": "#f59e0b",
            "RESOLVED": "#10b981"
        }
        return status_colors.get(status, "#6b7280")

    def _get_status_emoji(self, status: str) -> str:
        """Get emoji for status"""
        status_emojis = {
            "OPEN": "🔴",
            "IN_PROGRESS": "🟡",
            "RESOLVED": "✅"
        }
        return status_emojis.get(status, "📋")

    def _create_status_update_email_html(
        self, report_id: str, title: str, old_status: str, new_status: str, 
        updated_at: datetime, update_notes: Optional[str] = None
    ) -> str:
        """Create HTML email body for status update"""
        new_status_color = self._get_status_badge_color(new_status)
        old_status_color = self._get_status_badge_color(old_status)
        new_status_emoji = self._get_status_emoji(new_status)
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .header p {{ margin: 10px 0 0 0; opacity: 0.9; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-transition {{ background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }}
        .status-row {{ display: flex; align-items: center; justify-content: space-between; margin: 15px 0; }}
        .status-badge {{ padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; }}
        .arrow {{ color: #64748b; font-size: 20px; margin: 0 10px; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ font-weight: bold; color: #64748b; }}
        .value {{ color: #1e293b; }}
        .notes-box {{ background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .notes-box h3 {{ margin-top: 0; color: #1e293b; }}
        .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }}
        .emoji {{ font-size: 24px; margin-right: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{new_status_emoji} SmartVellore</h1>
            <p>Issue Status Update</p>
        </div>
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Your issue has been updated!</h2>
            
            <div class="status-transition">
                <h3 style="margin-top: 0; color: #1e293b;">Status Change:</h3>
                <div class="status-row">
                    <span class="status-badge" style="background-color: {old_status_color};">{old_status}</span>
                    <span class="arrow">→</span>
                    <span class="status-badge" style="background-color: {new_status_color};">{new_status}</span>
                </div>
            </div>

            <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <div class="detail-row">
                    <span class="label">Report ID:</span>
                    <span class="value" style="font-weight: bold; color: #3b82f6;">{report_id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Issue Title:</span>
                    <span class="value">{title}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Updated:</span>
                    <span class="value">{updated_at.strftime("%B %d, %Y at %I:%M %p")}</span>
                </div>
            </div>

            {f'<div class="notes-box"><h3>Update Notes:</h3><p>{update_notes}</p></div>' if update_notes else ''}

            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Check the SmartVellore portal for more details</li>
                <li>Use your Report ID to track further updates</li>
                <li>Contact the department if you have any questions</li>
            </ul>

            <div class="footer">
                <p>This is an automated message from SmartVellore Citizen Reporting System.</p>
                <p style="font-size: 12px; color: #94a3b8;">Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    def _create_status_update_email_text(
        self, report_id: str, title: str, old_status: str, new_status: str, 
        updated_at: datetime, update_notes: Optional[str] = None
    ) -> str:
        """Create plain text email body for status update"""
        return f"""
SmartVellore - Issue Status Update

Your issue has been updated!

STATUS CHANGE:
--------------
{old_status} → {new_status}

ISSUE DETAILS:
--------------
Report ID: {report_id}
Issue Title: {title}
Updated: {updated_at.strftime("%B %d, %Y at %I:%M %p")}

{f'UPDATE NOTES:{chr(10)}----- -----{chr(10)}{update_notes}{chr(10)}{chr(10)}' if update_notes else ''}

NEXT STEPS:
- Check the SmartVellore portal for more details
- Use your Report ID to track further updates
- Contact the department if you have any questions

---
This is an automated message from SmartVellore Citizen Reporting System.
Please do not reply to this email.
"""


