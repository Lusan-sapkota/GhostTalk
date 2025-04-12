from flask import Blueprint, request, jsonify, current_app, g
from ..services.auth_service import AuthService
from ..utils.name_generator import generate_random_name
from ..repositories.username_repository import UsernameRepository
from ..utils.security import require_auth
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()
username_repository = UsernameRepository()

@auth_bp.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    """Handle OPTIONS requests for CORS preflight checks"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
    return response

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
    
    # Validate required fields
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    gender = data.get('gender', 'prefer_not_to_say')
    bio = data.get('bio', '')
    
    response, status_code = auth_service.register_user(email, password, name, gender, bio)
    return jsonify(response), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
    
    # Validate required fields
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    response, status_code = auth_service.login_user(email, password)
    return jsonify(response), status_code

@auth_bp.route('/generate-username', methods=['GET'])
def get_username():
    """Generate a random unique username without numbers"""
    try:
        # Debug output
        print("Username generation request received")
        
        # Generate a username
        username = generate_random_name()
        print(f"Generated username: {username}")
        
        return jsonify({
            'success': True,
            'username': username
        }), 200
    except Exception as e:
        import traceback
        print(f"Error generating username: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'message': f'Failed to generate username: {str(e)}',
            'error': str(e)
        }), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify a user's email with a token"""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'success': False, 'message': 'No token provided'}), 400
    
    token = data.get('token')
    response, status_code = auth_service.verify_email(token)
    return jsonify(response), status_code

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    response, status_code = auth_service.resend_verification(email)
    return jsonify(response), status_code

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Log out a user"""
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset link"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    response, status_code = auth_service.send_password_reset(email)
    return jsonify(response), status_code

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.get_json()
    
    if not data or 'token' not in data or 'password' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    token = data.get('token')
    password = data.get('password')
    response, status_code = auth_service.reset_password(token, password)
    return jsonify(response), status_code

@auth_bp.route('/magic-link', methods=['POST'])
def magic_link():
    """Send magic link for passwordless login"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    response, status_code = auth_service.send_magic_link(email)
    return jsonify(response), status_code

@auth_bp.route('/verify-magic-link', methods=['POST'])
def verify_magic_link():
    """Verify magic link token and log in the user"""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'success': False, 'message': 'No token provided'}), 400
    
    # Client information will be extracted from Flask request object
    token = data.get('token')
    response, status_code = auth_service.verify_magic_link(token)
    
    # Add this to the response:
    if response.get('success', False):
        response['sessionVerified'] = True
        
    return jsonify(response), status_code

@auth_bp.route('/session-alert', methods=['POST'])
def session_alert():
    """Send an alert about new login session"""
    data = request.get_json()
    
    if not data or 'userId' not in data or 'sessionData' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    user_id = data.get('userId')
    session_data = data.get('sessionData')
    
    # Extract client info
    client_ip = session_data.get('ip', 'Unknown')
    client_name = session_data.get('device', 'Unknown device')
    
    response, status_code = auth_service.send_session_alert(user_id, client_ip, client_name)
    return jsonify(response), status_code

