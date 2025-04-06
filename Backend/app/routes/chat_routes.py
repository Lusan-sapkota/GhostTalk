from flask import Blueprint, request, jsonify
from ..services.chat_service import ChatService
from ..utils.security import token_required

chat_bp = Blueprint('chat', __name__)
chat_service = ChatService()

@chat_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user_id):
    """Send a message to another user"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
    
    # Validate required fields
    required_fields = ['recipientId', 'message']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    recipient_id = data.get('recipientId')
    message = data.get('message')
    
    response, status_code = chat_service.send_message(current_user_id, recipient_id, message)
    return jsonify(response), status_code

@chat_bp.route('/history/<string:other_user_id>', methods=['GET'])
@token_required
def get_chat_history(current_user_id, other_user_id):
    """Get chat history between current user and another user"""
    response, status_code = chat_service.get_user_chats(current_user_id, other_user_id)
    return jsonify(response), status_code

@chat_bp.route('/all', methods=['GET'])
@token_required
def get_all_chats(current_user_id):
    """Get all chats for the current user"""
    response, status_code = chat_service.get_user_chats(current_user_id)
    return jsonify(response), status_code