from .appwrite_service import AppwriteService

class ChatService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def send_message(self, sender_id, recipient_id, message):
        """Send a message from one user to another"""
        try:
            # Validate sender and recipient exist
            sender = self.appwrite_service.get_user(sender_id)
            recipient = self.appwrite_service.get_user(recipient_id)
            
            if not sender or not recipient:
                return {'success': False, 'message': 'Sender or recipient not found'}, 404
            
            # Create chat message
            chat = self.appwrite_service.create_chat(sender_id, recipient_id, message)
            
            return {
                'success': True,
                'message': 'Message sent',
                'chat': chat
            }, 201
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_user_chats(self, user_id, other_user_id=None):
        """Get chats for a user
        If other_user_id is provided, get conversation between two users
        """
        try:
            # Validate user exists
            user = self.appwrite_service.get_user(user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            if other_user_id:
                # Validate other user exists
                other_user = self.appwrite_service.get_user(other_user_id)
                if not other_user:
                    return {'success': False, 'message': 'Other user not found'}, 404
            
            # Get chats
            chats = self.appwrite_service.get_chats(user_id, other_user_id)
            
            return {
                'success': True,
                'chats': chats
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500