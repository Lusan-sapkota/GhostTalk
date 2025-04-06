from flask import Blueprint, request, jsonify
from ..services.room_service import RoomService
from ..utils.security import token_required

room_bp = Blueprint('room', __name__)
room_service = RoomService()

@room_bp.route('/create', methods=['POST'])
@token_required
def create_room(current_user_id):
    """Create a new chat room"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
    
    # Validate required fields
    required_fields = ['name']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    name = data.get('name')
    description = data.get('description', '')
    is_private = data.get('isPrivate', False)
    require_login = data.get('requireLogin', True)
    chat_type = data.get('chatType', 'discussion')
    
    response, status_code = room_service.create_room(
        name, current_user_id, description, is_private, require_login, chat_type
    )
    return jsonify(response), status_code

@room_bp.route('/public', methods=['GET'])
def get_public_rooms():
    """Get all public rooms"""
    response, status_code = room_service.get_rooms(is_private=False)
    return jsonify(response), status_code

@room_bp.route('/private', methods=['GET'])
@token_required
def get_private_rooms(current_user_id):
    """Get private rooms for current user"""
    response, status_code = room_service.get_rooms(is_private=True, user_id=current_user_id)
    return jsonify(response), status_code

@room_bp.route('/all', methods=['GET'])
@token_required
def get_all_rooms(current_user_id):
    """Get all rooms (both public and private) for current user"""
    response, status_code = room_service.get_rooms(user_id=current_user_id)
    return jsonify(response), status_code