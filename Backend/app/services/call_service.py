import time
import random
import string
import uuid

class CallService:
    def __init__(self):
        from .appwrite_service import AppwriteService
        from .websocket_service import WebSocketService
        
        self.appwrite_service = AppwriteService()
        self.websocket_service = WebSocketService()
    
    def initiate_call(self, caller_id, recipient_id, call_type='audio'):
        """Initiate a call with a user"""
        try:
            # Check if recipient exists
            recipient = self.appwrite_service.get_user_document(recipient_id)
            if not recipient:
                return {'success': False, 'message': 'Recipient not found'}, 404
            
            # Generate unique call ID
            call_id = str(uuid.uuid4())
            
            # Get caller details
            caller = self.appwrite_service.get_user_document(caller_id)
            caller_name = caller.get('name', 'User')
            
            # Record call in database
            call_data = {
                'callId': call_id,
                'callerId': caller_id,
                'callerName': caller_name,
                'recipientId': recipient_id,
                'startTime': int(time.time()),
                'status': 'initiating',
                'type': call_type
            }
            
            call_record = self.appwrite_service.create_call_record(call_data)
            
            # Notify recipient via WebSocket
            self.websocket_service.notify_call(recipient_id, {
                'callId': call_id,
                'callerId': caller_id,
                'callerName': caller_name,
                'type': call_type
            })
            
            return {
                'success': True,
                'callId': call_id
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def end_call(self, call_id, user_id):
        """End an ongoing call"""
        try:
            # Get call record
            call = self.appwrite_service.database.get_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.calls_collection_id,
                document_id=call_id
            )
            
            # Verify user is part of this call
            if call['callerId'] != user_id and call['recipientId'] != user_id:
                return {'success': False, 'message': 'Not authorized to end this call'}, 403
            
            # Calculate duration
            end_time = int(time.time())
            duration = end_time - call['startTime']
            
            # Update call record
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.calls_collection_id,
                document_id=call_id,
                data={
                    'status': 'ended',
                    'endTime': end_time,
                    'duration': duration
                }
            )
            
            # Notify other party
            other_user_id = call['recipientId'] if user_id == call['callerId'] else call['callerId']
            
            self.websocket_service.send_notification(other_user_id, {
                'type': 'call_ended',
                'callId': call_id,
                'endedBy': user_id,
                'timestamp': end_time
            })
            
            return {
                'success': True,
                'message': 'Call ended',
                'duration': duration
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def get_call_history(self, user_id):
        """Get call history for a user"""
        try:
            # Get calls where user is either caller or recipient
            calls = self.appwrite_service.get_user_calls(user_id)
            
            return {
                'success': True,
                'calls': calls
            }, 200
        except Exception as e:
            print(f"Error getting call history: {str(e)}")
            return {'success': False, 'message': str(e)}, 500