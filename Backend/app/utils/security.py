import jwt
import datetime
from functools import wraps
from flask import current_app, request, jsonify
import uuid

def generate_token(user_id, token_type='auth', expiry_minutes=10):
    """Generate a JWT token with enhanced security"""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=expiry_minutes),
        'iat': datetime.datetime.utcnow(),
        'type': token_type,
        'jti': str(uuid.uuid4()),  # Add a unique ID to prevent token reuse
    }
    
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if (auth_header and auth_header.startswith('Bearer ')):
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['sub']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated