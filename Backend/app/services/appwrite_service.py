import time
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.avatars import Avatars
from flask import current_app
import random
import string
from ..utils.name_generator import generate_random_name

class AppwriteService:
    def __init__(self):
        """Initialize Appwrite client and services"""
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
        self.database_id = 'ghosttalk-db'
        self.APPWRITE_COLLECTION_ID_AUTH = current_app.config['APPWRITE_COLLECTION_ID_AUTH']
        self.APPWRITE_COLLECTION_ID_CHATS = current_app.config['APPWRITE_COLLECTION_ID_CHATS']
        self.APPWRITE_COLLECTION_ID_CHAT_ROOMS = current_app.config['APPWRITE_COLLECTION_ID_CHAT_ROOMS']
    
    def create_user(self, email, password, name=None):
        """Create a new Appwrite user"""
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
                collection_id=self.APPWRITE_COLLECTION_ID_AUTH,
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

    def get_user(self, user_id):
        """Get a user by their ID"""
        try:
            return self.users.get(user_id)
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Get a user by their email address"""
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
            
    def create_chat(self, sender_id, recipient_id, message):
        """Create a new chat message"""
        try:
            chat_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create chat document
            chat = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.APPWRITE_COLLECTION_ID_CHATS,
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
    
    def get_chats(self, user_id, other_user_id):
        """Get chat messages between two users"""
        try:
            # Get chats where user is sender or recipient
            chats = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.APPWRITE_COLLECTION_ID_CHATS,
                queries=[
                    f'(senderId={user_id} && recipientId={other_user_id}) || (senderId={other_user_id} && recipientId={user_id})'
                ],
                order_field='timestamp',
                order_type='ASC'
            )
            
            return chats['documents']
        except Exception as e:
            print(f"Error getting chats: {str(e)}")
            return []
    
    def create_room(self, name, creator_id, is_private=False):
        """Create a new chat room"""
        try:
            room_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create room document
            room = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.APPWRITE_COLLECTION_ID_CHAT_ROOMS,
                document_id=room_id,
                data={
                    'name': name,
                    'creatorId': creator_id,
                    'isPrivate': is_private,
                    'createdAt': int(time.time()),
                    'members': [creator_id]
                }
            )
            
            return room
        except Exception as e:
            print(f"Error creating room: {str(e)}")
            raise e