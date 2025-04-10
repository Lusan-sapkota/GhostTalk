import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import logging
from datetime import datetime

class EmailService:
    def __init__(self):
        # Get SMTP settings from config
        self.smtp_host = current_app.config.get('SMTP_HOST', 'smtp.zoho.com')
        self.smtp_port = current_app.config.get('SMTP_PORT', 587)
        self.smtp_user = current_app.config.get('SMTP_USER', 'no-reply@ghosttalk.me')
        self.smtp_pass = current_app.config.get('SMTP_PASS', 'No-reply@7890')
        self.sender_name = current_app.config.get('SENDER_NAME', 'GhostTalk')
        self.sender_email = current_app.config.get('SENDER_EMAIL', 'no-reply@ghosttalk.me')
        self.reply_to = current_app.config.get('REPLY_TO', 'support@ghosttalk.me')
        
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send an email using Zoho SMTP server"""
        try:
            print(f"Attempting to send email to {to_email}")
            print(f"SMTP settings: {self.smtp_host}:{self.smtp_port} with user {self.smtp_user}")
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = to_email
            msg['Reply-To'] = self.reply_to
            
            # Create plain text version if not provided
            if text_content is None:
                import re
                text_content = re.sub('<.*?>', '', html_content)
            
            # Attach plain text and HTML parts
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Connect to SMTP server with detailed logging
            print("Connecting to SMTP server...")
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.set_debuglevel(1)  # Enable SMTP debug output
            server.starttls()
            
            print(f"Logging into SMTP server as {self.smtp_user}...")
            server.login(self.smtp_user, self.smtp_pass)
            
            print(f"Sending email from {self.sender_email} to {to_email}...")
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()
            
            print(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"ERROR SENDING EMAIL: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def send_verification_email(self, to_email, username, verification_url):
        """Send email verification link"""
        subject = "Verify Your GhostTalk Account"
        current_year = datetime.now().year
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #5851D8; text-align: center;">GhostTalk</h1>
            <h2>Hello {username},</h2>
            <p>Thank you for signing up for GhostTalk! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" style="background-color: #5851D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Verify Email Address
                </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
                {verification_url}
            </p>
            
            <p>This link will expire in 10 minutes.</p>
            
            <p>If you didn't create an account with GhostTalk, you can safely ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_password_reset_email(self, to_email, reset_url):
        """Send a password reset email with the provided URL"""
        subject = "Reset Your GhostTalk Password"
        current_year = datetime.now().year
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8;">GhostTalk</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>We received a request to reset your GhostTalk password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background-color: #5851D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste the following URL into your browser:</p>
            
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">{reset_url}</p>
            
            <p>This password reset link will expire in 10 minutes.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_magic_link_email(self, to_email, magic_url):
        """Send a magic link email with the provided URL"""
        subject = "Your GhostTalk Login Link"
        current_year = datetime.now().year
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8;">GhostTalk</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>Here's your magic login link for GhostTalk. Click the button below to log in:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{magic_url}" style="background-color: #5851D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In to GhostTalk</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste the following URL into your browser:</p>
            
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">{magic_url}</p>
            
            <p>This login link will expire in 10 minutes.</p>
            
            <p>If you didn't request this login link, please ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_2fa_code_email(self, to_email, code, device_info=None):
        """Send a 2FA verification code email"""
        subject = "Your GhostTalk Verification Code"
        current_year = datetime.now().year
        
        device_text = ""
        if device_info:
            device_text = f"""
            <p>Login attempt from:</p>
            <ul>
                <li>Device: {device_info.get('device', 'Unknown device')}</li>
                <li>Location: {device_info.get('location', 'Unknown location')}</li>
                <li>IP Address: {device_info.get('ip', 'Unknown IP')}</li>
                <li>Time: {device_info.get('time', 'Just now')}</li>
            </ul>
            """
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8;">GhostTalk</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>Your verification code for GhostTalk is:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">{code}</div>
            </div>
            
            {device_text}
            
            <p>This code will expire in 10 minutes.</p>
            
            <p>If you didn't request this code, please change your password immediately and contact support.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)
    def send_session_alert_email(self, to_email, session_data, verify_url=None):
        """Send a notification about a new login session"""
        subject = "New Login to Your GhostTalk Account"
        current_year = datetime.now().year
        subject = "New Login to Your GhostTalk Account"
        
        verify_button = ""
        if verify_url:
            verify_button = f"""
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="background-color: #5851D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify This Login</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste the following URL into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">{verify_url}</p>
            """
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8;">GhostTalk</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>We detected a new login to your GhostTalk account. Here are the details:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Device:</strong> {session_data.get('device', 'Unknown device')}</p>
                <p><strong>Location:</strong> {session_data.get('location', 'Unknown location')}</p>
                <p><strong>IP Address:</strong> {session_data.get('ip', 'Unknown IP')}</p>
                <p><strong>Time:</strong> {session_data.get('time', 'Just now')}</p>
            </div>
            
            {verify_button}
            
            <p>If this was you, you can ignore this email. If you didn't sign in to your account, please change your password immediately and contact support.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_welcome_email(self, to_email, username):
        """Send a beautiful welcome email to new users after account creation"""
        subject = "Welcome to GhostTalk! 👋"
        current_year = datetime.now().year
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8; margin-bottom: 5px;">GhostTalk</h1>
                <p style="color: #9795d2; margin-top: 0;">Private conversations, reimagined</p>
            </div>
            
            <div style="background-color: #f9f8ff; border-left: 4px solid #5851D8; padding: 15px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #333;">Welcome, {username}!</h2>
                <p>We're excited to have you join our community. Your account has been successfully created.</p>
            </div>
            
            <h3 style="color: #5851D8;">Getting Started</h3>
            <ul style="padding-left: 20px; line-height: 1.6;">
                <li><strong>Complete your profile</strong> - Add a profile picture and bio</li>
                <li><strong>Security first</strong> - Consider enabling two-factor authentication</li>
                <li><strong>Find connections</strong> - Search for friends or join public discussions</li>
                <li><strong>Start chatting</strong> - Send your first message or join a room</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{current_app.config.get('FRONTEND_URL', '')}/home" 
                   style="background-color: #5851D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Explore GhostTalk
                </a>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px;">Need Help?</h3>
                <p style="margin-bottom: 0;">If you have any questions, check out our <a href="{current_app.config.get('FRONTEND_URL', '')}/help" style="color: #5851D8; text-decoration: none;">Help Center</a> or contact our support team at <a href="mailto:support@ghosttalk.me" style="color: #5851D8; text-decoration: none;">support@ghosttalk.me</a></p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px; text-align: center;">
                <p>© {current_year} GhostTalk. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
                <div style="margin-top: 10px;">
                    <a href="{current_app.config.get('FRONTEND_URL', '')}/terms" style="color: #5851D8; text-decoration: none; margin: 0 10px;">Terms</a>
                    <a href="{current_app.config.get('FRONTEND_URL', '')}/privacy" style="color: #5851D8; text-decoration: none; margin: 0 10px;">Privacy</a>
                    <a href="{current_app.config.get('FRONTEND_URL', '')}/settings/notifications" style="color: #5851D8; text-decoration: none; margin: 0 10px;">Email Preferences</a>
                </div>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)