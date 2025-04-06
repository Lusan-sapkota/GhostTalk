from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app)
    
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