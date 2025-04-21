from flask import Blueprint, jsonify, request
from ..utils.security import token_required
import traceback

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['GET', 'OPTIONS'])
def notifications_route():
    """Handle OPTIONS requests separately for CORS"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://192.168.18.2:8100')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    return get_notifications()

@token_required
def get_notifications(current_user_id=None):
    try:
        # For now, return an empty array
        notifications = []
        
        return jsonify({
            'success': True, 
            'notifications': notifications
        })
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'An error occurred'}), 500