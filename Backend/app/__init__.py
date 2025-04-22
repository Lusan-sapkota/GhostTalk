from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .config import Config
from .routes.support_routes import support_bp
from .routes.billing_routes import billing_bp
from .routes.chat_routes import chat_bp
from .routes.friend_routes import friend_bp
from .routes.search_routes import search_bp
from .services.websocket_service import WebSocketService, socketio
from .routes.notification_routes import notification_bp
from app.routes.content_filter_routes import content_filter_bp
from app.routes.community_routes import community_bp

# Create a global instance
websocket_service = WebSocketService()

load_dotenv()  # Make sure this is called before creating the Flask app

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS properly to accept requests from the frontend
    CORS(app, supports_credentials=True,resources={r"/api/*": {
        "origins": "http://192.168.18.2:8100",  # Match your frontend origin exactly
        "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],  # Add HEAD method
        "supports_credentials": True
    }})
    
    # Add OPTIONS route handler for all routes
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://192.168.18.2:8100')  # Match frontend exactly
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Debug output to verify configuration loading
    print(f"Loaded database ID: {app.config.get('APPWRITE_DATABASE_ID')}")
    print(f"Loaded avatar bucket ID: {app.config.get('APPWRITE_STORAGE_ID_FREE_AVATAR')}")
    
    # Initialize SocketIO with the Flask app
    websocket_service.init_app(app)
    
    with app.app_context():
        # Register blueprints 
        from .routes.auth_routes import auth_bp
        from .routes.chat_routes import chat_bp
        from .routes.room_routes import room_bp
        from .routes.user_routes import user_bp
        from .routes.dev_routes import dev_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(chat_bp, url_prefix='/api/chat')
        app.register_blueprint(room_bp, url_prefix='/api/room')
        app.register_blueprint(user_bp, url_prefix='/api/user')
        app.register_blueprint(dev_bp, url_prefix='/api/dev')
        app.register_blueprint(support_bp, url_prefix='/api/support')
        app.register_blueprint(billing_bp, url_prefix='/api/billing')
        app.register_blueprint(friend_bp, url_prefix='/api/friend')
        app.register_blueprint(search_bp, url_prefix='/api/search')
        app.register_blueprint(notification_bp, url_prefix='/api')
        app.register_blueprint(content_filter_bp, url_prefix='/api/content-filter')
        app.register_blueprint(community_bp, url_prefix='/api/community')
    
    # Add a simple health check route
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'ok'}, 200
    
    return app