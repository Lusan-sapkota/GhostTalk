import time
import random
import string
from flask import current_app
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.avatars import Avatars
from ..utils.name_generator import generate_random_name

class AppwriteService:
    def __init__(self):
        """Initialize Appwrite client and services"""
        self.client = None
        self.users = None
        self.database = None
        self.storage = None
        self.avatars = None
        self.database_id = None
        self.users_collection_id = None
        self.chats_collection_id = None
        self.rooms_collection_id = None
    
    def _initialize_client(self):
        """Initialize the Appwrite client and services when needed"""
        if self.client is None:
            self.client = Client()
            self.client.set_endpoint(current_app.config['APPWRITE_ENDPOINT'])
            self.client.set_project(current_app.config['APPWRITE_PROJECT_ID'])
            self.client.set_key(current_app.config['APPWRITE_API_KEY'])
            
            # Initialize services
            self.users = Users(self.client)
            self.database = Databases(self.client)
            self.storage = Storage(self.client)
            self.avatars = Avatars(self.client)
            
            # Database IDs
            self.database_id = 'ghosttalk-db'  # Consider moving to config
            self.users_collection_id = current_app.config['APPWRITE_COLLECTION_ID_AUTH']
            self.chats_collection_id = current_app.config['APPWRITE_COLLECTION_ID_CHATS']
            self.rooms_collection_id = current_app.config['APPWRITE_COLLECTION_ID_CHAT_ROOMS']
    
    def create_user(self, email, password, name=None):
        """Create a new Appwrite user"""
        self._initialize_client()
        try:
            # Generate random name if not provided
            if not name:
                name = generate_random_name()
                
            user_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create the user in Appwrite
            user = self.users.create(
                user_id=user_id,
                email=email,
                password=password,
                name=name
            )
            
            # Create user profile document
            self.database.create_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'userId': user_id,
                    'name': name,
                    'email': email,
                    'createdAt': int(time.time()),
                    'avatar': self.avatars.get_initials(name=name).get_url()
                }
            )
            
            return user
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise e
    
    def login_user(self, email, password):
        """Login user with email and password"""
        self._initialize_client()
        try:
            session = self.users.create_session(email=email, password=password)
            user = self.get_user(session['userId'])
            return {'session': session, 'user': user}
        except Exception as e:
            print(f"Error logging in: {str(e)}")
            raise e

    def get_user(self, user_id):
        """Get a user by their ID"""
        self._initialize_client()
        try:
            return self.users.get(user_id)
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Get a user by their email address"""
        self._initialize_client()
        try:
            # List users with this email
            users = self.users.list(
                queries=[f'email={email}']
            )
            
            if users['total'] > 0:
                return users['users'][0]
            return None
        except Exception as e:
            print(f"Error getting user by email: {str(e)}")
            return None
    
    def update_user(self, user_id, name=None, email=None):
        """Update user information"""
        self._initialize_client()
        try:
            updates = {}
            if name is not None:
                updates['name'] = name
            if email is not None:
                updates['email'] = email
                
            if updates:
                return self.users.update(user_id, **updates)
            return self.get_user(user_id)
        except Exception as e:
            print(f"Error updating user: {str(e)}")
            raise e
            
    def create_chat(self, sender_id, recipient_id, message):
        """Create a new chat message"""
        self._initialize_client()
        try:
            chat_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create chat document
            chat = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.chats_collection_id,
                document_id=chat_id,
                data={
                    'senderId': sender_id,
                    'recipientId': recipient_id,
                    'message': message,
                    'timestamp': int(time.time()),
                    'read': False
                }
            )
            
            return chat
        except Exception as e:
            print(f"Error creating chat: {str(e)}")
            raise e
    
    def get_chats(self, user_id, other_user_id=None):
        """Get chat messages between users
        If other_user_id is None, get all chats for the user"""
        self._initialize_client()
        try:
            query = []
            if other_user_id:
                # Get chats between two specific users
                query = [
                    f'(senderId={user_id} && recipientId={other_user_id}) || (senderId={other_user_id} && recipientId={user_id})'
                ]
            else:
                # Get all chats where user is sender or recipient
                query = [
                    f'senderId={user_id} || recipientId={user_id}'
                ]
                
            chats = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.chats_collection_id,
                queries=query,
                order_field='timestamp',
                order_type='ASC'
            )
            
            return chats['documents']
        except Exception as e:
            print(f"Error getting chats: {str(e)}")
            return []
    
    def create_room(self, name, creator_id, description="", is_private=False, require_login=True, chat_type='discussion'):
        """Create a new chat room"""
        self._initialize_client()
        try:
            room_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create room document
            room = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.rooms_collection_id,
                document_id=room_id,
                data={
                    'name': name,
                    'description': description,
                    'creatorId': creator_id,
                    'isPrivate': is_private,
                    'requireLogin': require_login,
                    'chatType': chat_type,
                    'createdAt': int(time.time()),
                    'members': [creator_id],
                    'lastActivity': int(time.time())
                }
            )
            
            return room
        except Exception as e:
            print(f"Error creating room: {str(e)}")
            raise e
    
    def get_rooms(self, is_private=None, user_id=None):
        """Get chat rooms
        If is_private is None, get all rooms
        If is_private is True, get only private rooms
        If is_private is False, get only public rooms
        If user_id is provided, only get rooms where user is a member (for private rooms)
        """
        self._initialize_client()
        try:
            queries = []
            
            if is_private is not None:
                queries.append(f'isPrivate={str(is_private).lower()}')
            
            if is_private and user_id:
                # For private rooms, check if user is a member
                queries.append(f'members.{user_id}=*')
            
            rooms = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.rooms_collection_id,
                queries=queries,
                order_field='lastActivity',
                order_type='DESC'
            )
            
            return rooms['documents']
        except Exception as e:
            print(f"Error getting rooms: {str(e)}")
            return []