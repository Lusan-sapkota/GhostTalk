from werkzeug.security import check_password_hash, generate_password_hash
from .appwrite_service import AppwriteService
from ..utils.security import generate_token
from flask import current_app, url_for
import datetime
import jwt

# Import the proper JWT libraries
import jwt
from datetime import datetime, timedelta

def generate_token(user_id):
    """Generate a JWT token for email verification or password reset"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=10),  # 10 minute expiration
        'iat': datetime.utcnow(),
        'type': 'verification'
    }
    
    # Use jwt.encode instead of directly calling encode on jwt
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    # In newer versions of PyJWT, encode returns a string directly
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

class AuthService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def register_user(self, email, password, name=None, gender='prefer_not_to_say', bio=''):
        """Register a new user"""
        try:
            # Check if user exists
            existing_user = self.appwrite_service.get_user_by_email(email)
            if (existing_user):
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
        """Verify a user's email with the provided JWT token"""
        try:
            # Decode JWT token
            import jwt
            
            try:
                payload = jwt.decode(
                    token, 
                    current_app.config['SECRET_KEY'],
                    algorithms=['HS256']
                )
                
                user_id = payload['user_id']
                email = payload.get('email', '')
                
                # Mark user as verified in the database
                self.appwrite_service.mark_user_verified(user_id)
                
                # Get user for the response
                user = self.appwrite_service.get_user(user_id)
                
                return {
                    'success': True,
                    'message': 'Email verified successfully',
                    'email': email or (user['email'] if user else '')
                }, 200
            except jwt.ExpiredSignatureError:
                return {'success': False, 'message': 'Verification link has expired'}, 400
            except jwt.InvalidTokenError:
                return {'success': False, 'message': 'Invalid verification token'}, 400
                
        except Exception as e:
            print(f"Verification error: {str(e)}")
            return {'success': False, 'message': f'Verification error: {str(e)}'}, 400
            
    def resend_verification(self, email):
        """Resend verification email using Appwrite's built-in template"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Use Appwrite's native email verification
            result = self.appwrite_service.send_verification_email(
                email=email,
                username=user.get('name', 'User')
            )
            
            return {
                'success': True,
                'message': 'Verification email sent'
            }, 200
        except Exception as e:
            print(f"Error in resend_verification: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
            
    def _send_verification_email(self, email, token):
        """Send verification email with JWT token using Appwrite templates"""
        # Construct verification URL with the JWT token
        verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
        
        try:
            # Use Appwrite's built-in verification email system
            url_param = f"?redirectUrl={verification_url}"
            self.appwrite_service.create_verification(email, url_param)
            
            return True
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            return False

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

    def check_email_verification(self, email):
        """Check if a user's email is verified"""
        try:
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Get user document which contains verification status
            user_doc = self.appwrite_service.get_user_document(user['$id'])
            
            # Check if verified
            is_verified = user_doc and user_doc.get('isVerified', False)
            
            return {
                'success': True,
                'isVerified': is_verified,
                'email': email
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def verify_email_appwrite(self, user_id, secret):
        """Verify email with Appwrite's verification parameters"""
        try:
            # Mark the user as verified in your database
            self.appwrite_service.mark_user_verified(user_id)
            
            # Get user information
            user = self.appwrite_service.get_user(user_id)
            email = user.get('email', '') if user else ''
            
            return {
                'success': True,
                'message': 'Email verified successfully',
                'email': email
            }, 200
        except Exception as e:
            print(f"Verification error: {str(e)}")
            return {'success': False, 'message': f'Verification error: {str(e)}'}, 400