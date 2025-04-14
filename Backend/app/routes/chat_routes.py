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

@chat_bp.route('/private/send', methods=['POST'])
@token_required
def send_private_message(current_user_id):
    """Send a private message to another user"""
    data = request.get_json()
    
    if not data or 'recipientId' not in data or 'content' not in data:
        return jsonify({'success': False, 'message': 'Missing required data'}), 400
    
    recipient_id = data.get('recipientId')
    content = data.get('content')
    is_ghost = data.get('isGhost', False)
    ghost_duration = data.get('ghostDuration')
    message_type = data.get('type', 'text')
    media_url = data.get('mediaUrl')
    
    response, status_code = chat_service.send_private_message(
        current_user_id, recipient_id, content, is_ghost, ghost_duration, message_type, media_url
    )
    
    return jsonify(response), status_code

@chat_bp.route('/private/history/<recipient_id>', methods=['GET'])
@token_required
def get_private_chat_history(current_user_id, recipient_id):
    """Get chat history with another user"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    response, status_code = chat_service.get_private_chat_history(
        current_user_id, recipient_id, limit, offset
    )
    
    return jsonify(response), status_code

@chat_bp.route('/message/read', methods=['POST'])
@token_required
def mark_as_read(current_user_id):
    """Mark a message as read"""
    data = request.get_json()
    
    if not data or 'messageId' not in data:
        return jsonify({'success': False, 'message': 'Missing message ID'}), 400
    
    message_id = data.get('messageId')
    
    response, status_code = chat_service.mark_message_as_read(message_id)
    return jsonify(response), status_code

@chat_bp.route('/call/initiate', methods=['POST'])
@token_required
def initiate_call(current_user_id):
    """Initiate an audio call with another user"""
    data = request.get_json()
    
    if not data or 'recipientId' not in data:
        return jsonify({'success': False, 'message': 'Missing recipient ID'}), 400
    
    recipient_id = data.get('recipientId')
    
    response, status_code = chat_service.initiate_audio_call(current_user_id, recipient_id)
    return jsonify(response), status_code