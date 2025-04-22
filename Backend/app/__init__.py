from flask import Flask, jsonify, request
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
    
    # Define all allowed origins - both localhost and GitHub Codespaces
    codespace_prefix = "automatic-engine-xqqxj997v77hv67q"
    allowed_origins = [
        f"https://{codespace_prefix}-8100.app.github.dev",  # GitHub Codespaces frontend
        "http://localhost:8100",                            # Local development frontend
        "https://localhost:8100",                           # Secure local frontend
        "http://localhost:3000",                            # Alternative local port
        "null"                                              # For file:// protocol in some tests
    ]
    
    # Use a single robust CORS handler for all responses
    @app.after_request
    def handle_cors(response):
        origin = request.headers.get('Origin', '')
        
        # Always allow any GitHub Codespaces domain
        if origin and (".github.dev" in origin or 
                       origin in allowed_origins or 
                       origin.startswith('http://localhost') or
                       origin.startswith('https://localhost')):
            
            # Set CORS headers for this response
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            
            # Print debug info for troubleshooting
            print(f"CORS: Allowing origin: {origin}")
            
        return response
    
    # Dedicated OPTIONS handler for preflight requests
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        response = jsonify({'status': 'ok'})
        origin = request.headers.get('Origin', '')
        
        # Use the same origin check logic as the after_request handler
        if origin and (".github.dev" in origin or 
                      origin in allowed_origins or 
                      origin.startswith('http://localhost') or
                      origin.startswith('https://localhost')):
            
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            
            print(f"OPTIONS: Allowing origin: {origin} for path: {path}")
            
        return response, 200
    
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