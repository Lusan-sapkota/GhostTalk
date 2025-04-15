from flask import Blueprint, request, jsonify, send_file, Response, redirect
from ..services.user_service import UserService
from ..services.appwrite_service import AppwriteService
from ..utils.security import token_required
import os
import qrcode
import io
import time

user_bp = Blueprint('user', __name__)
user_service = UserService()
appwrite_service = AppwriteService()

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get the user's profile"""
    response, status_code = user_service.get_user_profile(current_user_id)
    return jsonify(response), status_code

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update the user's profile (only bio is updatable)"""
    data = request.get_json()
    # Extract only the bio from the data
    update_data = {'bio': data.get('bio')} if 'bio' in data else {}
    response, status_code = user_service.update_user_profile(current_user_id, update_data)
    return jsonify(response), status_code

@user_bp.route('/profile/<string:user_id>', methods=['GET'])
@token_required
def get_user_profile(current_user_id, user_id):
    """Get another user's profile"""
    response, status_code = user_service.get_user_profile(user_id)
    return jsonify(response), status_code

@user_bp.route('/online-status', methods=['PUT'])
@token_required
def update_online_status(current_user_id):
    """Update user's online status"""
    data = request.get_json()
    is_online = data.get('isOnline', False)
    response, status_code = user_service.update_online_status(current_user_id, is_online)
    return jsonify(response), status_code

@user_bp.route('/avatars', methods=['GET'])
@token_required
def get_avatars(current_user_id):
    """Get available avatars"""
    try:
        # Get limit parameter with default of 1000 (high enough for all avatars)
        limit = request.args.get('limit', default=1000, type=int)
        
        bucket_id = os.environ.get('APPWRITE_STORAGE_ID_FREE_AVATAR')
        
        if not bucket_id:
            return jsonify({'success': False, 'message': 'Avatar bucket not configured'}), 500
        
        # Pass the limit to the get_avatars_from_bucket method
        avatars = appwrite_service.get_avatars_from_bucket(bucket_id, limit=limit)
        
        print(f"Returning {len(avatars)} avatars to client")
        
        return jsonify({
            'success': True,
            'avatars': avatars
        }), 200
    except Exception as e:
        print(f"Error getting avatars: {str(e)}")
        return jsonify({'success': False, 'message': f'Failed to get avatars: {str(e)}'}), 500

