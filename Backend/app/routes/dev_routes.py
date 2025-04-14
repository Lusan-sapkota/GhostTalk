from flask import Blueprint, jsonify
from ..utils.security import token_required
from ..services.appwrite_service import AppwriteService
from ..services.user_service import UserService
from appwrite.query import Query
appwrite_service = AppwriteService()
user_service = UserService()
import os

dev_bp = Blueprint('dev', __name__)

@dev_bp.route('/debug/user/<string:user_id>', methods=['GET'])
@token_required
def debug_user_info(current_user_id, user_id):
    """Debug endpoint to view raw user data (only accessible to the user themselves)"""
    if current_user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        # Get raw user document from Appwrite
        user_doc = appwrite_service.get_user_document(user_id)
        
        # Compare with user auth data
        user_auth = appwrite_service.get_user(user_id)
        
        # Environment info for context
        env_info = {
            'AVATAR_BUCKET_ID': os.environ.get('AVATAR_BUCKET_ID'),
            'API_BASE_URL': os.environ.get('API_BASE_URL')
        }
        
        return jsonify({
            'success': True,
            'user_document': user_doc,
            'auth_user': user_auth,
            'environment': env_info
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@dev_bp.route('/users/debug', methods=['GET'])
def debug_users():
    """Developer route to debug user data (temporary, remove in production)"""
    try:
        # Get a sample of users to check field names
        appwrite_service._initialize_client()
        result = appwrite_service.database.list_documents(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.users_collection_id,
            queries=[Query.limit(5)]
        )
        
        users = result.get('documents', [])
        
        # Analyze field names and formats to debug search issues
        field_stats = {}
        for user in users:
            for key, value in user.items():
                if key not in field_stats:
                    field_stats[key] = {
                        'type': type(value).__name__,
                        'example': value
                    }
        
        # Show username availability and format
        usernames = [user.get('username', 'N/A') for user in users]
        
        # Build a safe response excluding sensitive data
        return jsonify({
            'success': True,
            'message': 'This is a debug endpoint - remove in production',
            'user_count': result.get('total', 0),
            'field_structure': field_stats,
            'username_samples': usernames,
            'common_fields': [key for key in field_stats.keys()]
        }), 200
    except Exception as e:
        print(f"Error in debug route: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Debug error: {str(e)}'
        }), 500

@dev_bp.route('/debug/user-settings/<string:user_id>', methods=['GET'])
def debug_user_settings(user_id):
    """Debug route to check user settings - remove in production"""
    try:
        appwrite_service._initialize_client()
        
        # Get user document
        user_doc = appwrite_service.get_user_document(user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get all settings-related fields
        settings_fields = [
            'requireMessageApproval', 
            'enableSearch', 
            'readReceipts',
            'genderVisibility', 
            'bioVisibility', 
            'emailVisibility', 
            'memberSinceVisibility',
            'favoritesRequest', 
            '2faEnabled', 
            'chatRetention',
            'deviceTokens'
        ]
        
        # Extract only the settings fields for security
        settings_data = {}
        for field in settings_fields:
            if field in user_doc:
                settings_data[field] = user_doc[field]
            else:
                settings_data[field] = f"NOT FOUND (default will be used)"
        
        return jsonify({
            'success': True,
            'message': 'Debug info - remove in production',
            'settings': settings_data,
            'all_fields': list(user_doc.keys())
        }), 200
        
    except Exception as e:
        print(f"Error in debug route: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Debug error: {str(e)}'
        }), 500