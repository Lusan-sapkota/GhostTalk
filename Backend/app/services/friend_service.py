import time
from flask import current_app
import datetime

class FriendService:
    def __init__(self):
        self._initialized = False
        self.appwrite_service = None
        self.websocket_service = None
    
    def _initialize_if_needed(self):
        """Lazy initialization to avoid app context issues"""
        if not self._initialized:
            from .appwrite_service import AppwriteService
            from .websocket_service import WebSocketService
            
            # Force a clean initialization
            self.appwrite_service = AppwriteService()
            self.appwrite_service._initialize_client(force=True)
            
            self.websocket_service = WebSocketService()
            self._initialized = True
            print("Friend service initialized successfully")
    
    def send_request(self, sender_id, recipient_id):
        """Send a friend request to another user"""
        self._initialize_if_needed()
        
        try:
            # Check if recipient exists
            recipient = self.appwrite_service.get_user_document(recipient_id)
            if not recipient:
                return {'success': False, 'message': 'Recipient not found'}, 404
            
            # Check if already friends
            is_friend = self.appwrite_service.check_friendship(sender_id, recipient_id)
            if is_friend:
                return {'success': False, 'message': 'Already friends with this user'}, 400
            
            # Check if request already exists
            from appwrite.query import Query
            
            existing_requests = self.appwrite_service.database.list_documents(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                queries=[
                    Query.equal("senderId", sender_id),
                    Query.equal("recipientId", recipient_id),
                    Query.equal("status", "pending")
                ]
            )
            
            if existing_requests.get('total', 0) > 0:
                return {'success': False, 'message': 'Friend request already sent'}, 400
            
            # Create friend request
            request = self.appwrite_service.create_friend_request(sender_id, recipient_id)
            
            # Get sender info for notification
            sender = self.appwrite_service.get_user_document(sender_id)
            sender_name = sender.get('username', 'User')  # Note: use 'username' instead of 'name'
            
            # Send real-time notification - Use the correct method name
            self.websocket_service.notify_friend_request(recipient_id, {
                'type': 'friend_request',
                'requestId': request['$id'],
                'senderId': sender_id,
                'senderName': sender_name,
                'timestamp': request['timestamp']
            })
            
            return {
                'success': True,
                'message': 'Friend request sent successfully',
                'requestId': request['$id']
            }, 200
        except Exception as e:
            print(f"Error sending friend request: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def accept_request(self, request_id, recipient_id):
        """Accept a friend request"""
        print(f"Starting accept_request with requestId={request_id}, recipientId={recipient_id}")
        
        # Force initialization
        self._initialize_if_needed()
        
        try:
            # Verify we have properly initialized services
            if not self.appwrite_service:
                print("ERROR: appwrite_service is None after initialization!")
                return {'success': False, 'message': 'Service initialization failed'}, 500
                
            # Get the database and collection IDs for debugging
            db_id = self.appwrite_service.database_id
            coll_id = self.appwrite_service.friend_requests_collection_id
            print(f"Using database_id={db_id}, collection_id={coll_id}")
            
            # Get the request
            print(f"Fetching request document {request_id}...")
            request = self.appwrite_service.database.get_document(
                database_id=db_id,
                collection_id=coll_id,
                document_id=request_id
            )
            
            print(f"Request document found: {request}")
            
            # Verify recipient is the one accepting
            if request['recipientId'] != recipient_id:
                return {'success': False, 'message': 'Not authorized to accept this request'}, 403
            
            # Update request status with ISO format timestamp
            acceptance_time = datetime.datetime.utcnow().isoformat()
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'status': 'accepted',
                    'acceptedAt': acceptance_time
                }
            )
            
            sender_id = request['senderId']
            
            # Add to friends lists (both ways)
            self._add_to_friends_list(sender_id, recipient_id)
            self._add_to_friends_list(recipient_id, sender_id)
            
            # Get recipient info for notification
            recipient = self.appwrite_service.get_user_document(recipient_id)
            recipient_name = recipient.get('username') or recipient.get('name') or 'Unknown User'
            
            # Notify sender using notify_friend_request for consistency with the same event type
            try:
                print(f"Attempting to notify {sender_id} about accepted request")
                self.websocket_service.notify_friend_request(sender_id, {
                    'type': 'friend_request_accepted',
                    'requestId': request_id,
                    'userId': recipient_id,
                    'userName': recipient_name,
                    'timestamp': acceptance_time
                })
            except Exception as e:
                print(f"Error sending notification, but friendship was created: {str(e)}")
                # Continue with the success flow - don't let notification failure prevent friendship creation
            
            return {
                'success': True,
                'message': 'Friend request accepted'
            }, 200
        except Exception as e:
            print(f"Error accepting friend request: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def reject_request(self, request_id, recipient_id):
        """Reject a friend request"""
        self._initialize_if_needed()
        
        try:
            # Get the request
            request = self.appwrite_service.database.get_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id
            )
            
            # Verify recipient is the one rejecting
            if request['recipientId'] != recipient_id:
                return {'success': False, 'message': 'Not authorized to reject this request'}, 403
            
            # Update request status with ISO format timestamp
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'status': 'rejected',
                    'rejectedAt': datetime.datetime.utcnow().isoformat()
                }
            )
            
            return {
                'success': True,
                'message': 'Friend request rejected'
            }, 200
        except Exception as e:
            print(f"Error rejecting friend request: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def cancel_request(self, request_id, sender_id):
        """Cancel a friend request"""
        self._initialize_if_needed()
        
        try:
            # Get the request
            request = self.appwrite_service.database.get_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id
            )
            
            # Verify sender is the one canceling
            if request['senderId'] != sender_id:
                return {'success': False, 'message': 'Not authorized to cancel this request'}, 403
            
            # Update request status with ISO format timestamp
            # Use 'rejected' instead of 'canceled' to comply with Appwrite's constraints
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'status': 'rejected',  # Changed from 'canceled' to 'rejected'
                    'canceledAt': datetime.datetime.utcnow().isoformat(),
                    'canceledByUser': sender_id  # Add this to track who canceled it
                }
            )
            
            return {
                'success': True,
                'message': 'Friend request canceled'
            }, 200
        except Exception as e:
            print(f"Error canceling friend request: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def get_pending_requests(self, user_id):
        """Get pending friend requests for a user"""
        self._initialize_if_needed()
        
        try:
            from appwrite.query import Query
            
            # Get received requests
            received_requests = self.appwrite_service.database.list_documents(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                queries=[
                    Query.equal("recipientId", user_id),
                    Query.equal("status", "pending")
                ]
            )
            
            # Get sent requests
            sent_requests = self.appwrite_service.database.list_documents(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                queries=[
                    Query.equal("senderId", user_id),
                    Query.equal("status", "pending")
                ]
            )
            
            # Enhance requests with user info
            enhanced_received = []
            for request in received_requests.get('documents', []):
                sender = self.appwrite_service.get_user_document(request['senderId'])
                if sender:
                    # Try both username and name fields
                    sender_name = sender.get('username') or sender.get('name') or 'Unknown User'
                    enhanced_received.append({
                        'requestId': request['$id'],
                        'senderId': request['senderId'],
                        'senderName': sender_name,
                        'senderAvatar': sender.get('avatar', ''),
                        'timestamp': request['timestamp'],
                        'timeAgo': self._format_time_ago(request['timestamp'])
                    })
                    print(f"Enhanced received request with sender name: {sender_name}")
                else:
                    print(f"Failed to get user document for sender ID: {request['senderId']}")
            
            enhanced_sent = []
            for request in sent_requests.get('documents', []):
                recipient = self.appwrite_service.get_user_document(request['recipientId'])
                if recipient:
                    recipient_name = recipient.get('username') or recipient.get('name') or 'Unknown User'
                    enhanced_sent.append({
                        'requestId': request['$id'],
                        'recipientId': request['recipientId'],
                        'recipientName': recipient_name,
                        'recipientAvatar': recipient.get('avatar', ''),
                        'timestamp': request['timestamp'],
                        'timeAgo': self._format_time_ago(request['timestamp'])
                    })
                else:
                    print(f"Failed to get user document for recipient ID: {request['recipientId']}")
            
            return {
                'success': True,
                'received': enhanced_received,
                'sent': enhanced_sent
            }, 200
        except Exception as e:
            print(f"Error getting pending requests: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def get_friends(self, user_id):
        """Get a user's friends list with details"""
        self._initialize_if_needed()
        
        try:
            user = self.appwrite_service.get_user_document(user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            friends_list = user.get('friends', [])
            friends_details = []
            
            # Get API base URL for avatar URLs
            import os
            backend_url = os.environ.get('BACKEND_URL', 'http://192.168.18.2:5000/api')
            
            for friend_id in friends_list:
                friend = self.appwrite_service.get_user_document(friend_id)
                if friend:
                    # Format avatar URL properly
                    avatar_url = None
                    if friend.get('avatar'):
                        avatar_url = f"{backend_url}/user/avatar/{friend.get('avatar')}"
                    
                    friends_details.append({
                        'id': friend_id,
                        'name': friend.get('username') or friend.get('name', 'Unknown User'),
                        'avatar': avatar_url,
                        'isOnline': friend.get('isOnline', False),
                        'lastSeen': friend.get('lastSeen', 0),
                        'lastSeenText': self._format_time_ago(friend.get('lastSeen', 0)),
                        'bio': friend.get('bio', ''),
                        'proStatus': friend.get('proStatus', 'free'),
                        'isVerified': friend.get('isVerified', False)
                    })
            
            return {
                'success': True,
                'friends': friends_details
            }, 200
        except Exception as e:
            print(f"Error getting friends list: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def _add_to_friends_list(self, user_id, friend_id):
        """Add a friend to a user's friends list"""
        try:
            user = self.appwrite_service.get_user_document(user_id)
            if not user:
                return False
            
            friends = user.get('friends', [])
            
            # Don't add if already a friend
            if friend_id in friends:
                return True
            
            friends.append(friend_id)
            
            # Update user document
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.users_collection_id,
                document_id=user_id,
                data={
                    'friends': friends
                }
            )
            
            return True
        except Exception as e:
            print(f"Error adding to friends list: {str(e)}")
            return False
    
    def _format_time_ago(self, timestamp):
        """Format timestamp to a human-readable 'time ago' format"""
        if not timestamp:
            return "Unknown"
        
        try:
            from datetime import datetime
            import time
            
            # Convert ISO string to timestamp if needed
            if isinstance(timestamp, str):
                dt = datetime.fromisoformat(timestamp)
                timestamp_seconds = dt.timestamp()
            else:
                timestamp_seconds = timestamp
                
            current_time = int(time.time())
            seconds_ago = current_time - int(timestamp_seconds)
            
            if seconds_ago < 60:
                return "Just now"
            elif seconds_ago < 3600:
                minutes = seconds_ago // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            elif seconds_ago < 86400:
                hours = seconds_ago // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif seconds_ago < 604800:
                days = seconds_ago // 86400
                return f"{days} day{'s' if days > 1 else ''} ago"
            else:
                weeks = seconds_ago // 604800
                return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        except Exception as e:
            print(f"Error formatting time ago: {str(e)}")
            return "Unknown time"
    
    def remove_friend(self, user_id, friend_id):
        """Remove a friend"""
        self._initialize_if_needed()
        
        try:
            # Check if they are actually friends
            is_friend = self.appwrite_service.check_friendship(user_id, friend_id)
            if not is_friend:
                return {'success': False, 'message': 'These users are not friends'}, 400
            
            # Remove friend (both ways)
            success, message = self.appwrite_service.remove_friend(user_id, friend_id)
            
            if success:
                return {'success': True, 'message': 'Friend removed successfully'}, 200
            else:
                return {'success': False, 'message': message}, 500
        except Exception as e:
            print(f"Error removing friend: {str(e)}")
            return {'success': False, 'message': str(e)}, 500