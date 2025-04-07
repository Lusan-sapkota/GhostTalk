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
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8100')