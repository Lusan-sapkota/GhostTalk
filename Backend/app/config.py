import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configs
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    
    # JWT configs
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour in seconds
    
    # Appwrite configs
    APPWRITE_ENDPOINT = os.environ.get('APPWRITE_ENDPOINT')
    APPWRITE_PROJECT_ID = os.environ.get('APPWRITE_PROJECT_ID')
    APPWRITE_API_KEY = os.environ.get('APPWRITE_API_KEY')
    
    # Collection IDs
    APPWRITE_COLLECTION_ID_AUTH = os.environ.get('APPWRITE_COLLECTION_ID_AUTH')
    APPWRITE_COLLECTION_ID_CHATS = os.environ.get('APPWRITE_COLLECTION_ID_CHATS')
    APPWRITE_COLLECTION_ID_CHAT_ROOMS = os.environ.get('APPWRITE_COLLECTION_ID_CHAT_ROOMS')