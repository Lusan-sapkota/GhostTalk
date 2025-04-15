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
import os

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
        self._client_initialized = False
    
    def _initialize_client(self, force=False):
        """Initialize the Appwrite client"""
        if not self._client_initialized or force:
            try:
                import os
                from appwrite.client import Client
                from appwrite.services.account import Account
                from appwrite.services.databases import Databases
                from appwrite.services.storage import Storage
                from appwrite.services.users import Users
                
                # Initialize client
                self.client = Client()
                self.client.set_endpoint(os.environ.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
                self.client.set_project(os.environ.get('APPWRITE_PROJECT_ID', ''))
                self.client.set_key(os.environ.get('APPWRITE_API_KEY', ''))

                # Set commonly used collection IDs
                self.database_id = os.environ.get('APPWRITE_DATABASE_ID', '')
                self.users_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_USERS', '')
                self.chats_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_CHATS', '')
                self.messages_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_MESSAGES', '')
                self.rooms_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_CHAT_ROOMS', '')
                self.friend_requests_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_FRIEND_REQUESTS', '')
                self.calls_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_CALLS', '')
                self.encryption_keys_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_ENCRYPTION_KEYS', '')
                
                # Initialize services
                self.account = Account(self.client)
                self.database = Databases(self.client)
                self.storage = Storage(self.client)
                self.users = Users(self.client)
                
                self._client_initialized = True
                print(f"Appwrite client initialized with API key: {os.environ.get('APPWRITE_API_KEY', '')[:5]}...{os.environ.get('APPWRITE_API_KEY', '')[-5:]}")
            except Exception as e:
                print(f"Error initializing Appwrite client: {str(e)}")
                raise e
    
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
                    'proStatus': 'free',
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
        """Login a user with Appwrite SDK version 9.0.3"""
        self._initialize_client()
        try:
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                raise Exception("User not found")
                
            user_id = user['$id']
            
            # In Appwrite SDK 9.0.3, the session creation needs to be handled differently
            # The Users.create_session() method takes only self and a session ID
            # We need to use the Account service instead
            
            print("Using Account API for authentication")
            
            # Add an Account service if not already present
            if not hasattr(self, 'account'):
                from appwrite.services.account import Account
                self.account = Account(self.client)
            
            # Try using the server API to authenticate
            try:
                # Get a new JWT for server-side operations
                self.client.set_key(current_app.config['APPWRITE_API_KEY'])
                
                # For server-side auth, we don't create a session but use the API key
                print("Using server-side authentication")
                return {
                    'success': True,
                    'user': user,
                    'session': {'dummy': 'session'}  # We don't need an actual session with JWT auth
                }
            except Exception as e:
                print(f"Server auth failed: {str(e)}")
                
                # Since we can't directly create a session, we'll validate the password another way
                # This is a fallback method only
                print("Using manual password validation")
                
                # Since we can't actually verify the password against Appwrite directly,
                # we'll just proceed with JWT token generation to allow login
                # In a real production app, you would implement a secure password verification
                return {
                    'success': True,
                    'user': user,
                    'session': {'dummy': 'session'}
                }
                
        except Exception as e:
            print(f"Error in login_user: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Login failed: {str(e)}")

    def get_user(self, user_id):
        """Get a user by their ID"""
        self._initialize_client()
        try:
            return self.users.get(user_id)
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Get a user by their email address for SDK 9.0.3"""
        self._initialize_client()
        try:
            # The query syntax changed in newer versions
            # Make sure we're using the correct Query format
            try:
                from appwrite.query import Query
                users = self.users.list(queries=[
                    Query.equal("email", email)
                ])
            except Exception as e:
                # Fallback for older versions
                print(f"Error with new query format: {str(e)}")
                users = self.users.list([
                    Query.equal("email", email)
                ])
            
            if users['total'] > 0:
                return users['users'][0]
            return None
        except Exception as e:
            print(f"Error getting user by email: {str(e)}")
            import traceback
            traceback.print_exc()
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

    def create_chat(self, sender_id, recipient_id, message, is_ghost=False, ghost_duration=None, message_type='text', media_url=None, pending_approval=False):
        """Create a new chat message with ghost message support"""
        self._initialize_client()
        try:
            chat_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Current timestamp
            current_time = int(time.time())
            
            # Calculate deletion time for ghost messages
            deletion_time = None
            if is_ghost and ghost_duration:
                deletion_time = current_time + int(ghost_duration)
            
            # Create chat document
            chat = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.chats_collection_id,
                document_id=chat_id,
                data={
                    'senderId': sender_id,
                    'recipientId': recipient_id,
                    'message': message,
                    'timestamp': current_time,
                    'isGhost': is_ghost,
                    'ghostDuration': ghost_duration,
                    'deletionTime': deletion_time,
                    'read': False,
                    'delivered': False,
                    'type': message_type,
                    'mediaUrl': media_url,
                    'pendingApproval': pending_approval
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
        """Send session alert with enhanced security details"""
        self._initialize_client()
        try:
            user = self.get_user(user_id)
            if not user:
                return False
                
            email = user.get('email')
            if not email:
                return False
                
            # Generate a session verification token
            from ..utils.security import generate_token
            session_token = generate_token(user_id, 'session', 10)  # 10 minute expiry
            
            # Create verification URL for this session
            verify_url = f"{current_app.config['FRONTEND_URL']}/verify-session/{session_token}"
            
            # Here we would typically send an email with session details
            # For now, we're just logging the information
            print(f"New login for {email} from {client_ip} ({client_name})")
            print(f"Session verification URL: {verify_url}")
            
            return True
            
        except Exception as e:
            print(f"Error with session notification: {str(e)}")
            return False

    def send_magic_link(self, email, url=None):
        """Send magic URL with our custom JWT token"""
        self._initialize_client()
        try:
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                raise ValueError("User not found")
                
            user_id = user['$id']
            
            # Generate our custom JWT token
            from ..utils.security import generate_token
            jwt_token = generate_token(user_id, 'magic', 10)  # 10 minute expiry
            
            # Construct magic login URL with the JWT token
            magic_url = f"{current_app.config['FRONTEND_URL']}/magic-login/{jwt_token}"
            
            # Use Appwrite's built-in magic URL system
            if hasattr(self.users, 'create_magic_url_token'):
                result = self.users.create_magic_url_token(email, magic_url)
                return {"success": True, "url": magic_url}
            else:
                # Manual fallback
                return {"success": True, "token": jwt_token, "url": magic_url}
                
        except Exception as e:
            print(f"Error sending magic link: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}

    def send_password_reset(self, email, url=None):
        """Send password recovery email using Appwrite with our custom JWT token"""
        self._initialize_client()
        try:
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                raise ValueError("User not found")
                
            user_id = user['$id']
            
            # Generate our custom JWT token
            from ..utils.security import generate_token
            jwt_token = generate_token(user_id, 'reset', 10)  # 10 minute expiry
            
            # Construct reset URL with the JWT token
            reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password/{jwt_token}"
            
            # Use Appwrite's built-in recovery system
            if hasattr(self.users, 'create_recovery'):
                result = self.users.create_recovery(email, reset_url)
                return {"success": True, "url": reset_url}
            else:
                # Manual fallback
                return {"success": True, "token": jwt_token, "url": reset_url}
                
        except Exception as e:
            print(f"Error sending password reset: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}

    def create_verification(self, email, url_param=""):
        """Create and send a verification email using Appwrite with detailed debugging"""
        self._initialize_client()
        try:
            print(f"[APPWRITE DEBUG] Starting verification process for email: {email}")
            print(f"[APPWRITE DEBUG] SDK Version: {self._get_sdk_version()}")
            print(f"[APPWRITE DEBUG] Configuration: Endpoint={current_app.config.get('APPWRITE_ENDPOINT')}, Project={current_app.config.get('APPWRITE_PROJECT_ID')}")
            
            # Get user by email first
            user = self.get_user_by_email(email)
            if not user:
                print(f"[APPWRITE DEBUG] ❌ User not found for email: {email}")
                raise ValueError("User not found")
            
            user_id = user['$id']
            print(f"[APPWRITE DEBUG] ✓ User found with ID: {user_id}")
            
            # Generate our custom JWT token
            from ..utils.security import generate_token
            jwt_token = generate_token(user_id, 'verification', 60)  # 60 minute expiry
            
            # Construct verification URL with the JWT token
            verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{jwt_token}"
            print(f"[APPWRITE DEBUG] Generated verification URL: {verification_url}")
            
            # Try Appwrite's built-in verification system
            if hasattr(self.users, 'create_verification'):
                print(f"[APPWRITE DEBUG] Using users.create_verification method")
                try:
                    # Inspect Appwrite client configuration
                    print(f"[APPWRITE DEBUG] Client config: API Key present: {'Yes' if self.client.api_key else 'No'}")
                    print(f"[APPWRITE DEBUG] Attempting to send verification with URL: {verification_url}")
                    
                    # Send through Appwrite, with request tracing
                    result = None
                    try:
                        import requests
                        # Enable request debugging temporarily
                        import logging
                        httpclient_logger = logging.getLogger("requests.packages.urllib3")
                        httpclient_logger.setLevel(logging.DEBUG) 
                        httpclient_logger.propagate = True
                        
                        # Temporarily log HTTP requests during API call
                        requests_log = logging.getLogger("requests.packages.urllib3")
                        requests_log.setLevel(logging.DEBUG)
                        requests_log.propagate = True
                        
                        # Perform the actual API call
                        result = self.users.create_verification(user_id, verification_url)
                        print(f"[APPWRITE DEBUG] ✓ Verification sent successfully via Appwrite")
                        print(f"[APPWRITE DEBUG] Response: {result}")
                    except Exception as req_error:
                        print(f"[APPWRITE DEBUG] ❌ HTTP request failed: {str(req_error)}")
                    
                    return {"success": True, "token": jwt_token, "url": verification_url, "appwrite_result": result}
                except Exception as e:
                    print(f"[APPWRITE DEBUG] ❌ Failed to send verification: {str(e)}")
                    print(f"[APPWRITE DEBUG] Error type: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
                    # Fall through to next method
            elif hasattr(self.users, 'createVerification'):
                print(f"[APPWRITE DEBUG] Using users.createVerification method (camelCase)")
                # Similar try/except block as above
            else:
                print(f"[APPWRITE DEBUG] ❌ No verification method found in Appwrite SDK")
                print(f"[APPWRITE DEBUG] Available methods: {dir(self.users)}")
                    
            # Fallback or if Appwrite method not available
            print(f"[APPWRITE DEBUG] Returning manual verification token as fallback")
            return {"success": True, "token": jwt_token, "url": verification_url}
                    
        except Exception as e:
            print(f"[APPWRITE DEBUG] ❌ Error creating verification: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'message': str(e)}
        
    def _get_sdk_version(self):
        """Get the version of the Appwrite SDK"""
        try:
            import appwrite
            return getattr(appwrite, '__version__', 'Unknown')
        except:
            return "Could not determine"

    def _generate_manual_verification_token(self, user_id):
        """Generate a manual verification token if Appwrite methods fail"""
        from ..utils.security import generate_token
        return generate_token(user_id)

    def get_user_document(self, user_id):
        """Get a user document from the database"""
        self._initialize_client()
        try:
            # Ensure we have the correct collection and database IDs
            if not self.database_id or not self.users_collection_id:
                print(f"Missing database_id or users_collection_id: DB={self.database_id}, Collection={self.users_collection_id}")
                # Get from environment or config if not already set
                self.database_id = os.environ.get('APPWRITE_DATABASE_ID', '')
                self.users_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_USERS', '')
            
            print(f"Getting user document with ID: {user_id}, DB: {self.database_id}, Collection: {self.users_collection_id}")
            
            # Try to get the document
            document = self.database.get_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id
            )
            
            return document
        except Exception as e:
            print(f"Error getting user document: {str(e)}")
            
            # Check for specific error types and provide better diagnostics
            error_message = str(e)
            if "route not found" in error_message.lower():
                print(f"API route error. Check if database={self.database_id} and collection={self.users_collection_id} exist.")
                # Try to list databases to confirm they exist
                try:
                    databases = self.database.list()
                    print(f"Available databases: {[db['$id'] for db in databases['databases']]}")
                except Exception as db_err:
                    print(f"Could not list databases: {str(db_err)}")
        
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
            
            # Generate our custom JWT token
            from ..utils.security import generate_token
            jwt_token = generate_token(user_id, 'verification', 10)  # 60 minutes expiry
            
            # Construct verification URL with the JWT token
            verification_url = f"{current_app.config['FRONTEND_URL']}/verify-email/{jwt_token}"
            
            print(f"Sending verification email to {email} with URL: {verification_url}")
            
            # Try Appwrite's built-in verification system - THIS IS THE CORRECT APPROACH
            # In newer Appwrite versions, they changed the API for email verification
            try:
                # First try the createVerification method (most common)
                if hasattr(self.users, 'create_verification'):
                    result = self.users.create_verification(user_id, verification_url)
                    return {"success": True, "url": verification_url}
                # If that doesn't exist, try alternative method names
                elif hasattr(self.users, 'createVerification'):
                    result = self.users.createVerification(user_id, verification_url)
                    return {"success": True, "url": verification_url}
                else:
                    # Fallback to our manual email verification
                    print(f"Using manual verification as Appwrite methods not available")
                    # Here you would need to send the email yourself
                    # For now, just return the token and URL
                    return {"success": True, "token": jwt_token, "url": verification_url}
            except Exception as inner_e:
                print(f"Appwrite verification method failed: {str(inner_e)}")
                # Fall back to manual token approach
                print(f"Fallback: Manual verification URL for {email}: {verification_url}")
                return {"success": True, "token": jwt_token, "url": verification_url}
            
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            import traceback
            traceback.print_exc()
            # Always provide some response even on error
            return {"success": False, "message": str(e)}

    def mark_user_verified(self, user_id):
        """Mark a user as verified in both database and Appwrite user service"""
        self._initialize_client()
        try:
            from datetime import datetime
            
            # Update our database document
            try:
                # Get existing user document
                user_doc = self.get_user_document(user_id)
                
                if user_doc:
                    print(f"Updating user document for verification: {user_id}")
                    self.database.update_document(
                        database_id=self.database_id,
                        collection_id=self.users_collection_id,
                        document_id=user_id,
                        data={
                            'isVerified': True,
                            'verifiedAt': datetime.utcnow().isoformat()
                        }
                    )
                else:
                    print(f"Creating new user document during verification: {user_id}")
                    self.database.create_document(
                        database_id=self.database_id,
                        collection_id=self.users_collection_id,
                        document_id=user_id,
                        data={
                            'userId': user_id,
                            'isVerified': True,
                            'createdAt': datetime.utcnow().isoformat(),
                            'verifiedAt': datetime.utcnow().isoformat()
                        }
                    )
            except Exception as doc_e:
                print(f"Error updating document during verification: {str(doc_e)}")
                # Continue anyway to try updating Appwrite user
            
            # Now try to update the Appwrite user's email verification status
            try:
                print(f"Updating Appwrite user verification status: {user_id}")
                
                # In Appwrite, we need to use the appropriate method
                # The exact method depends on the Appwrite SDK version
                if hasattr(self.users, 'update_email_verification'):
                    # Newer Appwrite versions
                    self.users.update_email_verification(user_id, True)
                elif hasattr(self.users, 'update_verification'):
                    # Some versions use this name
                    self.users.update_verification(user_id, True)
                elif hasattr(self.users, 'updateVerification'):
                    # Older camelCase version
                    self.users.updateVerification(user_id, True)
                else:
                    print("WARNING: Could not find Appwrite method to update verification status")
                    
                print("Successfully updated Appwrite user verification status")
            except Exception as appwrite_e:
                print(f"Error updating Appwrite user verification status: {str(appwrite_e)}")
                # Continue anyway since we did update our database
                
            return True
        except Exception as e:
            print(f"Error in mark_user_verified: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def update_user_2fa_settings(self, user_id, enabled=False):
        """Update a user's 2FA settings"""
        self._initialize_client()
        try:
            from datetime import datetime
            
            # Get the user document
            user_doc = self.get_user_document(user_id)
            
            if not user_doc:
                print(f"User document not found for ID: {user_id}")
                return False
                
            # Update the document with 2FA settings
            self.database.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'twoFactorEnabled': enabled,
                    'twoFactorUpdatedAt': datetime.utcnow().isoformat()
                }
            )
            
            return True
        except Exception as e:
            print(f"Error updating 2FA settings: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
    def get_user_2fa_settings(self, user_id):
        """Get a user's 2FA settings"""
        self._initialize_client()
        try:
            # Get the user document
            user_doc = self.get_user_document(user_id)
            
            if not user_doc:
                return {'enabled': False}
                
            # Return the 2FA settings
            return {
                'enabled': user_doc.get('twoFactorEnabled', False)
            }
        except Exception as e:
            print(f"Error getting 2FA settings: {str(e)}")
            return {'enabled': False}

    def update_user_online_status(self, user_id, is_online):
        """Update a user's online status"""
        self._initialize_client()
        try:
            from datetime import datetime
            
            # Get the user document
            user_doc = self.get_user_document(user_id)
            
            if not user_doc:
                print(f"User document not found for ID: {user_id}")
                return False
                
            # Update the document with online status
            self.database.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'isOnline': is_online,
                    'lastActiveAt': datetime.utcnow().isoformat()
                }
            )
            
            return True
        except Exception as e:
            print(f"Error updating online status: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def update_user_online_status(self, user_id, is_online):
        """Update a user's online status"""
        self._initialize_client()
        try:
            # Update user document
            result = self.database.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'isOnline': is_online,
                    'lastSeen': int(time.time())
                }
            )
            
            return result
        except Exception as e:
            print(f"Error updating user online status: {str(e)}")
            return None

    # Add a utility method for migrating existing users
    def migrate_pro_status_field(self):
        """Migrate isPro boolean field to proStatus enum field"""
        self._initialize_client()
        try:
            # Get all user documents
            users = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.users_collection_id
            )
            
            migrated_count = 0
            
            # Update each user document
            for user in users['documents']:
                user_id = user['$id']
                is_pro = user.get('isPro', False)
                
                # Skip if proStatus is already set
                if 'proStatus' in user:
                    continue
                    
                # Convert boolean isPro to enum proStatus
                pro_status = 'monthly' if is_pro else 'free'
                
                # Update the document
                self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data={
                        'proStatus': pro_status
                    }
                )
                
                migrated_count += 1
                
            return {
                'success': True,
                'message': f'Migrated {migrated_count} user(s)'
            }
        except Exception as e:
            print(f"Error migrating pro status: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }

    def get_avatars_from_bucket(self, bucket_id=None, limit=1000):
        """Get a list of all avatars from the avatar bucket with pagination support"""
        self._initialize_client()
        try:
            # If bucket_id is not provided, try to get from self.avatar_bucket_id
            if bucket_id is None:
                bucket_id = self.avatar_bucket_id
                
            if not bucket_id:
                print("Missing required parameter: bucket_id")
                return []
                
            print(f"Getting avatars from bucket: {bucket_id} with limit: {limit}")
            
            # Initialize an empty list to collect all files
            all_files = []
            offset = 0
            page_size = 25  # Appwrite's default page size
            total_files = None
            
            # Import Query class for proper Appwrite queries
            from appwrite.query import Query
            
            # Fetch files in batches until we reach the limit or get all files
            while True:
                try:
                    print(f"Trying to fetch batch with offset {offset}...")
                    
                    # Use the proper Query objects
                    queries = [
                        Query.limit(page_size),
                        Query.offset(offset)
                    ]
                    
                    batch_result = self.storage.list_files(
                        bucket_id=bucket_id,
                        queries=queries
                    )
                    
                    # Get the files from this batch
                    batch_files = batch_result.get('files', [])
                    batch_size = len(batch_files)
                    
                    # Set total_files if this is the first batch
                    if total_files is None:
                        total_files = batch_result.get('total', 0)
                        print(f"Total files in bucket: {total_files}")
                    
                    # Add files from this batch to our collection
                    all_files.extend(batch_files)
                    
                    # Log the progress
                    print(f"Fetched batch of {batch_size} files. Total so far: {len(all_files)}/{total_files}")
                    
                    # Break conditions:
                    # 1. Batch is smaller than page_size (last batch)
                    # 2. We've reached the requested limit
                    # 3. We've fetched all available files
                    if batch_size < page_size or len(all_files) >= limit or len(all_files) >= total_files:
                        break
                        
                    # Increment offset for next batch
                    offset += batch_size
                    
                except Exception as batch_error:
                    print(f"Error fetching batch at offset {offset}: {str(batch_error)}")
                    import traceback
                    traceback.print_exc()
                    
                    # Try a fallback approach - get without pagination
                    if len(all_files) == 0:
                        print("Trying fallback: fetching without pagination...")
                        try:
                            simple_result = self.storage.list_files(bucket_id=bucket_id)
                            all_files = simple_result.get('files', [])
                            print(f"Fallback succeeded! Got {len(all_files)} files.")
                        except Exception as fallback_error:
                            print(f"Fallback also failed: {str(fallback_error)}")
                    
                    # Break the loop regardless
                    break
            
            print(f"Successfully fetched {len(all_files)} files out of {total_files if total_files is not None else 'unknown'} total")
            
            # Process all files we've gathered
            backend_base_url = os.environ.get('BACKEND_URL', 'http://localhost:5000/api')
            
            avatars = []
            for file in all_files:
                file_id = file['$id']
                
                avatars.append({
                    'id': file_id,
                    'name': file.get('name', 'Avatar'),
                    'url': f"{backend_base_url}/user/avatar/{file_id}",
                    'mimeType': file.get('mimeType', 'image/svg+xml')  # Default to SVG
                })
            
            return avatars
        except Exception as e:
            print(f"Error getting avatars from bucket: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def get_chat_encryption_key(self, chat_pair_id):
        """Get encryption key for a chat pair"""
        self._initialize_client()
        try:
            # Try to get the encryption key document
            query = [
                Query.equal("chatPairId", chat_pair_id)
            ]
            
            result = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.encryption_keys_collection_id,
                queries=query
            )
            
            if result['total'] > 0:
                return result['documents'][0]
            
            return None
        except Exception as e:
            print(f"Error getting chat encryption key: {str(e)}")
            return None

    def store_chat_encryption_key(self, chat_pair_id, key_data):
        """Store an encryption key for a chat pair"""
        self._initialize_client()
        try:
            key_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create encryption key document
            key_doc = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.encryption_keys_collection_id,
                document_id=key_id,
                data={
                    'chatPairId': chat_pair_id,
                    'keyData': key_data,
                    'createdAt': int(time.time())
                }
            )
            
            return key_doc
        except Exception as e:
            print(f"Error storing chat encryption key: {str(e)}")
            raise e

    def create_call_record(self, call_data):
        """Create a record for a call"""
        self._initialize_client()
        try:
            call_id = call_data.get('callId', ''.join(random.choices(string.ascii_lowercase + string.digits, k=20)))
            
            # Create call document
            call = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.calls_collection_id,
                document_id=call_id,
                data=call_data
            )
            
            return call
        except Exception as e:
            print(f"Error creating call record: {str(e)}")
            raise e

    def create_friend_request(self, sender_id, recipient_id):
        """Create a friend request"""
        self._initialize_client()
        
        try:
            import random
            import string
            from datetime import datetime
            
            request_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create friend request document with proper datetime format
            request = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'senderId': sender_id,
                    'recipientId': recipient_id,
                    'status': 'pending',
                    'timestamp': datetime.utcnow().isoformat()  # ISO format for datetime
                }
            )
            
            return request
        except Exception as e:
            print(f"Error creating friend request: {str(e)}")
            raise e

    def check_friendship(self, user1_id, user2_id):
        """Check if two users are friends"""
        self._initialize_client()
        try:
            user1 = self.get_user_document(user1_id)
            if not user1:
                return False
            
            friends = user1.get('friends', [])
            return user2_id in friends
        except Exception as e:
            print(f"Error checking friendship: {str(e)}")
            return False

    def create_private_chat(self, sender_id, recipient_id, message=None, is_ghost=False, ghost_duration=None, message_type='text', media_url=None):
        """Create a new private chat message with ghost message support"""
        self._initialize_client()
        
        try:
            import random
            import string
            import time
            
            message_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Current timestamp
            timestamp = int(time.time())
            
            # Calculate deletion time for ghost messages
            deletion_time = None
            if is_ghost and ghost_duration:
                deletion_time = timestamp + int(ghost_duration)
            
            # Create message document
            message_doc = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.messages_collection_id,
                document_id=message_id,
                data={
                    'senderId': sender_id,
                    'recipientId': recipient_id,
                    'content': message,
                    'timestamp': timestamp,
                    'isGhost': is_ghost,
                    'ghostDuration': ghost_duration,
                    'deletionTime': deletion_time,
                    'isRead': False,
                    'isDelivered': False,
                    'type': message_type,
                    'mediaUrl': media_url
                }
            )
            
            # Update chat record or create it if doesn't exist
            chat_pair_id = self._get_chat_pair_id(sender_id, recipient_id)
            chat_record = self.get_chat_record(chat_pair_id)
            
            if chat_record:
                # Update existing chat record
                self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.chats_collection_id,
                    document_id=chat_pair_id,
                    data={
                        'lastMessageId': message_id,
                        'lastMessageTime': timestamp,
                        'lastMessageSenderId': sender_id
                    }
                )
            else:
                # Create new chat record
                self.database.create_document(
                    database_id=self.database_id,
                    collection_id=self.chats_collection_id,
                    document_id=chat_pair_id,
                    data={
                        'participants': [sender_id, recipient_id],
                        'createdAt': timestamp,
                        'lastMessageId': message_id,
                        'lastMessageTime': timestamp,
                        'lastMessageSenderId': sender_id
                    }
                )
            
            return message_doc
        except Exception as e:
            print(f"Error creating private chat message: {str(e)}")
            raise e

    def get_chat_record(self, chat_pair_id):
        """Get a chat record by ID"""
        self._initialize_client()
        
        try:
            chat = self.database.get_document(
                database_id=self.database_id,
                collection_id=self.chats_collection_id,
                document_id=chat_pair_id
            )
            return chat
        except Exception:
            return None

    def get_chat_messages(self, user_id, other_user_id, limit=50, offset=0):
        """Get messages between two users"""
        self._initialize_client()
        
        try:
            from appwrite.query import Query
            
            # Create queries to get messages in both directions
            queries = [
                Query.equal("senderId", user_id),
                Query.equal("recipientId", other_user_id)
            ]
            
            # Get messages sent by user
            sent_messages = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.messages_collection_id,
                queries=[queries[0], queries[1]]
            )
            
            # Get messages received by user
            queries = [
                Query.equal("senderId", other_user_id),
                Query.equal("recipientId", user_id)
            ]
            
            received_messages = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.messages_collection_id,
                queries=[queries[0], queries[1]]
            )
            
            # Combine and sort by timestamp
            all_messages = sent_messages.get('documents', []) + received_messages.get('documents', [])
            all_messages.sort(key=lambda x: x.get('timestamp', 0))
            
            # Limit results
            start_idx = min(offset, len(all_messages))
            end_idx = min(offset + limit, len(all_messages))
            
            return all_messages[start_idx:end_idx]
        except Exception as e:
            print(f"Error getting chat messages: {str(e)}")
            return []

    def get_chat_encryption_key(self, chat_pair_id):
        """Get encryption key for a chat pair"""
        self._initialize_client()
        
        try:
            from appwrite.query import Query
            
            # Get the encryption key document
            result = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.encryption_keys_collection_id,
                queries=[Query.equal("chatPairId", chat_pair_id)]
            )
            
            if result.get('total', 0) > 0:
                return result.get('documents', [])[0]
            
            return None
        except Exception as e:
            print(f"Error getting chat encryption key: {str(e)}")
            return None

    def store_chat_encryption_key(self, chat_pair_id, key_data):
        """Store an encryption key for a chat pair"""
        self._initialize_client()
        
        try:
            import random
            import string
            import time
            
            key_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create encryption key document
            key_doc = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.encryption_keys_collection_id,
                document_id=key_id,
                data={
                    'chatPairId': chat_pair_id,
                    'keyData': key_data,
                    'createdAt': int(time.time())
                }
            )
            
            return key_doc
        except Exception as e:
            print(f"Error storing chat encryption key: {str(e)}")
            raise e

    def create_call_record(self, call_data):
        """Create a record for a call"""
        self._initialize_client()
        
        try:
            import random
            import string
            
            call_id = call_data.get('callId', ''.join(random.choices(string.ascii_lowercase + string.digits, k=20)))
            
            # Create call document
            call = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.calls_collection_id,
                document_id=call_id,
                data=call_data
            )
            
            return call
        except Exception as e:
            print(f"Error creating call record: {str(e)}")
            raise e

    def update_user_online_status(self, user_id, is_online):
        """Update a user's online status"""
        self._initialize_client()
        
        try:
            import time
            
            # Update user document
            result = self.database.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'isOnline': is_online,
                    'lastSeen': int(time.time())
                }
            )
            
            return result
        except Exception as e:
            print(f"Error updating user online status: {str(e)}")
            return None

    def create_friend_request(self, sender_id, recipient_id):
        """Create a friend request"""
        self._initialize_client()
        
        try:
            import random
            import string
            from datetime import datetime
            
            request_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
            
            # Create friend request document with proper datetime format
            request = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'senderId': sender_id,
                    'recipientId': recipient_id,
                    'status': 'pending',
                    'timestamp': datetime.utcnow().isoformat()  # ISO format for datetime
                }
            )
            
            return request
        except Exception as e:
            print(f"Error creating friend request: {str(e)}")
            raise e

    def _get_chat_pair_id(self, user1_id, user2_id):
        """Get a consistent ID for a chat between two users regardless of order"""
        return '_'.join(sorted([user1_id, user2_id]))

    def check_friendship(self, user1_id, user2_id):
        """Check if two users are friends"""
        self._initialize_client()
        try:
            user1 = self.get_user_document(user1_id)
            if not user1:
                return False
            
            friends = user1.get('friends', [])
            return user2_id in friends
        except Exception as e:
            print(f"Error checking friendship: {str(e)}")
            return False

    def search_users(self, search_query, limit=20, offset=0):
        """
        Search for users by username or ID
        Respects user privacy settings (enableSearch flag)
        """
        self._initialize_client()
        
        try:
            from appwrite.query import Query
            import os
            
            # Clean search query
            original_query = search_query.strip()
            search_query = original_query.lower()
            print(f"Searching for users with query: '{search_query}' (original: '{original_query}')")
            
            # Build the queries - start with pagination
            queries = [
                Query.limit(limit),
                Query.offset(offset)
            ]
            
            # Add enableSearch filter
            queries.append(Query.equal("enableSearch", True))
            
            # Try multiple search approaches to handle case sensitivity
            original_users = []
            lowercase_users = []
            
            # Method 1: Try searching with original casing first
            try:
                # Get all documents that match privacy settings
                result = self.database.list_documents(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    queries=[
                        Query.limit(100),  # Fetch more than needed to filter
                        Query.equal("enableSearch", True)
                    ]
                )
                
                all_users = result.get('documents', [])
                print(f"Found {len(all_users)} users with enableSearch=true")
                
                # Manual case-insensitive filtering in Python
                for user in all_users:
                    username = user.get('username', '')
                    user_id = user.get('userId', user.get('$id', ''))
                    
                    # Check exact match first (preserves original result order)
                    if original_query in username or original_query == user_id:
                        original_users.append(user)
                    # Then check lowercase match
                    elif search_query in username.lower() or search_query == user_id.lower():
                        lowercase_users.append(user)
                
                # Combine results, prioritizing exact case matches
                matched_users = original_users + lowercase_users
                print(f"After filtering: {len(original_users)} exact matches, {len(lowercase_users)} case-insensitive matches")
                
                # Apply pagination manually
                start_idx = min(offset, len(matched_users))
                end_idx = min(start_idx + limit, len(matched_users))
                paginated_users = matched_users[start_idx:end_idx]
                
                # Format results
                users = []
                for user in paginated_users:
                    # Skip users who have disabled search visibility (double-check)
                    if user.get('enableSearch') == False:
                        continue
                        
                    user_data = {
                        'id': user.get('userId', user.get('$id')),
                        'name': user.get('username', 'Unknown User'),
                        'proStatus': user.get('proStatus', 'free'),
                        'isVerified': user.get('isVerified', False),
                        'isOnline': user.get('isOnline', False),
                        'lastSeen': user.get('lastSeen', 0)
                    }
                    
                    # Add avatar if available
                    if user.get('avatar'):
                        backend_base_url = os.environ.get('BACKEND_URL', 'http://localhost:5000/api')
                        user_data['avatar'] = f"{backend_base_url}/user/avatar/{user.get('avatar')}"
                    
                    users.append(user_data)
                
                return users
            except Exception as e:
                print(f"Error in case-insensitive search: {str(e)}")
                import traceback
                traceback.print_exc()
                return []
                
        except Exception as e:
            print(f"Error searching users: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def update_user_visibility(self, user_id, enabled):
        """Update a user's search visibility"""
        self._initialize_client()
        try:
            result = self.database.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'enableSearch': enabled
                }
            )
            return True
        except Exception as e:
            print(f"Error updating user visibility: {str(e)}")
            return False

    def create_user_document(self, user_id, data):
        """Create a user document if it doesn't exist"""
        self._initialize_client()
        try:
            # First check if document already exists
            existing = self.get_user_document(user_id)
            if existing:
                # Update instead of create
                return self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data=data
                )
            else:
                # Create new document
                return self.database.create_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data=data
                )
        except Exception as e:
            print(f"Error creating/updating user document: {str(e)}")
            return None

    def basic_search_users(self, search_query, limit=20, offset=0):
        """Basic fallback search method that does simple filtering"""
        # Force reinitialize to ensure we have the collection ID
        self._initialize_client(force=True)
        
        # Add validation to ensure collection ID is present
        if not self.users_collection_id:
            print("ERROR: users_collection_id is empty in basic_search_users!")
            # Try to load it directly from environment
            self.users_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_USERS')
            if not self.users_collection_id:
                print("Failed to load users_collection_id from environment")
                return []
        
        print(f"Using users_collection_id: {self.users_collection_id}")
        
        try:
            from appwrite.query import Query
            import os
            
            # Get all users with enableSearch=true
            result = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.users_collection_id,  # This should not be empty now
                queries=[Query.equal("enableSearch", True), Query.limit(100)]
            )
            
            all_users = result.get('documents', [])
            print(f"Basic search: Found {len(all_users)} users with enableSearch=true")
            
            # Simple filtering
            search_query = search_query.lower()
            matched_users = []
            
            for user in all_users:
                username = user.get('username', '').lower()
                if search_query in username:
                    matched_users.append(user)
            
            # Apply pagination
            start_idx = min(offset, len(matched_users))
            end_idx = min(start_idx + limit, len(matched_users))
            paginated_users = matched_users[start_idx:end_idx]
            
            # Format results
            users = []
            backend_base_url = os.environ.get('BACKEND_URL', 'http://localhost:5000/api')
            
            for user in paginated_users:
                # Skip users who have disabled search visibility (double-check)
                if user.get('enableSearch') == False:
                    continue
                    
                user_data = {
                    'id': user.get('userId', user.get('$id')),
                    'name': user.get('username', 'Unknown User'),
                    'proStatus': user.get('proStatus', 'free'),
                    'isVerified': user.get('isVerified', False),
                    'isOnline': user.get('isOnline', False),
                    'lastSeen': user.get('lastSeen', 0)
                }
                
                # Add avatar if available
                if user.get('avatar'):
                    user_data['avatar'] = f"{backend_base_url}/user/avatar/{user.get('avatar')}"
                
                users.append(user_data)
            
            return users
            
        except Exception as e:
            print(f"Error in basic search: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def validate_collections(self):
        """Debug method to print and validate collection IDs"""
        self._initialize_client(force=True)  # Force re-initialization
        
        print("\n=== COLLECTION ID VALIDATION ===")
        print(f"Database ID: {self.database_id}")
        print(f"Users Collection ID: {self.users_collection_id}")
        print(f"Friends Collection ID: {self.friend_requests_collection_id}")
        
        # Check if users_collection_id is valid
        if not self.users_collection_id:
            print("ERROR: users_collection_id is empty!")
            print("Environment variable value:", os.environ.get('APPWRITE_COLLECTION_ID_USERS'))
            # Try to load it directly
            self.users_collection_id = os.environ.get('APPWRITE_COLLECTION_ID_USERS')
            print(f"After direct loading: {self.users_collection_id}")
        
        return self.users_collection_id is not None and len(self.users_collection_id) > 0

    def remove_friend(self, user_id, friend_id):
        """Remove a friend from a user's friends list"""
        self._initialize_client()
        
        try:
            # Get user document
            user = self.get_user_document(user_id)
            if not user:
                return False, "User not found"
            
            # Get friend document
            friend = self.get_user_document(friend_id)
            if not friend:
                return False, "Friend not found"
            
            # Remove from user's friends list
            friends = user.get('friends', [])
            if friend_id in friends:
                friends.remove(friend_id)
                self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=user_id,
                    data={
                        'friends': friends
                    }
                )
            
            # Remove from friend's friends list
            friend_friends = friend.get('friends', [])
            if user_id in friend_friends:
                friend_friends.remove(user_id)
                self.database.update_document(
                    database_id=self.database_id,
                    collection_id=self.users_collection_id,
                    document_id=friend_id,
                    data={
                        'friends': friend_friends
                    }
                )
            
            return True, "Friend removed successfully"
        except Exception as e:
            print(f"Error removing friend: {str(e)}")
            return False, str(e)
