import os
import json
import firebase_admin
from firebase_admin import credentials, messaging

class PushNotificationService:
    def __init__(self):
        self._initialized = False
        self.app = None
    
    def _initialize_if_needed(self):
        if not self._initialized:
            try:
                # Look for credentials file in a few common locations
                cred_paths = [
                    'serviceAccountKey.json',
                    'firebase-credentials.json',
                    os.path.join('config', 'firebase-credentials.json'),
                    os.path.join(os.path.dirname(__file__), '..', 'config', 'firebase-credentials.json')
                ]
                
                cred_file = None
                for path in cred_paths:
                    if os.path.exists(path):
                        cred_file = path
                        break
                
                if not cred_file:
                    print("Warning: Firebase credentials file not found. Push notifications will not work.")
                    print("Create a service account key file in one of these locations:", cred_paths)
                    return False
                
                cred = credentials.Certificate(cred_file)
                self.app = firebase_admin.initialize_app(cred)
                self._initialized = True
                print("Push notification service initialized successfully")
                return True
            except Exception as e:
                print(f"Error initializing push notification service: {str(e)}")
                return False
        return True
    
    def send_push_notification(self, token, title, body, data=None):
        """Send a push notification to a specific device token"""
        if not self._initialize_if_needed():
            return False
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=token
            )
            
            response = messaging.send(message)
            print(f"Successfully sent push notification: {response}")
            return True
        except Exception as e:
            print(f"Error sending push notification: {str(e)}")
            return False
    
    def send_push_to_user(self, user_id, title, body, data=None):
        """Send a push notification to all devices of a user"""
        # In a real implementation, you would fetch all the user's device tokens
        # from your database and send a notification to each one
        if not self._initialize_if_needed():
            return False
            
        try:
            from ..services.appwrite_service import AppwriteService
            
            # Initialize appwrite service
            appwrite_service = AppwriteService()
            appwrite_service._initialize_client()
            
            # Get user document
            user = appwrite_service.get_user_document(user_id)
            if not user or 'pushTokens' not in user:
                print(f"No push tokens found for user {user_id}")
                return False
            
            # Send to all tokens
            tokens = user.get('pushTokens', [])
            success_count = 0
            
            for token in tokens:
                if self.send_push_notification(token, title, body, data):
                    success_count += 1
            
            print(f"Sent push notifications to {success_count}/{len(tokens)} devices")
            return success_count > 0
        except Exception as e:
            print(f"Error sending push notifications to user: {str(e)}")
            return False