@user_bp.route('/avatar/select', methods=['PUT'])
@token_required
def select_avatar(current_user_id):
    """Select an avatar from the bucket"""
    data = request.get_json()
    avatar_id = data.get('avatarId')
    
    if not avatar_id:
        return jsonify({'success': False, 'message': 'No avatar ID provided'}), 400
    
    try:
        # Get bucket ID - use the free avatar bucket as default
        bucket_id = os.environ.get('APPWRITE_STORAGE_ID_FREE_AVATAR')
        
        # Re-initialize Appwrite client with admin API key to ensure we have write permissions
        appwrite_service._initialize_client(force=True)
        
        # Debug logs
        print(f"Updating user document with avatar: {avatar_id}")
        print(f"User ID: {current_user_id}")
        print(f"Bucket ID: {bucket_id}")
        
        # Get user document to see the current schema
        user_doc = appwrite_service.get_user_document(current_user_id)
        print(f"Current user document fields: {list(user_doc.keys())}")
        
        # Update user document with selected avatar ID - use correct field names from schema
        try:
            # Update the document in Auth collection
            appwrite_service.database.update_document(
                database_id=appwrite_service.database_id,
                collection_id=appwrite_service.users_collection_id,
                document_id=current_user_id,
                data={
                    'avatar': avatar_id,
                    'avatarId': bucket_id  # Use avatarId not avatarBucketId
                }
            )
            
            return jsonify({
                'success': True,
                'message': 'Avatar updated successfully',
                'avatar': avatar_id
            }), 200
        except Exception as db_error:
            print(f"Database update error: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': f'Database error: {str(db_error)}'}), 500
    except Exception as e:
        print(f"Error selecting avatar: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Failed to select avatar: {str(e)}'}), 500

@user_bp.route('/avatar/<string:avatar_id>', methods=['GET'])
def get_avatar(avatar_id):
    """Get user avatar by ID"""
    try:
        # Get the avatar bucket ID from environment
        avatar_bucket_id = os.environ.get('APPWRITE_STORAGE_ID_FREE_AVATAR')
        
        if not avatar_bucket_id:
            return jsonify({'success': False, 'message': 'Avatar bucket ID not configured'}), 500
        
        # Initialize Appwrite service
        appwrite_service._initialize_client()
        
        # Debug output
        print(f"Retrieving avatar {avatar_id} from bucket {avatar_bucket_id}")
        
        try:
            # Get file metadata first to determine mime type
            file_info = appwrite_service.storage.get_file(
                bucket_id=avatar_bucket_id,
                file_id=avatar_id
            )
            
            mime_type = file_info.get('mimeType', 'image/png')
            is_svg = 'svg' in mime_type.lower()
            
            # For SVG files, we'll get the raw content
            if is_svg:
                file_content = appwrite_service.storage.get_file_view(
                    bucket_id=avatar_bucket_id,
                    file_id=avatar_id
                )
                
                # Return the SVG content with appropriate headers
                return Response(
                    file_content,
                    mimetype='image/svg+xml',
                    headers={
                        'Content-Disposition': f'inline; filename=avatar-{avatar_id}.svg',
                        'Cache-Control': 'public, max-age=86400'
                    }
                )
            else:
                # For non-SVG files, use preview
                file_preview = appwrite_service.storage.get_file_preview(
                    bucket_id=avatar_bucket_id,
                    file_id=avatar_id,
                    width=200
                )
                
                # Return the preview image with appropriate headers
                return Response(
                    file_preview,
                    mimetype=mime_type,
                    headers={
                        'Content-Disposition': f'inline; filename=avatar-{avatar_id}.{mime_type.split("/")[1]}',
                        'Cache-Control': 'public, max-age=86400'
                    }
                )
        except Exception as preview_error:
            print(f"Error getting file content: {str(preview_error)}")
            
            # Fallback to redirect
            appwrite_endpoint = os.environ.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1')
            project_id = os.environ.get('APPWRITE_PROJECT_ID')
            file_url = f"{appwrite_endpoint}/storage/buckets/{avatar_bucket_id}/files/{avatar_id}/view?project={project_id}"
            return redirect(file_url)
    except Exception as e:
        print(f"Error retrieving avatar: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to retrieve avatar'}), 500

@user_bp.route('/qrcode/<string:user_id>', methods=['GET'])
@token_required
def generate_qr_code(current_user_id, user_id):
    """Generate QR code for user ID"""
    try:
        import qrcode
        import io
        import base64
        from flask import url_for
        
        # Generate QR code content - just the user ID with prefix
        qr_content = f"GHOST-{user_id}"
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Convert to base64 for direct embedding in HTML/CSS
        encoded = base64.b64encode(img_byte_arr.getvalue()).decode('ascii')
        qr_code_url = f"data:image/png;base64,{encoded}"
        
        return jsonify({
            'success': True,
            'qrCodeUrl': qr_code_url,
            'userId': user_id
        }), 200
    except Exception as e:
        print(f"Error generating QR code: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'message': f'Failed to generate QR code: {str(e)}'
        }), 500

@user_bp.route('/search-visibility', methods=['PUT'])
@token_required
def toggle_search_visibility(current_user_id):
    """Toggle the user's visibility in search results"""
    data = request.get_json()
    enable_search = data.get('enableSearch')
    
    if enable_search is None:
        return jsonify({'success': False, 'message': 'Missing enableSearch parameter'}), 400
    
    try:
        appwrite_service._initialize_client()
        result = appwrite_service.database.update_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.users_collection_id,
            document_id=current_user_id,
            data={'enableSearch': enable_search}
        )
        
        return jsonify({
            'success': True, 
            'message': f'Search visibility {"enabled" if enable_search else "disabled"}'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'Failed to update search visibility: {str(e)}'
        }), 500

@user_bp.route('/settings', methods=['GET'])
@token_required
def get_user_settings(current_user_id):
    """Get a user's privacy and security settings"""
    try:
        appwrite_service._initialize_client()
        
        # Get user document
        user_doc = appwrite_service.get_user_document(current_user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Extract settings from user document
        settings = {
            'requireMessageApproval': user_doc.get('requireMessageApproval', True),
            'enableSearch': user_doc.get('enableSearch', True),
            'readReceipts': user_doc.get('readReceipts', True),
            'genderVisibility': user_doc.get('genderVisibility', 'private'),
            'bioVisibility': user_doc.get('bioVisibility', 'public'),
            'emailVisibility': user_doc.get('emailVisibility', 'private'),
            'memberSinceVisibility': user_doc.get('memberSinceVisibility', 'public'),
            'favoritesRequest': user_doc.get('favoritesRequest', True),
            'twoFactorAuthEnabled': user_doc.get('2faEnabled', False),
            'chatRetention': user_doc.get('chatRetention', '30days'),
            'proStatus': user_doc.get('proStatus', 'free'),  # Add this line
            # Include device tokens count if needed
            'deviceCount': len(user_doc.get('deviceTokens', [])),
        }
        
        return jsonify({
            'success': True,
            'settings': settings
        }), 200
        
    except Exception as e:
        print(f"Error getting user settings: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to get settings: {str(e)}'
        }), 500

@user_bp.route('/settings', methods=['PUT'])
@token_required
def update_user_settings(current_user_id):
    """Update a user's privacy and security settings"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No settings provided'
            }), 400
        
        print(f"Received settings update data: {data}")  # Debug log
        
        appwrite_service._initialize_client()
        
        # Prepare update data
        update_data = {}
        
        # Boolean settings
        boolean_fields = [
            ('requireMessageApproval', 'requireMessageApproval'),
            ('enableSearch', 'enableSearch'),
            ('readReceipts', 'readReceipts'),
            ('favoritesRequest', 'favoritesRequest'),  # Note: singular in DB
            ('twoFactorAuthEnabled', '2faEnabled'),
            ('enableNotifications', 'enableNotifications'),
        ]
        
        for field_name, db_field in boolean_fields:
            if field_name in data:
                # Ensure boolean type
                update_data[db_field] = bool(data[field_name])
        
        # Enum settings
        enum_fields = [
            ('genderVisibility', 'genderVisibility'),
            ('bioVisibility', 'bioVisibility'),
            ('emailVisibility', 'emailVisibility'),
            ('memberSinceVisibility', 'memberSinceVisibility'),
            ('notificationsSounds', 'notificationsSounds'),
        ]
        
        for field_name, db_field in enum_fields:
            if field_name in data:
                # Ensure value is either 'public' or 'private'
                value = str(data[field_name]).lower()
                if value in ['public', 'private']:
                    update_data[db_field] = value
        
        # Other settings
        if 'chatRetention' in data:
            valid_retention = ['forever', '30days', '7days', '24hrs', '3hrs']
            if data['chatRetention'] in valid_retention:
                update_data['chatRetention'] = data['chatRetention']
        
        # Update user document
        if update_data:
            print(f"Updating user document with data: {update_data}")  # Debug log
            
            try:
                result = appwrite_service.database.update_document(
                    database_id=appwrite_service.database_id,
                    collection_id=appwrite_service.users_collection_id,
                    document_id=current_user_id,
                    data=update_data
                )
                
                print(f"Update result: {result}")  # Debug log
                
                return jsonify({
                    'success': True,
                    'message': 'Settings updated successfully'
                }), 200
            except Exception as db_error:
                print(f"Database error: {str(db_error)}")
                return jsonify({
                    'success': False,
                    'message': f'Database error: {str(db_error)}'
                }), 500
        else:
            return jsonify({
                'success': False,
                'message': 'No valid settings to update'
            }), 400
            
    except Exception as e:
        print(f"Error updating user settings: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to update settings: {str(e)}'
        }), 500

@user_bp.route('/devices', methods=['GET'])
@token_required
def get_logged_devices(current_user_id):
    """Get all devices where the user is logged in"""
    try:
        appwrite_service._initialize_client()
        
        # Get user document
        user_doc = appwrite_service.get_user_document(current_user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get active sessions
        active_sessions = user_doc.get('activeSessions', [])
        
        # Get current session ID
        current_session_id = request.headers.get('X-Session-ID')
        
        # Format device data
        devices = []
        for session in active_sessions:
            devices.append({
                'id': session.get('sessionId', ''),
                'name': session.get('deviceName', 'Unknown Device'),
                'type': session.get('deviceType', 'desktop'),
                'ip': session.get('ip', '0.0.0.0'),
                'location': session.get('location', 'Unknown'),
                'lastActive': session.get('lastActive', 'Never'),
                'isCurrent': session.get('sessionId') == current_session_id,
                'browser': session.get('browser', 'Unknown'),
                'os': session.get('os', 'Unknown')
            })
        
        return jsonify({
            'success': True,
            'devices': devices
        }), 200
        
    except Exception as e:
        print(f"Error getting logged devices: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to get devices: {str(e)}'
        }), 500

@user_bp.route('/devices/<device_id>/logout', methods=['POST'])
@token_required
def logout_device(current_user_id, device_id):
    """Log out from a specific device"""
    try:
        appwrite_service._initialize_client()
        
        # Get user document
        user_doc = appwrite_service.get_user_document(current_user_id)
        
        if not user_doc:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get active sessions and filter out the logged out session
        active_sessions = user_doc.get('activeSessions', [])
        updated_sessions = [s for s in active_sessions if s.get('sessionId') != device_id]
        
        # Update user document
        appwrite_service.database.update_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.users_collection_id,
            document_id=current_user_id,
            data={
                'activeSessions': updated_sessions
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Device logged out successfully'
        }), 200
        
    except Exception as e:
        print(f"Error logging out device: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to logout device: {str(e)}'
        }), 500

@user_bp.route('/app-rating', methods=['POST'])
@token_required
def track_app_rating(current_user_id):
    """Track that the user has rated the app"""
    try:
        appwrite_service._initialize_client()
        
        # Update user document
        appwrite_service.database.update_document(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.users_collection_id,
            document_id=current_user_id,
            data={
                'appRated': True,
                'lastPromptedRating': int(time.time())
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'App rating tracked successfully'
        }), 200
        
    except Exception as e:
        print(f"Error tracking app rating: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to track app rating: {str(e)}'
        }), 500

@user_bp.route('/push-token', methods=['POST'])
@token_required
def register_push_token(current_user_id):
    """Register a push notification token for the user"""
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({'success': False, 'message': 'Missing token'}), 400
        
        token = data.get('token')
        
        # Store the token in your database, associated with the user
        # For this example, we'll just print it
        print(f"Registering push token for user {current_user_id}: {token}")
        
        # In a real implementation, you would store this token in the user's document
        
        return jsonify({'success': True, 'message': 'Push token registered successfully'}), 200
    except Exception as e:
        print(f"Error registering push token: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'An error occurred'}), 500