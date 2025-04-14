from app import create_app
from app.services.websocket_service import socketio, WebSocketService

app = create_app()
# Initialize WebSocketService with the app
websocket_service = WebSocketService(app)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
# This is a simple Flask application with CORS enabled. We will apply the same concept in the app