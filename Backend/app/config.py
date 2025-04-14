import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    # Flask configs
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False') == 'True'
    
    # JWT configs
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 600))  # 10 minutes
    
    # Appwrite configs
    APPWRITE_ENDPOINT = os.environ.get('APPWRITE_ENDPOINT')
    APPWRITE_PROJECT_ID = os.environ.get('APPWRITE_PROJECT_ID')
    APPWRITE_API_KEY = os.environ.get('APPWRITE_API_KEY')
    APPWRITE_DATABASE_ID = os.environ.get('APPWRITE_DATABASE_ID')
    APPWRITE_STORAGE_ID_FREE_AVATAR = os.environ.get('APPWRITE_AVATAR_BUCKET_ID', 
    os.environ.get('APPWRITE_STORAGE_ID_FREE_AVATAR'))
    
    # Collection IDs
    APPWRITE_COLLECTION_ID_AUTH = os.environ.get('APPWRITE_COLLECTION_ID_AUTH')
    APPWRITE_COLLECTION_ID_CHATS = os.environ.get('APPWRITE_COLLECTION_ID_CHATS')
    APPWRITE_COLLECTION_ID_CHAT_ROOMS = os.environ.get('APPWRITE_COLLECTION_ID_CHAT_ROOMS')
    
    # Frontend URL for email verification links, etc.
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8101')
    
    # Email configuration
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.zoho.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))

    # Default (no-reply) email
    SMTP_USER_NOREPLY = os.getenv('SMTP_USER_NOREPLY', 'no-reply@ghosttalk.me')
    SMTP_PASS_NOREPLY = os.getenv('SMTP_PASS_NOREPLY', '')  # No default password
    SENDER_NAME = os.getenv('SENDER_NAME', 'GhostTalk')
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'no-reply@ghosttalk.me')
    REPLY_TO = os.getenv('REPLY_TO', 'support@ghosttalk.me')

    # Support email
    SMTP_USER_SUPPORT = os.getenv('SMTP_USER_SUPPORT', 'support@ghosttalk.me')
    SMTP_PASS_SUPPORT = os.getenv('SMTP_PASS_SUPPORT', '')  # No default password

    # Billing email
    SMTP_USER_BILLING = os.getenv('SMTP_USER_BILLING', 'billing@ghosttalk.me')
    SMTP_PASS_BILLING = os.getenv('SMTP_PASS_BILLING', '')  # No default password

    # Add this to your config class
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')