from flask import Blueprint, request, jsonify, send_file
from ..services.user_service import UserService
from ..services.appwrite_service import AppwriteService
from ..utils.security import token_required
from werkzeug.utils import secure_filename
import os
import qrcode
import io
user_bp = Blueprint('user', __name__)
user_service = UserService()
appwrite_service = AppwriteService()
user_service = UserService()

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get the user's profile"""
    response, status_code = user_service.get_user_profile(current_user_id)
    return jsonify(response), status_code

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update the user's profile"""
    data = request.get_json()
    response, status_code = user_service.update_user_profile(current_user_id, data)
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

@user_bp.route('/avatar', methods=['POST'])
@token_required
def update_avatar(current_user_id):
    """Update user avatar"""
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['avatar']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if file:
        try:
            # Use Appwrite to store the avatar
            avatar_id = appwrite_service.upload_avatar(current_user_id, file)
            
            # Update user document with avatar ID
            user_service.update_user_profile(current_user_id, {'avatar': avatar_id})
            
            return jsonify({
                'success': True,
                'message': 'Avatar updated successfully',
                'avatar': avatar_id
            }), 200
        except Exception as e:
            print(f"Error updating avatar: {str(e)}")
            return jsonify({'success': False, 'message': 'Failed to update avatar'}), 500

@user_bp.route('/qrcode/<string:user_id>', methods=['GET'])
@token_required
def generate_qr_code(current_user_id, user_id):
    """Generate QR code for user ID"""
    # For security, only allow users to generate QR code for their own ID
    if current_user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        # Generate QR code with user ID
        qr_content = f"GHOST-{user_id}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to bytes
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        # Return image
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        print(f"Error generating QR code: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to generate QR code'}), 500