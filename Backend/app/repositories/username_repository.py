from flask import current_app
from ..services.appwrite_service import AppwriteService

class UsernameRepository:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def is_username_taken(self, username):
        """Check if username already exists in the database"""
        try:
            current_app.logger.debug(f"Checking if username '{username}' is taken")
            
            # Assume we have a users collection
            result = self.appwrite_service.database.list_documents(
                current_app.config['APPWRITE_USERS_COLLECTION'],
                [f"username={username}"]
            )
            
            # Log the result
            is_taken = result and result.get('total', 0) > 0
            current_app.logger.debug(f"Username '{username}' taken status: {is_taken}")
            
            # If we find any users, username is taken
            return is_taken
        except Exception as e:
            current_app.logger.error(f"Error checking username: {str(e)}")
            # Add detailed error info
            import traceback
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            
            # If we can't check, assume it's not taken (safer to be unique)
            return False