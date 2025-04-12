from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .config import Config

load_dotenv()  # Make sure this is called before creating the Flask app

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS properly to accept requests from the frontend
    # This is critical for handling preflight OPTIONS requests
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8100", "http://localhost:8101", "capacitor://localhost"]}}, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Test-IP"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Debug output to verify configuration loading
    print(f"Loaded database ID: {app.config.get('APPWRITE_DATABASE_ID')}")
    print(f"Loaded avatar bucket ID: {app.config.get('APPWRITE_STORAGE_ID_FREE_AVATAR')}")
    
    with app.app_context():
        # Register blueprints 
        from .routes.auth_routes import auth_bp
        from .routes.chat_routes import chat_bp
        from .routes.room_routes import room_bp
        from .routes.user_routes import user_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(chat_bp, url_prefix='/api/chat')
        app.register_blueprint(room_bp, url_prefix='/api/room')
        app.register_blueprint(user_bp, url_prefix='/api/user')
    
    # Add a simple health check route
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'ok'}, 200
    
    return app