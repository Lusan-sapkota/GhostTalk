from .appwrite_service import AppwriteService

class RoomService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def create_room(self, name, creator_id, description="", is_private=False, require_login=True, chat_type='discussion'):
        """Create a new chat room"""
        try:
            # Validate creator exists
            creator = self.appwrite_service.get_user(creator_id)
            if not creator:
                return {'success': False, 'message': 'Creator not found'}, 404
            
            # Create room
            room = self.appwrite_service.create_room(name, creator_id, description, is_private, require_login, chat_type)
            
            return {
                'success': True,
                'message': 'Room created successfully',
                'room': room
            }, 201
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_rooms(self, is_private=None, user_id=None):
        """Get chat rooms
        If is_private is None, get all rooms
        If is_private is True, get only private rooms
        If is_private is False, get only public rooms
        If user_id is provided, only get rooms where user is a member (for private rooms)
        """
        try:
            rooms = self.appwrite_service.get_rooms(is_private, user_id)
            
            # Transform rooms into a more frontend-friendly format
            transformed_rooms = []
            for room in rooms:
                transformed_rooms.append({
                    'id': room['$id'],
                    'name': room['name'],
                    'description': room['description'],
                    'isPrivate': room['isPrivate'],
                    'requireLogin': room['requireLogin'],
                    'chatType': room['chatType'],
                    'creatorId': room['creatorId'],
                    'createdAt': room['createdAt'],
                    'lastActivity': room['lastActivity'],
                    'members': len(room['members']) if 'members' in room else 0
                })
            
            return {
                'success': True,
                'rooms': transformed_rooms
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500