"""
Email utility for sending emails via Gmail SMTP or SendGrid
Tries Gmail first, falls back to SendGrid if Gmail fails
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)


def get_email_html_template(otp_code):
    """
    Returns the HTML template for OTP email
    
    Args:
        otp_code (str): 6-digit OTP code
    
    Returns:
        str: HTML email content
    """
    return f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">VocabMaster</h1>
        </div>
        <div style="background: #f7f7f7; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px;">
                Welcome to VocabMaster! Please use the following code to verify your email address:
            </p>
            <div style="background: white; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; font-size: 48px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    {otp_code}
                </h1>
            </div>
            <p style="color: #666; font-size: 14px;">
                This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
                © 2024 VocabMaster. All rights reserved.
            </p>
        </div>
    </div>
    '''


def send_via_gmail(to_email, otp_code):
    """
    Send OTP email using Gmail SMTP
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        gmail_user = os.getenv('GMAIL_USER')
        gmail_password = os.getenv('GMAIL_APP_PASSWORD')
        
        if not gmail_user or not gmail_password:
            logger.warning("Gmail credentials not found in environment variables")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your VocabMaster Verification Code'
        msg['From'] = f'VocabMaster <{gmail_user}>'
        msg['To'] = to_email
        
        # Plain text version (fallback)
        text_content = f"""
        Welcome to VocabMaster!
        
        Your verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        If you didn't request this code, please ignore this email.
        
        © 2024 VocabMaster. All rights reserved.
        """
        
        # HTML version
        html_content = get_email_html_template(otp_code)
        
        # Attach both versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email via Gmail SMTP
        # Try SSL (465) first
        try:
            with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=5) as server:
                server.login(gmail_user, gmail_password)
                server.send_message(msg)
            logger.info(f"✅ OTP email sent via Gmail (SSL) to {to_email}")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Gmail SSL failed: {str(e)}. Trying TLS...")

        # Try TLS (587) as fallback
        try:
            with smtplib.SMTP('smtp.gmail.com', 587, timeout=5) as server:
                server.starttls()
                server.login(gmail_user, gmail_password)
                server.send_message(msg)
            logger.info(f"✅ OTP email sent via Gmail (TLS) to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Gmail TLS also failed: {str(e)}")
            raise e
        
    except Exception as e:
        logger.error(f"❌ Gmail SMTP failed: {str(e)}")
        return False


def send_via_mailjet(to_email, otp_code):
    """
    Send OTP email using Mailjet API
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        import requests
        import base64
        
        mailjet_api_key = os.getenv('MAILJET_API_KEY')
        mailjet_secret_key = os.getenv('MAILJET_SECRET_KEY')
        from_email = os.getenv('FROM_EMAIL', 'noreply@vocabmaster.com')
        from_name = "VocabMaster"
        
        if not mailjet_api_key or not mailjet_secret_key:
            logger.warning("MAILJET_API_KEY or MAILJET_SECRET_KEY not found in environment variables")
            return False
        
        url = "https://api.mailjet.com/v3.1/send"
        
        # Mailjet uses Basic Auth with API key and secret
        auth_string = f"{mailjet_api_key}:{mailjet_secret_key}"
        auth_bytes = auth_string.encode('ascii')
        base64_bytes = base64.b64encode(auth_bytes)
        base64_string = base64_bytes.decode('ascii')
        
        payload = {
            "Messages": [
                {
                    "From": {
                        "Email": from_email,
                        "Name": from_name
                    },
                    "To": [
                        {
                            "Email": to_email
                        }
                    ],
                    "Subject": "Your VocabMaster Verification Code",
                    "HTMLPart": get_email_html_template(otp_code)
                }
            ]
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64_string}"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            logger.info(f"✅ OTP email sent via Mailjet to {to_email}")
            return True
        else:
            logger.error(f"Mailjet returned status code: {response.status_code}, body: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Mailjet failed: {str(e)}")
        return False


def send_via_gmail_api(to_email, otp_code):
    """
    Send OTP email using Gmail API (HTTPS, bypasses SMTP blocking)
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request
        import base64
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
        refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')
        
        if not client_id or not client_secret or not refresh_token:
            return False
            
        creds = Credentials(
            None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret
        )
        
        creds.refresh(Request())
        
        service = build('gmail', 'v1', credentials=creds)
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your VocabMaster Verification Code'
        msg['From'] = 'VocabMaster'
        msg['To'] = to_email
        
        text_content = f"Your verification code is: {otp_code}"
        html_content = get_email_html_template(otp_code)
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
        
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        
        logger.info(f"✅ OTP email sent via Gmail API to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Gmail API failed: {str(e)}")
        return False


