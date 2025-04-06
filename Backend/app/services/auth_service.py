from werkzeug.security import generate_password_hash, check_password_hash
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
            hashed_password = generate_password_hash(password)
            user = self.appwrite_service.create_user(email, hashed_password, name)
            
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
            # Get user by email
            user = self.appwrite_service.get_user_by_email(email)
            
            if not user or not check_password_hash(user['password'], password):
                return {'success': False, 'message': 'Invalid email or password'}, 401
            
            # Generate token
            token = generate_token(user['$id'])
            
            return {
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name']
                },
                'token': token
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500