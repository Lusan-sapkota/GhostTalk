from flask import Blueprint, request, jsonify
from ..services.friend_service import FriendService
from ..utils.security import token_required

friend_bp = Blueprint('friend', __name__)
friend_service = FriendService()

@friend_bp.route('/request/send', methods=['POST'])
@token_required
def send_friend_request(current_user_id):
    """Send a friend request to another user"""
    data = request.get_json()
    
    if not data or 'userId' not in data:
        return jsonify({'success': False, 'message': 'Missing user ID'}), 400
    
    recipient_id = data.get('userId')
    
    response, status_code = friend_service.send_request(current_user_id, recipient_id)
    return jsonify(response), status_code

@friend_bp.route('/request/accept', methods=['POST'])
@token_required
def accept_friend_request(current_user_id):
    """Accept a friend request"""
    data = request.get_json()
    
    if not data or 'requestId' not in data:
        return jsonify({'success': False, 'message': 'Missing request ID'}), 400
    
    request_id = data.get('requestId')
    
    response, status_code = friend_service.accept_request(request_id, current_user_id)
    return jsonify(response), status_code

@friend_bp.route('/request/reject', methods=['POST'])
@token_required
def reject_friend_request(current_user_id):
    """Reject a friend request"""
    data = request.get_json()
    
    if not data or 'requestId' not in data:
        return jsonify({'success': False, 'message': 'Missing request ID'}), 400
    
    request_id = data.get('requestId')
    
    response, status_code = friend_service.reject_request(request_id, current_user_id)
    return jsonify(response), status_code

@friend_bp.route('/list', methods=['GET'])
@token_required
def get_friends_list(current_user_id):
    """Get user's friends list"""
    response, status_code = friend_service.get_friends(current_user_id)
    return jsonify(response), status_code

@friend_bp.route('/requests', methods=['GET'])
@token_required
def get_friend_requests(current_user_id):
    """Get pending friend requests"""
    response, status_code = friend_service.get_pending_requests(current_user_id)
    return jsonify(response), status_code