from flask import Blueprint, request, jsonify
from ..services.appwrite_service import AppwriteService
from ..utils.security import token_required
import os

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

@search_bp.route('/by-id/<user_id>', methods=['GET'])
def search_by_id(user_id):
    """Get a user by their exact ID - useful for QR scanning"""
    if not user_id:
        return jsonify({
            'success': False,
            'message': 'User ID is required',
            'user': None
        }), 400
    
    # Clean up ID from QR format if needed
    if user_id.startswith('GHOST-'):
        user_id = user_id[6:]
    
    try:
        # Get user document
        user_doc = appwrite_service.get_user_document(user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found',
                'user': None
            }), 404
        
        # Check if user allows being searched
        if user_doc.get('enableSearch') == False:
            return jsonify({
                'success': False,
                'message': 'This user has disabled search visibility',
                'user': None
            }), 403
        
        # Format user data
        backend_base_url = os.environ.get('BACKEND_URL', 'http://localhost:5000/api')
        user_data = {
            'id': user_doc.get('userId', user_doc.get('$id')),
            'name': user_doc.get('username', 'Unknown User'),
            'proStatus': user_doc.get('proStatus', 'free'),
            'isVerified': user_doc.get('isVerified', False),
            'isOnline': user_doc.get('isOnline', False),
            'lastSeen': user_doc.get('lastSeen', 0)
        }
        
        # Add avatar if available
        if user_doc.get('avatar'):
            user_data['avatar'] = f"{backend_base_url}/user/avatar/{user_doc.get('avatar')}"
        
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error fetching user: {str(e)}',
            'user': None
        }), 500