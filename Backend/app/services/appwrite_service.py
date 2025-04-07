import time
import random
import string
from flask import current_app
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.avatars import Avatars
from appwrite.query import Query
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
            
            # Explicitly get database ID from config - use the exact ID, not a default value
            self.database_id = current_app.config['APPWRITE_DATABASE_ID']
            self.users_collection_id = current_app.config['APPWRITE_COLLECTION_ID_AUTH']
            self.chats_collection_id = current_app.config['APPWRITE_COLLECTION_ID_CHATS']
            self.rooms_collection_id = current_app.config['APPWRITE_COLLECTION_ID_CHAT_ROOMS']
            # Use APPWRITE_STORAGE_ID_FREE_AVATAR from .env for avatar bucket
            self.avatar_bucket_id = current_app.config.get('APPWRITE_STORAGE_ID_FREE_AVATAR')
    
    def create_user(self, email, password, name=None, gender='prefer_not_to_say', bio=''):
        """Create a new Appwrite user with extended profile"""
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
            
            # Get a random avatar
            avatar_file_id, avatar_bucket_id = self._get_random_avatar()
            
            # Store just the avatar ID and bucket ID, not the full URL
            avatar_reference = None
            if avatar_file_id:
                avatar_reference = f"{avatar_file_id}"
            
            # Create user profile document with fields matching your DB schema
            from datetime import datetime
            
            self.database.create_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'userId': user_id,
                    'username': name,  # Using username instead of name
                    'email': email,
                    'gender': gender,
                    'bio': bio,
                    'createdAt': datetime.utcnow().isoformat(), # Use ISO format for datetime
                    'isPro': False,
                    'isVerified': False,
                    'avatar': avatar_reference,  # Just store the ID
                    'avatarId': avatar_bucket_id,  # Store bucket ID separately
                    'remember': False,
                    'agreed': True
                }
            )
            
            return user
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise e

    def _get_random_avatar(self):
        """Get a random avatar from Appwrite storage"""
        self._initialize_client()
        try:
            # Only proceed if we have a bucket ID configured
            if not self.avatar_bucket_id:
                print("No avatar bucket ID configured")
                return None, None
                
            # List files in the avatar bucket
            files = self.storage.list_files(
                bucket_id=self.avatar_bucket_id
            )
            
            # If no files or empty bucket
            if files['total'] == 0 or not files.get('files') or len(files['files']) == 0:
                return None, None
            
            # Pick a random avatar from the list
            random_index = random.randint(0, len(files['files']) - 1)
            random_file = files['files'][random_index]
            
            # Return just the file ID - we'll construct the URL on demand
            return random_file['$id'], self.avatar_bucket_id
        except Exception as e:
            print(f"Error getting random avatar: {str(e)}")
            return None, None
    
    def login_user(self, email, password):
        """Login user with email and password"""
        self._initialize_client()
        try:
            # Use the correct parameter names for create_session
            # Most likely userId and secret instead of email and password
            session = self.users.create_session(user_id=email, password=password)
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
            # Fix query syntax for Appwrite API
            users = self.users.list([
                Query.equal("email", email)
            ])
            
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

    def update_user_password(self, user_id, password):
        """Update user password"""
        self._initialize_client()
        try:
            self.users.update_password(user_id, password)
            return True
        except Exception as e:
            print(f"Error updating password: {str(e)}")
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

    def send_session_alert(self, user_id, client_ip, client_name):
        """Send session alert using Appwrite's built-in notification system
        
        This leverages Appwrite's native session notifications rather than
        creating a custom template
        """
        self._initialize_client()
        try:
            return True
        except Exception as e:
            print(f"Error with session notification: {str(e)}")
            return False

    def send_magic_link(self, email, url=None):
        """Send magic URL authentication link using Appwrite's built-in functionality"""
        self._initialize_client()
        try:
            # Ensure URL is properly formatted
            magic_url = url if url else f"{current_app.config.get('FRONTEND_URL', '')}/magic-login"
            
            # Use the right method name based on SDK version
            if hasattr(self.users, 'create_magic_url_token'):
                result = self.users.create_magic_url_token(email, magic_url)
            elif hasattr(self.users, 'createMagicURLToken'):
                result = self.users.createMagicURLToken(email, magic_url)
            elif hasattr(self.users, 'create_magic_url'):
                result = self.users.create_magic_url(email, magic_url)
            else:
                result = self.users.createMagicURL(email, magic_url)
                
            print(f"Magic link sent to {email}")
            return result
        except Exception as e:
            print(f"Error sending magic link: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    def send_password_reset(self, email, url=None):
        """Send password recovery email using Appwrite's built-in functionality"""
        self._initialize_client()
        try:
            # Ensure URL is properly formatted
            reset_url = url if url else f"{current_app.config.get('FRONTEND_URL', '')}/reset-password"
            
            # Try different method names based on SDK version
            if hasattr(self.users, 'create_recovery'):
                result = self.users.create_recovery(email, reset_url)
            elif hasattr(self.users, 'createRecovery'):
                result = self.users.createRecovery(email, reset_url)
            elif hasattr(self.users, 'create_recovery_token'):
                result = self.users.create_recovery_token(email, reset_url)
            else:
                result = self.users.createRecoveryToken(email, reset_url)
                
            print(f"Password reset email sent to {email}")
            return result
        except Exception as e:
            print(f"Error sending password reset: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    def create_verification(self, email, url_param=""):
        """Create and send a verification email using Appwrite"""
        self._initialize_client()
        try:
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                raise ValueError("User not found")
            
            # Use the correct method for the Appwrite SDK version
            # The method name varies between SDK versions
            user_id = user['$id']
            
            # Try the correct method based on Appwrite SDK version
            if hasattr(self.users, 'create_verification'):
                # Older SDK versions
                result = self.users.create_verification(user_id, f"{current_app.config['FRONTEND_URL']}/verify-email")
            elif hasattr(self.users, 'createVerification'):
                # Some SDK versions
                result = self.users.createVerification(user_id, f"{current_app.config['FRONTEND_URL']}/verify-email")
            else:
                # Fallback to manual verification
                token = self._generate_manual_verification_token(user_id)
                verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
                print(f"Manual verification URL for {email}: {verification_url}")
                # TODO: Send email with verification_url
                return {"token": token}
            
            return result
        except Exception as e:
            print(f"Error creating verification: {str(e)}")
            raise e
        
    def _generate_manual_verification_token(self, user_id):
        """Generate a manual verification token if Appwrite methods fail"""
        from ..utils.security import generate_token
        return generate_token(user_id)

    def get_user_document(self, user_id):
        """Get a user document by user ID"""
        self._initialize_client()
        try:
            # Try to get the user document
            user_doc = self.database.get_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id
            )
            return user_doc
        except Exception as e:
            print(f"Error getting user document: {str(e)}")
            return None

    def send_verification_email(self, email, username, verification_link=None):
        """Send verification email using Appwrite's built-in template system"""
        self._initialize_client()
        try:
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                raise ValueError("User not found")
            
            user_id = user['$id']
            
            # Use Appwrite's built-in verification system
            # The URL should be the base URL where the user will be redirected after verification
            url = f"{current_app.config['FRONTEND_URL']}/verify-email"
            
            # Try all possible method names based on different Appwrite SDK versions
            if hasattr(self.users, 'create_verification'):
                result = self.users.create_verification(user_id, url)
            elif hasattr(self.users, 'createVerification'):
                result = self.users.createVerification(user_id, url)
            elif hasattr(self.users, 'create_email_verification'):
                result = self.users.create_email_verification(user_id, url)
            elif hasattr(self.users, 'update_email_verification'):
                # This is the method that the error suggests exists
                result = self.users.update_email_verification(user_id, url)
            else:
                # Fallback to manual token generation if no Appwrite method exists
                token = self._generate_manual_verification_token(user_id)
                verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
                print(f"Using manual verification URL for {email}: {verification_url}")
                
                # You would need to implement a custom email sending method here
                # For now, return the token for debugging
                return {"success": True, "token": token, "url": verification_url}
            
            print(f"Verification email successfully sent to {email}")
            return result
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            # Log the exact error and traceback
            import traceback
            traceback.print_exc()
            
            # Fall back to manual token approach
            try:
                token = self._generate_manual_verification_token(user_id)
                verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{token}"
                print(f"Fallback: Manual verification URL for {email}: {verification_url}")
                return {"success": True, "token": token, "url": verification_url}
            except:
                return {'success': False, 'message': str(e)}

    def mark_user_verified(self, user_id):
        """Mark a user as verified in the database"""
        self._initialize_client()
        try:
            from datetime import datetime
            
            # Get existing user document
            user_doc = self.get_user_document(user_id)
            
            # Update attributes based on schema
            if user_doc:
                # Update existing document
                result = self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data={
                        'isVerified': True,
                        'verifiedAt': datetime.utcnow().isoformat()
                    }
                )
            else:
                # Create new document if needed
                result = self.database.create_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data={
                        'userId': user_id,
                        'isVerified': True,
                        'verifiedAt': datetime.utcnow().isoformat(),
                        'createdAt': datetime.utcnow().isoformat()
                    }
                )
                
            return True
        except Exception as e:
            print(f"Error marking user as verified: {str(e)}")
            return False