from flask import Blueprint, request, jsonify
from ..services.auth_service import AuthService

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
    
    response, status_code = auth_service.register_user(email, password, name)
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