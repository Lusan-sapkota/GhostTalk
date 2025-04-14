from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import jwt
import os

# Initialize SocketIO with CORS support
socketio = SocketIO(cors_allowed_origins="*")

class WebSocketService:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        # Apply the SocketIO instance to the Flask app
        socketio.init_app(app)
        
        # Register socket event handlers
        @socketio.on('connect')
        def handle_connect():
            print(f"Client connected: {request.sid}")
            token = request.args.get('token')
            if token:
                try:
                    # Verify token
                    secret_key = app.config.get('JWT_SECRET_KEY', os.environ.get('JWT_SECRET_KEY', 'your-secret-key'))
                    payload = jwt.decode(token, secret_key, algorithms=['HS256'])
                    user_id = payload.get('sub')
                    
                    if user_id:
                        # Join user to their personal room for direct messages
                        join_room(user_id)
                        
                        # Update user's online status
                        from ..services.appwrite_service import AppwriteService
                        appwrite = AppwriteService()
                        appwrite.update_user_online_status(user_id, True)
                        
                        print(f"User {user_id} connected")
                except Exception as e:
                    print(f"Token verification error: {str(e)}")
            
            return True
        
        @socketio.on('disconnect')
        def handle_disconnect():
            print(f"Client disconnected: {request.sid}")
            # Handle user disconnect if needed
        
        @socketio.on('join')
        def on_join(data):
            room = data.get('room')
            if room:
                join_room(room)
                print(f"Client {request.sid} joined room: {room}")
        
        @socketio.on('leave')
        def on_leave(data):
            room = data.get('room')
            if room:
                leave_room(room)
                print(f"Client {request.sid} left room: {room}")
        
        @socketio.on('message')
        def handle_message(data):
            room = data.get('room')
            if room:
                emit('message', data, room=room, include_self=False)
        
        # Add WebRTC signaling event handlers
        @socketio.on('rtc_offer')
        def handle_offer(data):
            recipient_id = data.get('recipientId')
            if recipient_id:
                emit('rtc_offer', data, room=recipient_id)
        
        @socketio.on('rtc_answer')
        def handle_answer(data):
            caller_id = data.get('callerId')
            if caller_id:
                emit('rtc_answer', data, room=caller_id)
        
        @socketio.on('rtc_ice_candidate')
        def handle_ice_candidate(data):
            target_id = data.get('targetId')
            if target_id:
                emit('rtc_ice_candidate', data, room=target_id)
        
        @socketio.on('rtc_call_end')
        def handle_call_end(data):
            target_id = data.get('targetId')
            if target_id:
                emit('rtc_call_end', data, room=target_id)
                
        @socketio.on('typing')
        def handle_typing(data):
            chat_id = data.get('chatId')
            user_id = data.get('userId')
            is_typing = data.get('isTyping', False)
            
            if chat_id and user_id:
                emit('typing_status', {
                    'userId': user_id,
                    'isTyping': is_typing
                }, room=chat_id, include_self=False)
    
    def send_message(self, room, data):
        """Send a message to a specific room"""
        socketio.emit('message', data, room=room)
    
    def send_notification(self, user_id, notification_data):
        """Send a notification to a specific user"""
        socketio.emit('notification', notification_data, room=user_id)
    
    def notify_friend_request(self, user_id, request_data):
        """Notify a user about a new friend request"""
        socketio.emit('friend_request', request_data, room=user_id)
    
    def notify_call(self, user_id, call_data):
        """Notify a user about an incoming call"""
        socketio.emit('incoming_call', call_data, room=user_id)
        
    def _get_user_id_from_token(self, token):
        """Extract user ID from JWT token"""
        import jwt
        from flask import current_app
        
        try:
            decoded = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return decoded.get('sub')
        except:
            return None