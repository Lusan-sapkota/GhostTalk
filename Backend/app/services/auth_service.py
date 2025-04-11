from werkzeug.security import check_password_hash, generate_password_hash
from .appwrite_service import AppwriteService
from ..utils.security import generate_token
from flask import current_app, url_for, request
import datetime
import jwt

# Import the proper JWT libraries
import jwt
from datetime import datetime, timedelta

# Add this import
from ..services.email_service import EmailService

# Add this import at the top of the file
from ..utils.geolocation import get_location_from_ip

# Add this import at the top of the file
from ..utils.request_utils import get_client_ip

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
        self.email_service = EmailService()
    
    def register_user(self, email, password, name=None, gender='prefer_not_to_say', bio=''):
        """Register a new user with enhanced email verification and debugging"""
        try:
            print(f"[REGISTER DEBUG] Starting registration for: {email}")
            
            # Check if user exists
            existing_user = self.appwrite_service.get_user_by_email(email)
            if (existing_user):
                print(f"[REGISTER DEBUG] ❌ Email already registered: {email}")
                return {'success': False, 'message': 'Email already registered'}, 400
            
            # Create user with additional profile data
            print(f"[REGISTER DEBUG] Creating new user in Appwrite")
            user = self.appwrite_service.create_user(email, password, name, gender, bio)
            print(f"[REGISTER DEBUG] ✓ User created with ID: {user['$id']}")
            
            # Add a delay before sending verification (some systems need this)
            import time
            time.sleep(1)  # 1 second delay
            
            # Send verification email using Appwrite's templates with our custom URL
            print(f"[REGISTER DEBUG] Sending verification email via Appwrite")
            verification_result = self.appwrite_service.create_verification(email)
            print(f"[REGISTER DEBUG] Verification result: {verification_result}")
            
            # Attempt direct email sending as backup immediately
            if 'email_service' in dir(self) and hasattr(self, 'email_service'):
                try:
                    print(f"[REGISTER DEBUG] Sending backup email using our email service")
                    
                    # Generate token
                    from ..utils.security import generate_token
                    token = generate_token(user['$id'], 'verification', 60)
                    
                    # Create verification URL
                    verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
                    
                    # Send through our system
                    self.email_service.send_verification_email(
                        email,
                        name or "User",
                        verification_url
                    )
                    print(f"[REGISTER DEBUG] ✓ Backup email sent")
                except Exception as email_err:
                    print(f"[REGISTER DEBUG] ❌ Error sending backup email: {str(email_err)}")
            
            # After successful user creation and verification email sending
            # Add this code before returning success response:
            try:
                print(f"[REGISTER DEBUG] Sending welcome email to {email}")
                self.email_service.send_welcome_email(
                    email,
                    name or "User"
                )
                print(f"[REGISTER DEBUG] ✓ Welcome email sent")
            except Exception as welcome_err:
                print(f"[REGISTER DEBUG] ❌ Error sending welcome email: {str(welcome_err)}")
                # Continue anyway, don't stop registration for welcome email failure
            
            return {
                'success': True,
                'message': 'User registered successfully. Please check your email for verification.',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name'],
                    'isVerified': False
                },
                'debug': {
                    'verification_result': verification_result,
                    'appwrite_email_sent': verification_result.get('success', False) if verification_result else False
                }
            }, 201
        except Exception as e:
            print(f"[REGISTER DEBUG] ❌ Registration error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500
    
    def login_user(self, email, password):
        """Login a user with 2FA support"""
        try:
            print(f"AuthService: Attempting to login user {email}")
            
            # First check if user exists
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            # Check if user is verified
            user_doc = self.appwrite_service.get_user_document(user['$id'])
            is_verified = user_doc and user_doc.get('isVerified', False) if user_doc else False
            
            if not is_verified:
                print(f"User {email} is not verified")
                return {
                    'success': False, 
                    'message': 'Please verify your email before logging in',
                    'needsVerification': True,
                    'email': email
                }, 401
            
            try:
                # Try to login with Appwrite
                result = self.appwrite_service.login_user(email, password)
                
                if not result.get('success', False):
                    return {'success': False, 'message': 'Invalid email or password'}, 401
                
                # Check if 2FA is enabled for this user
                two_factor_enabled = user_doc and user_doc.get('twoFactorEnabled', False)
                
                if two_factor_enabled:
                    # Generate and send a 2FA code
                    self.generate_2fa_code(user['$id'])
                    
                    return {
                        'success': True,
                        'requires2FA': True,
                        'userId': user['$id'],
                        'email': self._mask_email(email),
                        'message': '2FA code sent to your email'
                    }, 200
                else:
                    # No 2FA required, proceed with normal login
                    # Generate our own JWT token instead of using Appwrite's
                    from ..utils.security import generate_token
                    token = generate_token(result['user']['$id'], 'auth', 60*24*7)  # 7 day expiry
                    
                    # Send session alert if enabled for this user
                    session_alerts_enabled = user_doc and user_doc.get('sessionAlertsEnabled', True)
                    if session_alerts_enabled:
                        # This would be handled asynchronously in a production app
                        # But for simplicity, we'll do it synchronously here
                        try:
                            # Get client info from request context or use defaults
                            client_ip = get_client_ip()
                            client_name = request.user_agent.string if request and hasattr(request, 'user_agent') else 'Unknown device'
                            
                            self.send_session_alert_email(user['$id'], client_ip, client_name)
                        except Exception as alert_e:
                            print(f"Failed to send session alert: {str(alert_e)}")
                    
                    return {
                        'success': True,
                        'message': 'Login successful',
                        'user': {
                            'id': result['user']['$id'],
                            'email': result['user']['email'],
                            'name': result['user']['name'],
                            'isPro': user_doc.get('isPro', False) if user_doc else False,
                            'isVerified': True
                        },
                        'token': token
                    }, 200
            except Exception as login_err:
                print(f"Error during login process: {str(login_err)}")
                return {'success': False, 'message': f'Authentication error: {str(login_err)}'}, 401
                
        except Exception as e:
            print(f"Login error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 401
            
    def verify_email(self, token):
        """Verify a user's email with the provided JWT token"""
        try:
            # Decode and verify JWT token
            from ..utils.security import verify_token
            payload = verify_token(token, 'verification')
            
            if not payload:
                return {'success': False, 'message': 'Invalid or expired verification token'}, 400
                
            user_id = payload['sub']
            print(f"Verifying email for user ID: {user_id}")
            
            # Mark user as verified in the database
            verification_success = self.appwrite_service.mark_user_verified(user_id)
            if verification_success:
                # Get user for the response
                user = self.appwrite_service.get_user(user_id)
                
                print(f"Successfully verified email for user: {user['$id'] if user else 'unknown'}")
                return {
                    'success': True,
                    'message': 'Email verified successfully',
                    'email': user['email'] if user else ''
                }, 200
            else:
                print("Failed to verify email in database/Appwrite")
                return {'success': False, 'message': 'Failed to verify email'}, 500
        except Exception as e:
            print(f"Error verifying email: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500
            
    def resend_verification(self, email):
        """Resend verification email with reliable delivery"""
        try:
            print(f"Attempting to resend verification email to {email}")
            
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                print(f"User with email {email} not found")
                return {'success': False, 'message': 'User not found'}, 404
            
            print(f"User found with ID: {user['$id']}")
            
            # Generate verification token
            from ..utils.security import generate_token
            token = generate_token(user['$id'], 'verification', 60)  # 60 minute expiry
            
            # Create verification URL - use the consistent FRONTEND_URL from config
            verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
            print(f"Generated verification URL: {verification_url}")
            
            # Get username from user document
            user_doc = self.appwrite_service.get_user_document(user['$id'])
            username = user_doc.get('username', 'User') if user_doc else user.get('name', 'User')
            
            # Always use our custom email service to ensure delivery
            print(f"Sending verification email via custom email service to {email}")
            email_sent = self.email_service.send_verification_email(
                email, 
                username, 
                verification_url
            )
            
            if not email_sent:
                print("Email service failed to send email")
                return {'success': False, 'message': 'Failed to send verification email'}, 500
            
            # Try Appwrite's built-in verification system as a backup
            try:
                print("Also attempting to send via Appwrite...")
                self.appwrite_service.create_verification(email)
                print("Appwrite verification method succeeded")
            except Exception as appwrite_e:
                print(f"Appwrite verification failed, but our email was already sent: {str(appwrite_e)}")
            
            # Store verification URL for development
            try:
                # Update verification status to false until verified
                try:
                    self.appwrite_service.database.update_document(
                        database_id=self.appwrite_service.database_id,
                        collection_id=self.appwrite_service.users_collection_id,
                        document_id=user['$id'],
                        data={
                            'isVerified': False,
                            'verificationUrl': verification_url,
                            'verificationExpiry': (datetime.utcnow() + timedelta(hours=1)).isoformat()
                        }
                    )
                    print("Successfully updated user document with verification URL")
                except Exception as attr_e:
                    print(f"Warning: Could not update user document: {str(attr_e)}")
            except Exception as doc_e:
                print(f"Failed to update user document: {str(doc_e)}")
            
            return {
                'success': True,
                'message': 'Verification email sent',
                # For testing only - remove in production:
                'verificationUrl': verification_url
            }, 200
        except Exception as e:
            print(f"Error in resend_verification: {str(e)}")
            import traceback
            traceback.print_exc()
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

    # Update the forgot_password method
    def forgot_password(self, email):
        """Send password reset email with reliable delivery"""
        try:
            print(f"[PASSWORD RESET DEBUG] Starting for email: {email}")
            
            # Get user
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                print(f"[PASSWORD RESET DEBUG] ❌ User not found: {email}")
                return {'success': False, 'message': 'User not found'}, 404
            
            # Generate token
            from ..utils.security import generate_token
            token = generate_token(user['$id'], 'reset', 10)  # 10 minute expiry
            
            # Create reset URL
            reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password/{token}"
            print(f"[PASSWORD RESET DEBUG] Generated reset URL: {reset_url}")
            
            # Store reset URL for tracking
            try:
                self.appwrite_service.database.update_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=self.appwrite_service.users_collection_id,
                    document_id=user['$id'],
                    data={
                        'passwordResetUrl': reset_url,
                        'passwordResetExpiry': (datetime.utcnow() + timedelta(minutes=10)).isoformat()
                    }
                )
                print(f"[PASSWORD RESET DEBUG] ✓ Updated user document with reset URL")
            except Exception as doc_e:
                print(f"[PASSWORD RESET DEBUG] ⚠️ Warning: Failed to update user document: {str(doc_e)}")
            
            # Try Appwrite's built-in system first
            appwrite_success = False
            try:
                print(f"[PASSWORD RESET DEBUG] Attempting to send via Appwrite...")
                appwrite_result = self.appwrite_service.send_password_reset(email, reset_url)
                appwrite_success = appwrite_result and appwrite_result.get('success', False)
                print(f"[PASSWORD RESET DEBUG] Appwrite result: {appwrite_success}")
            except Exception as appwrite_e:
                print(f"[PASSWORD RESET DEBUG] ❌ Appwrite password reset failed: {str(appwrite_e)}")
            
            # Always use our custom email service (either as primary or backup)
            email_sent = False
            try:
                print(f"[PASSWORD RESET DEBUG] Sending via custom email service...")
                email_sent = self.email_service.send_password_reset_email(email, reset_url)
                print(f"[PASSWORD RESET DEBUG] Custom email result: {email_sent}")
            except Exception as email_e:
                print(f"[PASSWORD RESET DEBUG] ❌ Custom email failed: {str(email_e)}")
            
            if not appwrite_success and not email_sent:
                print(f"[PASSWORD RESET DEBUG] ❌ Both delivery methods failed")
                return {'success': False, 'message': 'Failed to send password reset email'}, 500
            
            print(f"[PASSWORD RESET DEBUG] ✓ Password reset email sent successfully")
            return {
                'success': True,
                'message': 'Password reset email sent'
            }, 200
        except Exception as e:
            print(f"[PASSWORD RESET DEBUG] ❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500

    def reset_password(self, token, new_password):
        """Reset user password with our JWT token"""
        try:
            # Verify token
            from ..utils.security import verify_token
            payload = verify_token(token, 'reset')
            
            if not payload:
                return {'success': False, 'message': 'Invalid or expired token'}, 401
                
            user_id = payload['sub']
            
            # Update password in Appwrite
            self.appwrite_service.update_user_password(user_id, new_password)
            
            return {
                'success': True,
                'message': 'Password reset successfully'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    # Update the send_magic_link method
    def send_magic_link(self, email):
        """Send magic link for passwordless login with reliable delivery"""
        try:
            print(f"[MAGIC LINK DEBUG] Starting for email: {email}")
            
            # Check if user exists and is verified
            user = self.appwrite_service.get_user_by_email(email)
            if not user:
                print(f"[MAGIC LINK DEBUG] ❌ User not found: {email}")
                return {'success': False, 'message': 'User not found'}, 404
            
            # Check verification status
            user_doc = self.appwrite_service.get_user_document(user['$id'])
            is_verified = user_doc and user_doc.get('isVerified', False)
            
            if not is_verified:
                print(f"[MAGIC LINK DEBUG] ❌ User not verified: {email}")
                return {
                    'success': True,
                    'needsVerification': True,
                    'message': 'Please verify your email before using magic link login'
                }, 200
            
            # Generate token
            from ..utils.security import generate_token
            token = generate_token(user['$id'], 'magic', 10)  # 10 minute expiry
            
            # Create magic URL
            magic_url = f"{current_app.config['FRONTEND_URL']}/magic-login/{token}"
            print(f"[MAGIC LINK DEBUG] Generated magic URL: {magic_url}")
            
            # Always store the magic link URL in user document for tracking/debugging
            try:
                self.appwrite_service.database.update_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=self.appwrite_service.users_collection_id,
                    document_id=user['$id'],
                    data={
                        'magicLinkUrl': magic_url,
                        'magicLinkExpiry': (datetime.utcnow() + timedelta(minutes=10)).isoformat()
                    }
                )
                print(f"[MAGIC LINK DEBUG] ✓ Updated user document with magic URL")
            except Exception as doc_e:
                print(f"[MAGIC LINK DEBUG] ⚠️ Warning: Failed to update user document: {str(doc_e)}")
            
            # First try Appwrite's built-in system
            appwrite_success = False
            try:
                print(f"[MAGIC LINK DEBUG] Attempting to send via Appwrite...")
                appwrite_result = self.appwrite_service.send_magic_link(email, magic_url)
                appwrite_success = appwrite_result and appwrite_result.get('success', False)
                print(f"[MAGIC LINK DEBUG] Appwrite result: {appwrite_success}")
            except Exception as appwrite_e:
                print(f"[MAGIC LINK DEBUG] ❌ Appwrite magic link failed: {str(appwrite_e)}")
            
            # Always use our custom email service (either as primary or backup)
            email_sent = False
            try:
                print(f"[MAGIC LINK DEBUG] Sending via custom email service...")
                email_sent = self.email_service.send_magic_link_email(email, magic_url)
                print(f"[MAGIC LINK DEBUG] Custom email result: {email_sent}")
            except Exception as email_e:
                print(f"[MAGIC LINK DEBUG] ❌ Custom email failed: {str(email_e)}")
            
            if not appwrite_success and not email_sent:
                print(f"[MAGIC LINK DEBUG] ❌ Both delivery methods failed")
                return {'success': False, 'message': 'Failed to send magic link email'}, 500
            
            print(f"[MAGIC LINK DEBUG] ✓ Magic link sent successfully")
            return {
                'success': True,
                'message': 'Magic link email sent'
            }, 200
        except Exception as e:
            print(f"[MAGIC LINK DEBUG] ❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500

    def verify_magic_link(self, token):
        """Verify magic link token and log in the user"""
        try:
            print(f"[MAGIC LINK VERIFY DEBUG] Starting verification for token: {token[:10]}...")
            
            # Verify token
            from ..utils.security import verify_token
            payload = verify_token(token, 'magic')
            
            if not payload:
                print(f"[MAGIC LINK VERIFY DEBUG] ❌ Invalid or expired token")
                return {'success': False, 'message': 'Invalid or expired token'}, 401
                
            user_id = payload['sub']
            print(f"[MAGIC LINK VERIFY DEBUG] Token validated for user ID: {user_id}")
            
            # Get user details
            print(f"[MAGIC LINK VERIFY DEBUG] Getting user details from Appwrite")
            user = self.appwrite_service.get_user(user_id)
            if not user:
                print(f"[MAGIC LINK VERIFY DEBUG] ❌ User not found: {user_id}")
                return {'success': False, 'message': 'User not found'}, 404
            
            print(f"[MAGIC LINK VERIFY DEBUG] Found user: {user.get('email', 'unknown')}")
            
            # Generate a new auth token for the session
            print(f"[MAGIC LINK VERIFY DEBUG] Generating auth token")
            from ..utils.security import generate_token  # Import locally to avoid conflicts
            auth_token = generate_token(user_id, 'auth', 60*24*7)  # 7 day session
            
            # Get additional user data
            user_doc = self.appwrite_service.get_user_document(user_id)
            is_pro = user_doc.get('isPro', False) if user_doc else False
            
            # Check if session alerts are enabled for this user
            session_alerts_enabled = user_doc.get('sessionAlertsEnabled', True) if user_doc else True
            
            # Send session alert in background thread to not delay login
            if session_alerts_enabled:
                # Get client info
                client_ip = get_client_ip()
                client_name = request.user_agent.string if hasattr(request, 'user_agent') else 'Unknown device'
                
                # Use threading to send alert without delaying response
                import threading
                alert_thread = threading.Thread(
                    target=self.send_session_alert_email,
                    args=(user_id, client_ip, client_name)
                )
                alert_thread.daemon = True
                alert_thread.start()
                print(f"[MAGIC LINK VERIFY DEBUG] Session alert triggered in background")
            
            print(f"[MAGIC LINK VERIFY DEBUG] ✓ Verification successful!")
            return {
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user.get('name', 'User'),
                    'isPro': is_pro,
                    'isVerified': True
                },
                'token': auth_token
            }, 200
        except Exception as e:
            print(f"[MAGIC LINK VERIFY DEBUG] ❌ Error in verification: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': f'Verification error: {str(e)}'}, 500

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

    # Update the generate_2fa_code method to use geolocation

    def generate_2fa_code(self, user_id):
        """Generate a 2FA code for a user with reliable email delivery"""
        try:
            print(f"[2FA DEBUG] Generating code for user ID: {user_id}")
            
            # Get user
            user = self.appwrite_service.get_user(user_id)
            if not user:
                print(f"[2FA DEBUG] ❌ User not found: {user_id}")
                return {'success': False, 'message': 'User not found'}, 404
            
            email = user.get('email')
            if not email:
                print(f"[2FA DEBUG] ❌ User has no email: {user_id}")
                return {'success': False, 'message': 'User email not found'}, 404
            
            # Generate a random 6-digit code
            import random
            code = ''.join(random.choices('0123456789', k=6))
            print(f"[2FA DEBUG] Generated code: {code[:2]}****")
            
            # Store the code and its expiry time in the user document
            from datetime import datetime, timedelta
            expiry = datetime.utcnow() + timedelta(minutes=10)
            
            try:
                self.appwrite_service.database.update_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=self.appwrite_service.users_collection_id,
                    document_id=user_id,
                    data={
                        'twoFactorCode': code,
                        'twoFactorCodeExpiry': expiry.isoformat()
                    }
                )
                print(f"[2FA DEBUG] ✓ Stored 2FA code in database")
            except Exception as db_e:
                print(f"[2FA DEBUG] ❌ Failed to store 2FA code: {str(db_e)}")
                return {'success': False, 'message': 'Failed to generate 2FA code'}, 500
            
            # Get client info for the email
            client_ip = get_client_ip()
            
            # Get location from IP
            location = get_location_from_ip(client_ip)
            
            device_info = {
                'device': request.user_agent.string if hasattr(request, 'user_agent') else 'Unknown device',
                'location': location,
                'ip': client_ip,
                'time': datetime.utcnow().isoformat()
            }
            
            # Send the code via email - try multiple times if needed
            email_sent = False
            for attempt in range(3):  # Try up to 3 times
                try:
                    print(f"[2FA DEBUG] Sending code via email (attempt {attempt+1})...")
                    email_sent = self.email_service.send_2fa_code_email(
                        user['email'], 
                        code,
                        device_info
                    )
                    if email_sent:
                        print(f"[2FA DEBUG] ✓ 2FA code email sent")
                        break
                    else:
                        print(f"[2FA DEBUG] ⚠️ Email send returned False on attempt {attempt+1}")
                except Exception as email_e:
                    print(f"[2FA DEBUG] ⚠️ Email attempt {attempt+1} failed: {str(email_e)}")
                    # Wait a bit before retrying
                    import time
                    time.sleep(1)
            
            if not email_sent:
                print(f"[2FA DEBUG] ❌ All email delivery attempts failed")
                return {'success': False, 'message': 'Failed to send 2FA code'}, 500
            
            print(f"[2FA DEBUG] ✓ 2FA code process completed successfully")
            return {
                'success': True,
                'message': '2FA code sent',
                'email': self._mask_email(user['email'])
            }, 200
        except Exception as e:
            print(f"[2FA DEBUG] ❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500
            
    def verify_2fa_code(self, user_id, code):
        """Verify a 2FA code for a user"""
        try:
            # Get user document
            user_doc = self.appwrite_service.get_user_document(user_id)
            if not user_doc:
                return {'success': False, 'message': 'User not found'}, 404
                
            # Check if the code matches and is not expired
            stored_code = user_doc.get('twoFactorCode')
            expiry_str = user_doc.get('twoFactorCodeExpiry')
            
            if not stored_code or not expiry_str:
                return {'success': False, 'message': 'No 2FA code found or code expired'}, 400
                
            # Check if the code has expired
            from datetime import datetime
            expiry = datetime.fromisoformat(expiry_str)
            if datetime.utcnow() > expiry:
                return {'success': False, 'message': '2FA code has expired'}, 400
                
            # Check if the code matches
            if code != stored_code:
                return {'success': False, 'message': 'Invalid 2FA code'}, 400
                
            # Clear the code and expiry
            try:
                self.appwrite_service.database.update_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=self.appwrite_service.users_collection_id,
                    document_id=user_id,
                    data={
                        'twoFactorCode': None,
                        'twoFactorCodeExpiry': None
                    }
                )
            except Exception as e:
                print(f"Failed to clear 2FA code: {str(e)}")
                
            # Get the user for the response
            user = self.appwrite_service.get_user(user_id)
            
            # Generate JWT token
            from ..utils.security import generate_token
            token = generate_token(user_id, 'auth', 60*24*7)  # 7 day expiry
            
            return {
                'success': True,
                'message': '2FA verification successful',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user.get('name', ''),
                    'isPro': user_doc.get('isPro', False),
                    'isVerified': True
                },
                'token': token
            }, 200
        except Exception as e:
            print(f"Error verifying 2FA code: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500
    
    def _mask_email(self, email):
        """Mask an email address for security"""
        if not email or '@' not in email:
            return email
            
        parts = email.split('@')
        name = parts[0]
        domain = parts[1]
        
        if len(name) <= 2:
            masked_name = name[0] + '*' * (len(name) - 1)
        else:
            masked_name = name[0] + '*' * (len(name) - 2) + name[-1]
            
        return f"{masked_name}@{domain}"
            
    def update_2fa_settings(self, user_id, enabled):
        """Enable or disable 2FA for a user"""
        try:
            # Update user's 2FA settings
            success = self.appwrite_service.update_user_2fa_settings(user_id, enabled)
            
            if not success:
                return {'success': False, 'message': 'Failed to update 2FA settings'}, 500
                
            return {
                'success': True,
                'message': f"2FA {'enabled' if enabled else 'disabled'} successfully"
            }, 200
        except Exception as e:
            print(f"Error updating 2FA settings: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
            
    def send_session_alert_email(self, user_id, client_ip, client_name):
        """Send an alert about a new login session with reliable delivery"""
        try:
            print(f"[SESSION ALERT DEBUG] Starting for user ID: {user_id}")
            
            # Get user
            user = self.appwrite_service.get_user(user_id)
            if not user:
                print(f"[SESSION ALERT DEBUG] ❌ User not found: {user_id}")
                return {'success': False, 'message': 'User not found'}, 404
            
            email = user.get('email')
            if not email:
                print(f"[SESSION ALERT DEBUG] ❌ User has no email: {user_id}")
                return {'success': False, 'message': 'User email not found'}, 404
            
            # Fix client IP detection
            if client_ip == 'Unknown' or client_ip.startswith('127.0.0.1'):
                from flask import request
                # Use a reliable IP detection method that looks for common headers
                client_ip = request.headers.get('X-Forwarded-For', request.headers.get('X-Real-IP', request.remote_addr))
                
                # If we get multiple IPs in X-Forwarded-For, take the first one (client's original IP)
                if ',' in client_ip:
                    client_ip = client_ip.split(',')[0].strip()
                    
            # Improve device detection
            if client_name == 'Unknown device' or not client_name:
                from flask import request
                client_name = request.headers.get('User-Agent', 'Unknown device')
            
            # Get more accurate location data
            from ..utils.geo import get_location_from_ip
            location = get_location_from_ip(client_ip) or "Unknown location"
            
            # Current time with proper formatting
            from datetime import datetime
            current_time = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
            # Create session data
            session_data = {
                'device': client_name,
                'ip': client_ip,
                'time': current_time,
                'location': location
            }
            
            # Store session alert data for tracking
            try:
                self.appwrite_service.database.update_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=self.appwrite_service.users_collection_id,
                    document_id=user_id,
                    data={
                        'lastSessionAlert': datetime.utcnow().isoformat(),
                        'lastSessionDevice': client_name,
                        'lastSessionIp': client_ip,
                        'lastSessionLocation': location
                    }
                )
                print(f"[SESSION ALERT DEBUG] ✓ Updated user document with session data")
            except Exception as doc_e:
                print(f"[SESSION ALERT DEBUG] ⚠️ Warning: Failed to update user document: {str(doc_e)}")
            
            # First try Appwrite's session alert if available
            appwrite_success = False
            try:
                print(f"[SESSION ALERT DEBUG] Attempting to send via Appwrite...")
                appwrite_success = self.appwrite_service.send_session_alert(user_id, client_ip, client_name)
                print(f"[SESSION ALERT DEBUG] Appwrite result: {appwrite_success}")
            except Exception as appwrite_e:
                print(f"[SESSION ALERT DEBUG] ❌ Appwrite session alert failed: {str(appwrite_e)}")
            
            # Always use our custom email service (either as primary or backup)
            email_sent = False
            try:
                print(f"[SESSION ALERT DEBUG] Sending via custom email service...")
                # Create verification URL for any security actions
                from ..utils.security import generate_token
                security_token = generate_token(user_id, 'security', 60*24)  # 24 hour expiry
                verify_url = f"{current_app.config['FRONTEND_URL']}/verify-session/{security_token}"
                
                email_sent = self.email_service.send_session_alert_email(
                    email,
                    session_data,
                    verify_url
                )
                print(f"[SESSION ALERT DEBUG] Custom email result: {email_sent}")
            except Exception as email_e:
                print(f"[SESSION ALERT DEBUG] ❌ Custom email failed: {str(email_e)}")
            
            if not appwrite_success and not email_sent:
                print(f"[SESSION ALERT DEBUG] ❌ Both delivery methods failed")
                return {'success': False, 'message': 'Failed to send session alert'}, 500
            
            print(f"[SESSION ALERT DEBUG] ✓ Session alert sent successfully")
            return {
                'success': True,
                'message': 'Session alert sent'
            }, 200
        except Exception as e:
            print(f"[SESSION ALERT DEBUG] ❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}, 500