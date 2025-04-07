from flask import Blueprint, request, jsonify
from ..services.auth_service import AuthService
from ..utils.name_generator import generate_random_name

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

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
    """Generate a random unique username"""
    username = generate_random_name()
    return jsonify({
        'success': True,
        'username': username
    }), 200

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
    
    token = data.get('token')
    response, status_code = auth_service.verify_magic_link(token)
    return jsonify(response), status_code

@auth_bp.route('/session-alert', methods=['POST'])
def session_alert():
    """Send an alert about new login session"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'sessionData' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    email = data.get('email')
    session_data = data.get('sessionData')
    response, status_code = auth_service.send_session_alert(email, session_data)
    return jsonify(response), status_code