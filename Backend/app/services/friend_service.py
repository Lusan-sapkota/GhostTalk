import time

class FriendService:
    def __init__(self):
        from .appwrite_service import AppwriteService
        from .websocket_service import WebSocketService
        
        self.appwrite_service = AppwriteService()
        self.websocket_service = WebSocketService()
    
    def send_request(self, sender_id, recipient_id):
        """Send a friend request to another user"""
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
            sender_name = sender.get('name', 'User')
            
            # Send real-time notification
            self.websocket_service.notify_friend_request(recipient_id, {
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
            return {'success': False, 'message': str(e)}, 500
    
    def accept_request(self, request_id, recipient_id):
        """Accept a friend request"""
        try:
            # Get the request
            request = self.appwrite_service.database.get_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id
            )
            
            # Verify recipient is the one accepting
            if request['recipientId'] != recipient_id:
                return {'success': False, 'message': 'Not authorized to accept this request'}, 403
            
            # Update request status
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'status': 'accepted',
                    'acceptedAt': int(time.time())
                }
            )
            
            sender_id = request['senderId']
            
            # Add to friends lists (both ways)
            self._add_to_friends_list(sender_id, recipient_id)
            self._add_to_friends_list(recipient_id, sender_id)
            
            # Notify sender
            self.websocket_service.send_notification(sender_id, {
                'type': 'friend_request_accepted',
                'requestId': request_id,
                'userId': recipient_id,
                'timestamp': int(time.time())
            })
            
            return {
                'success': True,
                'message': 'Friend request accepted'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def reject_request(self, request_id, recipient_id):
        """Reject a friend request"""
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
            
            # Update request status
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.friend_requests_collection_id,
                document_id=request_id,
                data={
                    'status': 'rejected',
                    'rejectedAt': int(time.time())
                }
            )
            
            return {
                'success': True,
                'message': 'Friend request rejected'
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_pending_requests(self, user_id):
        """Get pending friend requests for a user"""
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
                enhanced_received.append({
                    'requestId': request['$id'],
                    'senderId': request['senderId'],
                    'senderName': sender.get('name', 'Unknown User'),
                    'senderAvatar': sender.get('avatar', ''),
                    'timestamp': request['timestamp']
                })
            
            enhanced_sent = []
            for request in sent_requests.get('documents', []):
                recipient = self.appwrite_service.get_user_document(request['recipientId'])
                enhanced_sent.append({
                    'requestId': request['$id'],
                    'recipientId': request['recipientId'],
                    'recipientName': recipient.get('name', 'Unknown User'),
                    'recipientAvatar': recipient.get('avatar', ''),
                    'timestamp': request['timestamp']
                })
            
            return {
                'success': True,
                'received': enhanced_received,
                'sent': enhanced_sent
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_friends(self, user_id):
        """Get a user's friends list with details"""
        try:
            user = self.appwrite_service.get_user_document(user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            friends_list = user.get('friends', [])
            friends_details = []
            
            for friend_id in friends_list:
                friend = self.appwrite_service.get_user_document(friend_id)
                if friend:
                    friends_details.append({
                        'id': friend_id,
                        'name': friend.get('name', 'Unknown User'),
                        'avatar': friend.get('avatar', ''),
                        'isOnline': friend.get('isOnline', False),
                        'lastSeen': friend.get('lastSeen', 0)
                    })
            
            return {
                'success': True,
                'friends': friends_details
            }, 200
        except Exception as e:
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