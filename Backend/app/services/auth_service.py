from werkzeug.security import check_password_hash, generate_password_hash
from .appwrite_service import AppwriteService
from ..utils.security import generate_token
from flask import current_app, url_for
import datetime
import jwt

class AuthService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def register_user(self, email, password, name=None, gender='prefer_not_to_say', bio=''):
        """Register a new user"""
        try:
            # Check if user exists
            existing_user = self.appwrite_service.get_user_by_email(email)
            if existing_user:
                return {'success': False, 'message': 'Email already registered'}, 400
            
            # Create user with additional profile data
            user = self.appwrite_service.create_user(email, password, name, gender, bio)
            
            # Generate token for email verification (10-minute expiry)
            token = generate_token(user['$id'])
            
            # Send verification email with custom JWT token
            self._send_verification_email(email, token)
            
            return {
                'success': True,
                'message': 'User registered successfully. Please check your email for verification.',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name'],
                    'isVerified': False
                }
            }, 201
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def login_user(self, email, password):
        """Login a user"""
        try:
            # Try to login with Appwrite
            result = self.appwrite_service.login_user(email, password)
            
            # Generate our own JWT token instead of using Appwrite's
            token = generate_token(result['user']['$id'])
            
            return {
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': result['user']['$id'],
                    'email': result['user']['email'],
                    'name': result['user']['name'],
                    'isPro': False,  # You'll want to retrieve this from your database
                    'isVerified': True  # You'll want to retrieve this from your database
                },
                'token': token
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 401
            
    def verify_email(self, token):
        """Verify a user's email with the provided token"""
        try:
            # Decode JWT token
            payload = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=['HS256']
            )
            
            user_id = payload['sub']
            
            # Mark user as verified in your database
            # self.appwrite_service.mark_user_verified(user_id)
            
            return {
                'success': True,
                'message': 'Email verified successfully',
                'email': self.appwrite_service.get_user(user_id)['email']
            }, 200
        except jwt.ExpiredSignatureError:
            return {'success': False, 'message': 'Verification link expired'}, 400
        except Exception as e:
            return {'success': False, 'message': str(e)}, 400
            
    def resend_verification(self, email):
        """Resend verification email"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Generate new token
            token = generate_token(user['$id'])
            
            # Send verification email
            # self._send_verification_email(email, token)
            
            return {
                'success': True,
                'message': 'Verification email sent'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
            
    def _send_verification_email(self, email, token):
        """Send verification email with JWT token"""
        # Construct verification URL with the JWT token
        verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
        
        # In production, send this URL to the user's email using your email service
        # For development, just print the link
        print(f"Verification link for {email}: {verification_url}")
        print(f"This link will expire in 10 minutes.")
        
        # TODO: Implement sending email with this verification URL
        # You'll need to configure an email service like SendGrid, Mailgun, etc.

    def send_password_reset(self, email):
        """Send password reset email with JWT token"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Generate token with 10-minute expiry
            token = generate_token(user['$id'])
            
            # Construct reset URL with the JWT token
            reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password/{token}"
            
            # Send verification email with this reset URL
            print(f"Password reset link for {email}: {reset_url}")
            print(f"This link will expire in 10 minutes.")
            
            # TODO: Implement sending email with this reset URL
            # You'll need to configure an email service like SendGrid, Mailgun, etc.
            
            return {
                'success': True,
                'message': 'Password reset email sent'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def reset_password(self, token, new_password):
        """Reset user password with JWT token"""
        try:
            # Verify token
            try:
                payload = jwt.decode(
                    token, 
                    current_app.config['JWT_SECRET_KEY'],
                    algorithms=['HS256']
                )
                user_id = payload['sub']
            except jwt.ExpiredSignatureError:
                return {'success': False, 'message': 'Token expired'}, 401
            except jwt.InvalidTokenError:
                return {'success': False, 'message': 'Invalid token'}, 401
            
            # Update password in Appwrite
            self.appwrite_service.update_user_password(user_id, new_password)
            
            return {
                'success': True,
                'message': 'Password reset successfully'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def send_magic_link(self, email):
        """Send magic link for passwordless login using Appwrite's built-in system"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Use Appwrite's native magic URL functionality
            magic_link_url = current_app.config.get('FRONTEND_URL', '') + '/magic-login'
            self.appwrite_service.send_magic_link(email, magic_link_url)
            
            return {
                'success': True,
                'message': 'Magic link email sent'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def verify_magic_link(self, token):
        """Verify magic link token and log in the user"""
        try:
            # Verify token
            try:
                payload = jwt.decode(
                    token, 
                    current_app.config['JWT_SECRET_KEY'],
                    algorithms=['HS256']
                )
                user_id = payload['sub']
            except jwt.ExpiredSignatureError:
                return {'success': False, 'message': 'Magic link expired'}, 401
            except jwt.InvalidTokenError:
                return {'success': False, 'message': 'Invalid magic link'}, 401
            
            # Get user
            user = self.appwrite_service.get_user(user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            # Generate JWT token for authentication
            auth_token = generate_token(user_id)
            
            return {
                'success': True,
                'message': 'Magic link login successful',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name'],
                    'isPro': False,  # You'll want to retrieve this from your database
                    'isVerified': True  # Auto-verified if magic link is used
                },
                'token': auth_token
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def send_session_alert(self, email, session_data):
        """Send an alert about a new login session using Appwrite's native session alerts"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Appwrite handles session notifications automatically when enabled
            # We don't need to trigger them manually
            
            return {'success': True, 'message': 'Session alert system active'}, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def forgot_password(self, email):
        """Send password reset email using Appwrite's built-in system"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Use Appwrite's native password recovery functionality
            reset_url = current_app.config.get('FRONTEND_URL', '') + '/reset-password'
            self.appwrite_service.send_password_reset(email, reset_url)
            
            return {
                'success': True,
                'message': 'Password reset email sent'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500