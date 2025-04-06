from .appwrite_service import AppwriteService

class UserService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def get_user_profile(self, user_id):
        """Get user profile information"""
        try:
            # Get user from Appwrite
            user = self.appwrite_service.get_user(user_id)
            
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            # Return user profile
            return {
                'success': True,
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name'],
                    'registration': user['registration'],
                    'avatar': user.get('avatar', None)
                }
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def update_user_profile(self, user_id, name=None, email=None):
        """Update user profile information"""
        try:
            # Update user in Appwrite
            user = self.appwrite_service.update_user(user_id, name, email)
            
            # Return updated user profile
            return {
                'success': True,
                'message': 'Profile updated successfully',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name']
                }
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500