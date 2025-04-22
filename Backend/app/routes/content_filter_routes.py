from flask import Blueprint, request, jsonify
from app.services.ghostguard_service import ghostguard_service
from ..utils.security import token_required  # Corrected import statement

content_filter_bp = Blueprint('content_filter', __name__)

@content_filter_bp.route('/check', methods=['POST'])
@token_required
def check_content(current_user_id):
    """Check content for inappropriate text without filtering it."""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'success': False, 'message': 'No text provided'}), 400
    
    text = data.get('text', '')
    is_inappropriate, confidence = ghostguard_service.contains_inappropriate_content(text)
    
    return jsonify({
        'success': True,
        'inappropriate': is_inappropriate,
        'confidence': float(confidence)
    })

@content_filter_bp.route('/filter', methods=['POST'])
@token_required
def filter_content(current_user_id):
    """Filter inappropriate content from text."""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'success': False, 'message': 'No text provided'}), 400
    
    text = data.get('text', '')
    filtered_text, is_inappropriate, confidence = ghostguard_service.filter_message(text)
    
    return jsonify({
        'success': True,
        'original': text,
        'filtered': filtered_text,
        'inappropriate': is_inappropriate,
        'confidence': float(confidence)
    })

@content_filter_bp.route('/train', methods=['POST'])
@token_required
def train_model(current_user_id):
    """Train the content filter model with custom data (admin only)."""
    # Check if user has admin privileges
    data = request.get_json()
    
    if not data or 'inappropriate' not in data or 'clean' not in data:
        return jsonify({
            'success': False, 
            'message': 'Missing training data. Need "inappropriate" and "clean" arrays.'
        }), 400
    
    inappropriate = data.get('inappropriate', [])
    clean = data.get('clean', [])
    
    if not inappropriate or not clean:
        return jsonify({
            'success': False, 
            'message': 'Training data arrays cannot be empty'
        }), 400
    
    # Create training data
    X = inappropriate + clean
    y = [1] * len(inappropriate) + [0] * len(clean)
    
    try:
        # Train model with custom data
        ghostguard_service._train_model(training_data=(X, y))
        return jsonify({'success': True, 'message': 'Model trained successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error training model: {str(e)}'}), 500