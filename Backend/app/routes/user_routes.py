from flask import Blueprint, request, jsonify
from ..services.user_service import UserService
from ..utils.security import token_required

user_bp = Blueprint('user', __name__)
user_service = UserService()

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get current user's profile"""
    response, status_code = user_service.get_user_profile(current_user_id)
    return jsonify(response), status_code

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update current user's profile"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
    
    name = data.get('name')
    email = data.get('email')
    
    response, status_code = user_service.update_user_profile(current_user_id, name, email)
    return jsonify(response), status_code

@user_bp.route('/profile/<string:user_id>', methods=['GET'])
@token_required
def get_user_profile(current_user_id, user_id):
    """Get another user's profile"""
    response, status_code = user_service.get_user_profile(user_id)
    return jsonify(response), status_code