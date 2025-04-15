from flask import Blueprint, request, jsonify
from ..services.friend_service import FriendService
from ..services.user_service import UserService
from ..services.websocket_service import socketio
from ..utils.security import token_required
import traceback

friend_bp = Blueprint('friend', __name__)
friend_service = FriendService()
user_service = UserService()

@friend_bp.route('/request/send', methods=['POST'])
@token_required
def send_friend_request(current_user_id):
    try:
        data = request.get_json()
        recipient_id = data.get('userId')
        
        if not recipient_id:
            return jsonify({'success': False, 'message': 'Missing recipient ID'}), 400
            
        # Create the friend request
        response, status_code = friend_service.send_request(current_user_id, recipient_id)
        
        if status_code == 200 and response.get('success'):
            # Get the request ID from the response
            request_id = response.get('requestId')
            
            try:
                # Get sender info - handle potential errors
                sender = user_service.get_user_by_id(current_user_id)
                sender_name = "Someone"  # Default name
                
                if sender:
                    sender_name = sender.get('username') or sender.get('name', 'Someone')
                
                # Send notification through socketio directly
                socketio.emit('friend_request', {
                    'senderId': current_user_id,
                    'senderName': sender_name,
                    'requestId': str(request_id),
                    'type': 'friend_request'
                }, room=recipient_id, namespace='/')  # Add namespace
                
                # Also emit a general notification
                socketio.emit('notification', {
                    'type': 'friendRequest',
                    'title': 'New Friend Request',
                    'message': f"{sender_name} sent you a friend request",
                    'metadata': {
                        'requestId': str(request_id),
                        'senderId': current_user_id
                    }
                }, room=recipient_id, namespace='/')  # Add namespace
                
                print(f"Friend request notification sent successfully to {recipient_id}")
            except Exception as e:
                # Log notification error but still return success for the request itself
                print(f"Error sending notification: {str(e)}")
                traceback.print_exc()
        
        return jsonify(response), status_code
        
    except Exception as e:
        print(f"Error sending friend request: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'An error occurred while sending friend request'}), 500

@friend_bp.route('/request/accept', methods=['POST'])
@token_required
def accept_friend_request(current_user_id):
    """Accept a friend request"""
    try:
        data = request.get_json()
        
        if not data or 'requestId' not in data:
            return jsonify({'success': False, 'message': 'Missing request ID'}), 400
        
        request_id = data.get('requestId')
        
        # Accept the request
        response, status_code = friend_service.accept_request(request_id, current_user_id)
        
        # If successful, send a notification to the sender
        if status_code == 200 and response.get('success'):
            try:
                # Get the sender ID from the response
                sender_id = response.get('senderId')
                
                if sender_id:
                    # Get current user info
                    current_user = user_service.get_user_by_id(current_user_id)
                    current_user_name = current_user.get('username') or 'Someone'
                    
                    print(f"Sending friend_request_accepted notification to {sender_id}")
                    
                    # Emit event specifically for friend request acceptance
                    socketio.emit('friend_request', {
                        'type': 'friend_request_accepted',
                        'userName': current_user_name,
                        'userId': current_user_id,
                        'requestId': str(request_id)
                    }, room=sender_id)
                    
                    # Also emit a general notification
                    socketio.emit('notification', {
                        'type': 'friendRequestAccepted',
                        'title': 'Friend Request Accepted',
                        'message': f"{current_user_name} accepted your friend request",
                        'metadata': {
                            'userId': current_user_id
                        }
                    }, room=sender_id)
                    
                    print(f"Friend request acceptance notification sent to {sender_id}")
            except Exception as e:
                print(f"Error sending acceptance notification: {str(e)}")
                traceback.print_exc()
        
        return jsonify(response), status_code
        
    except Exception as e:
        print(f"Error accepting friend request: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'An error occurred while accepting friend request'}), 500

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

@friend_bp.route('/request/cancel', methods=['POST'])
@token_required
def cancel_friend_request(current_user_id):
    """Cancel a sent friend request"""
    data = request.get_json()
    
    if not data or 'requestId' not in data:
        return jsonify({'success': False, 'message': 'Missing request ID'}), 400
    
    request_id = data.get('requestId')
    
    response, status_code = friend_service.cancel_request(request_id, current_user_id)
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

@friend_bp.route('/remove', methods=['POST'])
@token_required
def remove_friend(current_user_id):
    """Remove a friend"""
    data = request.get_json()
    
    if not data or 'userId' not in data:
        return jsonify({'success': False, 'message': 'Missing user ID'}), 400
    
    friend_id = data.get('userId')
    
    # Don't allow removing self
    if friend_id == current_user_id:
        return jsonify({'success': False, 'message': 'Cannot remove yourself as a friend'}), 400
    
    # Remove friend
    response, status_code = friend_service.remove_friend(current_user_id, friend_id)
    return jsonify(response), status_code