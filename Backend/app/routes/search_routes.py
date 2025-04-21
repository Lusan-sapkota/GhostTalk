from flask import Blueprint, request, jsonify
from ..services.appwrite_service import AppwriteService
from ..utils.security import token_required
import os
from datetime import datetime

def format_date(date_string):
    """Format a date string into a readable format"""
    if not date_string:
        return ""
    try:
        # Assuming the date string is in ISO format
        date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return date_obj.strftime("%B %d, %Y")
    except Exception:
        return date_string

search_bp = Blueprint('search', __name__)
appwrite_service = AppwriteService()

@search_bp.route('/users', methods=['GET'])
def search_users():
    """Search for users by username or ID"""
    search_query = request.args.get('q', '')
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    if not search_query or len(search_query.strip()) < 2:
        return jsonify({
            'success': False,
            'message': 'Search query must be at least 2 characters',
            'users': []
        }), 400
    
    try:
        # Get the current user ID from token if available
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        if (auth_header and auth_header.startswith('Bearer ')):
            from ..utils.security import decode_token
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if payload and 'sub' in payload:
                current_user_id = payload['sub']
        
        print(f"*** Starting search for '{search_query}' ***")
        
        # Try the regular search first
        users = appwrite_service.search_users(search_query, limit, offset)
        
        # If no results, try the basic search as fallback
        if not users:
            print("No results from primary search, trying basic search...")
            users = appwrite_service.basic_search_users(search_query, limit, offset)
        
        # Add friendship status for each user if the user is authenticated
        if current_user_id:
            for user in users:
                # Check if they are friends
                user['isAdded'] = appwrite_service.check_friendship(current_user_id, user['id'])
                
                # Don't include the current user in results
                if user['id'] == current_user_id:
                    user['isCurrentUser'] = True
        
        print(f"*** Search complete. Found {len(users)} users ***")
        
        return jsonify({
            'success': True,
            'users': users,
            'total': len(users),
            'query': search_query
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Search failed: {str(e)}',
            'users': []
        }), 500

@search_bp.route('/by-id/<string:user_id>', methods=['GET'])
@token_required
def search_by_id(current_user_id, user_id):
    """Search for a user by their ID"""
    try:
        appwrite_service._initialize_client()
        
        # Get user document
        user_doc = appwrite_service.get_user_document(user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Check if user has enableSearch set to false
        if not user_doc.get('enableSearch', True) and user_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'User has disabled search visibility'
            }), 404
        
        # Format user data with proper visibility
        user = {
            'id': user_id,
            'name': user_doc.get('username') or user_doc.get('name', 'Unknown User'),
            'proStatus': user_doc.get('proStatus', 'free'),
            'isVerified': user_doc.get('isVerified', False),
            'isOnline': user_doc.get('isOnline', False),
            'lastSeen': user_doc.get('lastSeen', 0),
            'bio': user_doc.get('bio', ''),
            'email': user_doc.get('email', ''),
            'gender': user_doc.get('gender', 'prefer_not_to_say'),
            'memberSince': format_date(user_doc.get('registration', '')),
            'lastActive': user_doc.get('lastSeen', 0),
            
            # Include visibility settings
            'visibility': user_doc.get('visibility', 'limited'),
            'bioVisibility': user_doc.get('bioVisibility', 'public'),
            'memberSinceVisibility': user_doc.get('memberSinceVisibility', 'public'),
            'emailVisibility': user_doc.get('emailVisibility', 'private'),
            'genderVisibility': user_doc.get('genderVisibility', 'private'),
        }
        
        # Add avatar if available
        backend_url = os.environ.get('BACKEND_URL', 'http://192.168.18.2:5000/api')
        if user_doc.get('avatar'):
            user['avatar'] = f"{backend_url}/user/avatar/{user_doc.get('avatar')}"
            
        # Check if they are friends
        is_friend = appwrite_service.check_friendship(current_user_id, user_id)
        user['isAdded'] = is_friend
        
        return jsonify({
            'success': True,
            'user': user
        }), 200
    except Exception as e:
        print(f"Error searching user by ID: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500