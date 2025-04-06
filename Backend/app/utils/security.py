import jwt
import datetime
from flask import current_app, request
from functools import wraps

def generate_token(user_id):
    """Generate JWT token for authentication"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES']),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        
        if not token:
            return {'message': 'Authentication token is missing'}, 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['sub']
        except jwt.ExpiredSignatureError:
            return {'message': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid token'}, 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated