from werkzeug.security import check_password_hash, generate_password_hash
from .appwrite_service import AppwriteService
from ..utils.security import generate_token

class AuthService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def register_user(self, email, password, name=None):
        """Register a new user"""
        try:
            # Check if user exists
            existing_user = self.appwrite_service.get_user_by_email(email)
            if existing_user:
                return {'success': False, 'message': 'Email already registered'}, 400
            
            # Create user
            user = self.appwrite_service.create_user(email, password, name)
            
            # Generate token
            token = generate_token(user['$id'])
            
            return {
                'success': True,
                'message': 'User registered successfully',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name']
                },
                'token': token
            }, 201
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def login_user(self, email, password):
        """Login a user"""
        try:
            # Try to login with Appwrite
            result = self.appwrite_service.login_user(email, password)
            
            # Generate JWT token
            token = generate_token(result['user']['$id'])
            
            return {
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': result['user']['$id'],
                    'email': result['user']['email'],
                    'name': result['user']['name']
                },
                'token': token
            }, 200
        except Exception as e:
            return {'success': False, 'message': 'Invalid email or password'}, 401