@auth_bp.route('/verify-session', methods=['POST'])
def verify_session():
    """Verify a new session with the provided token"""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'success': False, 'message': 'No token provided'}), 400
    
    token = data.get('token')
    
    try:
        # Verify the session token - CHANGED 'session' to 'security' to match token type
        from ..utils.security import verify_token
        payload = verify_token(token, 'security')
        
        if not payload:
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
            
        user_id = payload['sub']
        
        # Get user and session data
        user = auth_service.appwrite_service.get_user(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        # Get session details from user document
        user_doc = auth_service.appwrite_service.get_user_document(user_id)
        
        session_details = {
            'device': user_doc.get('lastSessionDevice', 'Unknown device'),
            'ip': user_doc.get('lastSessionIp', 'Unknown IP'),
            'location': user_doc.get('lastSessionLocation', 'Unknown location'),
            'time': user_doc.get('lastSessionAlert', datetime.utcnow().isoformat())
        }
        
        # Mark session as verified in the user document
        auth_service.appwrite_service.database.update_document(
            database_id=auth_service.appwrite_service.database_id,
            collection_id=auth_service.appwrite_service.users_collection_id,
            document_id=user_id,
            data={
                'lastSessionVerified': True,
                'lastSessionVerifiedAt': datetime.utcnow().isoformat()
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Session verified successfully',
            'sessionDetails': session_details
        }), 200
    except Exception as e:
        print(f"Error verifying session: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/check-verification', methods=['POST'])
def check_verification():
    """Check if a user's email is verified"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    response, status_code = auth_service.check_email_verification(email)
    
    # For development/testing: if not verified, include the verification URL
    # SECURITY WARNING: Remove this in production!
    if response.get('success') and not response.get('isVerified'):
        try:
            user = auth_service.appwrite_service.get_user_by_email(email)
            if user:
                user_doc = auth_service.appwrite_service.get_user_document(user['$id'])
                if user_doc and 'verificationUrl' in user_doc:
                    response['_devUrl'] = user_doc['verificationUrl']
        except Exception as e:
            print(f"Error getting verification URL: {str(e)}")
    
    return jsonify(response), status_code

@auth_bp.route('/test-email', methods=['POST'])
def test_email():
    """Test email sending capability"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    
    try:
        # Create email service instance
        from ..services.email_service import EmailService
        email_service = EmailService()
        
        # Try to send a test email
        subject = "GhostTalk Email Test"
        html_content = """
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>GhostTalk Email Test</h1>
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p>If you received this email, your SMTP configuration is working!</p>
        </div>
        """
        
        success = email_service.send_email(email, subject, html_content)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Test email sent successfully!'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to send test email. Check server logs for details.'
            }), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@auth_bp.route('/status', methods=['GET'])
def status():
    """Check API status - useful for debugging"""
    try:
        # Check if Appwrite is accessible
        appwrite_status = True
        appwrite_message = "Connected"
        
        try:
            auth_service.appwrite_service._initialize_client()
            auth_service.appwrite_service.users.list()
        except Exception as e:
            appwrite_status = False
            appwrite_message = str(e)
        
        return jsonify({
            'success': True,
            'status': 'API server running',
            'appwrite': {
                'connected': appwrite_status,
                'message': appwrite_message
            },
            'config': {
                'frontend_url': current_app.config.get('FRONTEND_URL'),
                'has_smtp': hasattr(auth_service, 'email_service')
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'Error',
            'message': str(e)
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify a user's token is valid"""
    # Get token from request
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify token with your validation logic - accept any valid token type
        from ..utils.security import verify_token
        # Try multiple token types
        payload = verify_token(token) # Remove the type requirement
        
        if not payload:
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
            
        user_id = payload['sub']
        
        # Get user from database
        user = auth_service.appwrite_service.get_user(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Return user info and success
        return jsonify({
            'success': True, 
            'user': {
                'id': user['$id'],
                'name': user.get('name', 'Unknown User'),
                'email': user.get('email', '')
            }
        }), 200
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/debug-auth', methods=['GET', 'OPTIONS'])
def debug_auth():
    """Debug endpoint to check auth configuration"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    # Access Origin header to confirm CORS is working
    origin = request.headers.get('Origin', 'None')
    auth_header = request.headers.get('Authorization', 'None')
    
    return jsonify({
        'success': True,
        'origin': origin,
        'auth_header': auth_header[:10] + '...' if auth_header != 'None' else 'None',
        'cookies': {k: v for k, v in request.cookies.items()},
        'headers': {k: v for k, v in request.headers if k.lower() in ['user-agent', 'accept', 'content-type']},
    }), 200

@auth_bp.route('/appwrite-diagnostics', methods=['GET'])
def appwrite_diagnostics():
    """Get detailed diagnostics of Appwrite configuration"""
    try:
        # Initialize Appwrite service
        from ..services.appwrite_service import AppwriteService
        appwrite_service = AppwriteService()
        appwrite_service._initialize_client()
        
        # Check mail settings in Appwrite
        mail_settings = {
            'endpoint': current_app.config.get('APPWRITE_ENDPOINT'),
            'project_id': current_app.config.get('APPWRITE_PROJECT_ID'),
            'db_id': current_app.config.get('APPWRITE_DATABASE_ID'),
            'frontend_url': current_app.config.get('FRONTEND_URL')
        }
        
        # Test connection to Appwrite
        connection_ok = False
        connection_error = None
        try:
            # Try to list users as a simple connection test
            users_list = appwrite_service.users.list(limit=1)
            connection_ok = True
        except Exception as e:
            connection_error = str(e)

        # Check if Appwrite has the email verification methods
        has_create_verification = hasattr(appwrite_service.users, 'create_verification')
        has_createVerification = hasattr(appwrite_service.users, 'createVerification')
        
        # Try to get SDK version
        sdk_version = appwrite_service._get_sdk_version()
        
        return jsonify({
            'success': True,
            'appwrite': {
                'sdk_version': sdk_version,
                'connection_ok': connection_ok,
                'connection_error': connection_error,
                'has_create_verification': has_create_verification,
                'has_createVerification': has_createVerification,
                'mail_settings': mail_settings,
                'users_methods': dir(appwrite_service.users)
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/test-appwrite-email', methods=['POST'])
def test_appwrite_email():
    """Test Appwrite's email functionality directly"""
    if not current_app.debug:
        return jsonify({'success': False, 'message': 'Only available in debug mode'}), 403
        
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'No email provided'}), 400
    
    email = data.get('email')
    
    try:
        # Try using Appwrite's create_verification method
        verification_result = auth_service.appwrite_service.create_verification(email)
        
        # Try our custom email service as well
        from ..services.email_service import EmailService
        email_service = EmailService()
        
        # Generate test verification link
        test_link = f"{current_app.config['FRONTEND_URL']}/test-verification"
        
        # Send test email
        custom_result = email_service.send_verification_email(
            email,
            "Test User",
            test_link
        )
        
        return jsonify({
            'success': True,
            'message': 'Test emails sent',
            'appwrite_result': verification_result,
            'custom_result': custom_result
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verify a 2FA code"""
    data = request.get_json()
    
    if not data or 'userId' not in data or 'code' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    user_id = data.get('userId')
    code = data.get('code')
    
    response, status_code = auth_service.verify_2fa_code(user_id, code)
    return jsonify(response), status_code

@auth_bp.route('/settings/2fa', methods=['POST'])
@require_auth
def update_2fa_settings():
    """Enable or disable 2FA for the current user"""
    data = request.get_json()
    
    if not data or 'enabled' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    user_id = g.user_id
    enabled = data.get('enabled')
    
    response, status_code = auth_service.update_2fa_settings(user_id, enabled)
    return jsonify(response), status_code

@auth_bp.route('/settings/2fa/status', methods=['GET'])
@require_auth
def get_2fa_status():
    """Get 2FA status for the current user"""
    user_id = g.user_id
    
    # Get 2FA settings from the database
    settings = auth_service.appwrite_service.get_user_2fa_settings(user_id)
    
    return jsonify({
        'success': True,
        'enabled': settings.get('enabled', False)
    }), 200

@auth_bp.route('/settings/session-alerts', methods=['POST'])
@require_auth
def update_session_alerts():
    """Enable or disable session alerts for the current user"""
    data = request.get_json()
    
    if not data or 'enabled' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    user_id = g.user_id
    enabled = data.get('enabled')
    
    try:
        # Update user document
        auth_service.appwrite_service.database.update_document(
            database_id=auth_service.appwrite_service.database_id,
            collection_id=auth_service.appwrite_service.users_collection_id,
            document_id=user_id,
            data={
                'sessionAlertsEnabled': enabled
            }
        )
        
        return jsonify({
            'success': True,
            'message': f"Session alerts {'enabled' if enabled else 'disabled'} successfully"
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500