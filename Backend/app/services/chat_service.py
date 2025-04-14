import base64
import time

class ChatService:
    def __init__(self):
        from .appwrite_service import AppwriteService
        from .encryption_service import EncryptionService
        from .websocket_service import WebSocketService
        
        self.appwrite_service = AppwriteService()
        self.encryption_service = EncryptionService()
        self.websocket_service = WebSocketService()
    
    def send_private_message(self, sender_id, recipient_id, message, is_ghost=False, ghost_duration=None, message_type='text', media_url=None):
        """Send a private message with encryption"""
        try:
            # Check if recipient exists
            recipient = self.appwrite_service.get_user_document(recipient_id)
            if not recipient:
                return {'success': False, 'message': 'Recipient not found'}, 404
            
            # Check if they're friends or if message requires approval
            is_friend = self.appwrite_service.check_friendship(sender_id, recipient_id)
            requires_approval = recipient.get('requireMessageApproval', False)
            pending_approval = requires_approval and not is_friend
            
            # Get chat encryption key
            chat_pair_id = self.appwrite_service._get_chat_pair_id(sender_id, recipient_id)
            encryption_key = self._get_chat_encryption_key(chat_pair_id)
            
            # Encrypt text messages
            encrypted_content = None
            if message_type == 'text' and message:
                encrypted_content = self.encryption_service.encrypt_message(message, encryption_key)
            else:
                encrypted_content = message
            
            # Create chat message
            message_doc = self.appwrite_service.create_private_chat(
                sender_id=sender_id,
                recipient_id=recipient_id,
                message=encrypted_content,
                is_ghost=is_ghost,
                ghost_duration=ghost_duration,
                message_type=message_type,
                media_url=media_url
            )
            
            # Get sender info for notifications
            sender = self.appwrite_service.get_user_document(sender_id)
            sender_name = sender.get('name', 'User')
            
            # Send real-time notification
            message_data = {
                'id': message_doc['$id'],
                'senderId': sender_id,
                'senderName': sender_name,
                'recipientId': recipient_id,
                'timestamp': message_doc['timestamp'],
                'isGhost': is_ghost,
                'ghostDuration': ghost_duration,
                'type': message_type,
                'pendingApproval': pending_approval
            }
            
            # Notify sender for delivery receipt
            self.websocket_service.send_message(sender_id, message_data)
            
            # Notify recipient if they're friends or approval not required
            if not pending_approval:
                self.websocket_service.send_message(recipient_id, message_data)
            else:
                # Send a message request notification instead
                self.websocket_service.send_notification(recipient_id, {
                    'type': 'message_request',
                    'senderId': sender_id,
                    'senderName': sender_name,
                    'timestamp': int(time.time())
                })
            
            return {
                'success': True,
                'message': 'Message sent successfully',
                'data': {
                    'messageId': message_doc['$id'],
                    'timestamp': message_doc['timestamp'],
                    'pendingApproval': pending_approval
                }
            }, 200
            
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_private_chat_history(self, user_id, other_user_id, limit=50, offset=0):
        """Get encrypted chat history between two users"""
        try:
            # Get messages
            messages = self.appwrite_service.get_chat_messages(user_id, other_user_id, limit, offset)
            
            # Get chat encryption key
            chat_pair_id = self.appwrite_service._get_chat_pair_id(user_id, other_user_id)
            encryption_key = self._get_chat_encryption_key(chat_pair_id)
            
            # Decrypt messages
            decrypted_messages = []
            for msg in messages:
                if msg.get('type', 'text') == 'text' and msg.get('content'):
                    try:
                        decrypted_text = self.encryption_service.decrypt_message(
                            msg['content'], encryption_key
                        )
                        msg['decryptedContent'] = decrypted_text
                    except Exception as e:
                        print(f"Error decrypting message {msg['$id']}: {str(e)}")
                        msg['decryptedContent'] = "[Encrypted message]"
                
                # Mark as delivered if recipient is viewing
                if msg['recipientId'] == user_id and not msg.get('isDelivered', False):
                    self.mark_message_as_delivered(msg['$id'])
                    msg['isDelivered'] = True
                
                decrypted_messages.append(msg)
            
            return {
                'success': True,
                'messages': decrypted_messages,
                'total': len(decrypted_messages)
            }, 200
            
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def mark_message_as_read(self, message_id):
        """Mark a message as read"""
        try:
            result = self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.messages_collection_id,
                document_id=message_id,
                data={
                    'isRead': True
                }
            )
            return {'success': True}, 200
        except Exception as e:
            print(f"Error marking message as read: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def mark_message_as_delivered(self, message_id):
        """Mark a message as delivered"""
        try:
            result = self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.messages_collection_id,
                document_id=message_id,
                data={
                    'isDelivered': True
                }
            )
            return {'success': True}, 200
        except Exception as e:
            print(f"Error marking message as delivered: {str(e)}")
            return {'success': False, 'message': str(e)}, 500
    
    def initiate_audio_call(self, caller_id, recipient_id):
        """Initiate an audio call"""
        try:
            # Check if recipient exists
            recipient = self.appwrite_service.get_user_document(recipient_id)
            if not recipient:
                return {'success': False, 'message': 'Recipient not found'}, 404
            
            # Generate unique call ID
            import uuid
            call_id = str(uuid.uuid4())
            
            # Get caller info
            caller = self.appwrite_service.get_user_document(caller_id)
            caller_name = caller.get('name', 'User')
            
            # Create call record
            call_data = {
                'callId': call_id,
                'callerId': caller_id,
                'callerName': caller_name,
                'recipientId': recipient_id,
                'startTime': int(time.time()),
                'status': 'initiating',
                'type': 'audio'
            }
            
            self.appwrite_service.create_call_record(call_data)
            
            # Notify recipient
            self.websocket_service.notify_call(recipient_id, {
                'callId': call_id,
                'callerId': caller_id,
                'callerName': caller_name,
                'type': 'audio'
            })
            
            return {
                'success': True,
                'callId': call_id
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def _get_chat_encryption_key(self, chat_pair_id):
        """Get or create an encryption key for a chat pair"""
        try:
            # Try to get existing key
            key_doc = self.appwrite_service.get_chat_encryption_key(chat_pair_id)
            
            if key_doc and 'keyData' in key_doc:
                # Decode the stored key
                return base64.b64decode(key_doc['keyData'])
            
            # Generate a new key if not found
            new_key = self.encryption_service.generate_key()
            
            # Store the key in database
            key_b64 = base64.b64encode(new_key).decode('utf-8')
            self.appwrite_service.store_chat_encryption_key(chat_pair_id, key_b64)
            
            return new_key
        except Exception as e:
            print(f"Error getting encryption key: {str(e)}")
            # Fallback key derivation
            import hashlib
            return hashlib.sha256(chat_pair_id.encode()).digest()