def send_via_brevo(to_email, otp_code):
    """
    Send OTP email using Brevo (Sendinblue) API
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        import requests
        
        brevo_api_key = os.getenv('BREVO_API_KEY')
        from_email = os.getenv('FROM_EMAIL', 'noreply@vocabmaster.com')
        from_name = "VocabMaster"
        
        if not brevo_api_key:
            logger.warning("BREVO_API_KEY not found in environment variables")
            return False
        
        url = "https://api.brevo.com/v3/smtp/email"
        
        payload = {
            "sender": {
                "name": from_name,
                "email": from_email
            },
            "to": [
                {
                    "email": to_email
                }
            ],
            "subject": "Your VocabMaster Verification Code",
            "htmlContent": get_email_html_template(otp_code)
        }
        
        headers = {
            "accept": "application/json",
            "api-key": brevo_api_key,
            "content-type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"✅ OTP email sent via Brevo to {to_email}")
            return True
        else:
            logger.error(f"Brevo returned status code: {response.status_code}, body: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Brevo failed: {str(e)}")
        return False


def send_via_sendgrid(to_email, otp_code):
    """
    Send OTP email using SendGrid API
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        from_email = os.getenv('FROM_EMAIL', 'noreply@vocabmaster.com')
        
        if not sendgrid_api_key:
            logger.warning("SENDGRID_API_KEY not found in environment variables")
            return False
        
        # Create email message
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject='Your VocabMaster Verification Code',
            html_content=get_email_html_template(otp_code)
        )
        
        # Send email via SendGrid
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"✅ OTP email sent via SendGrid to {to_email}")
            return True
        else:
            logger.error(f"SendGrid returned status code: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ SendGrid failed: {str(e)}")
        return False


def send_otp_email(to_email, otp_code):
    """
    Send OTP verification email with automatic fallback
    Tries Gmail API first (works on Render), then SMTP, then third-party services
    
    Args:
        to_email (str): Recipient email address
        otp_code (str): 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully via any method, False otherwise
    """
    logger.info(f"📧 Attempting to send OTP email to {to_email}")
    
    # Try Gmail API first (works on Render/cloud platforms)
    if send_via_gmail_api(to_email, otp_code):
        logger.info("✅ Email sent successfully via Gmail API")
        return True
    
    # Try Gmail SMTP (works locally)
    logger.info("⚠️ Gmail API not configured, trying SMTP...")
    if send_via_gmail(to_email, otp_code):
        logger.info("✅ Email sent successfully via Gmail SMTP")
        return True
    
    # Fall back to Mailjet
    logger.info("⚠️ Gmail SMTP failed, trying Mailjet...")
    if send_via_mailjet(to_email, otp_code):
        logger.info("✅ Email sent successfully via Mailjet")
        return True
    
    # Fall back to Brevo (Sendinblue)
    logger.info("⚠️ Mailjet failed, trying Brevo...")
    if send_via_brevo(to_email, otp_code):
        logger.info("✅ Email sent successfully via Brevo")
        return True

    # Fall back to SendGrid
    logger.info("⚠️ Brevo failed, trying SendGrid...")
    if send_via_sendgrid(to_email, otp_code):
        logger.info("✅ Email sent successfully via SendGrid")
        return True
    
    # All methods failed
    logger.error("❌ All email sending methods failed")
    return False
