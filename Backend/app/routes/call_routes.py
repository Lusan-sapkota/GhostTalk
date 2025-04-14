from flask import Blueprint, request, jsonify
from ..services.call_service import CallService
from ..utils.security import token_required

call_bp = Blueprint('call', __name__)
call_service = CallService()

@call_bp.route('/initiate', methods=['POST'])
@token_required
def initiate_call(current_user_id):
    """Initiate an audio call with another user"""
    data = request.get_json()
    
    if not data or 'recipientId' not in data:
        return jsonify({'success': False, 'message': 'Missing recipient ID'}), 400
    
    recipient_id = data.get('recipientId')
    
    response, status_code = call_service.initiate_call(current_user_id, recipient_id, 'audio')
    return jsonify(response), status_code

@call_bp.route('/end', methods=['POST'])
@token_required
def end_call(current_user_id):
    """End an ongoing call"""
    data = request.get_json()
    
    if not data or 'callId' not in data:
        return jsonify({'success': False, 'message': 'Missing call ID'}), 400
    
    call_id = data.get('callId')
    
    response, status_code = call_service.end_call(call_id, current_user_id)
    return jsonify(response), status_code