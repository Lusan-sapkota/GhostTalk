from .services.websocket_service import socketio
from flask import request
from flask_socketio import emit, join_room, leave_room

def register_socket_events():
    # These events are now registered in websocket_service.py
    # This function is kept for compatibility but doesn't need to do anything
    pass