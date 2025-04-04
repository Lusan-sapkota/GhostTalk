from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import os
from dotenv import load_dotenv
import requests
import json

app = Flask(__name__)
CORS(app)
load_dotenv()

# Appwrite configuration
APPWRITE_ENDPOINT = os.getenv('VITE_APPWRITE_ENDPOINT')
APPWRITE_PROJECT_ID = os.getenv('VITE_APPWRITE_PROJECT_ID')
APPWRITE_DATABASE_ID = os.getenv('VITE_APPWRITE_DATABASE_ID')
APPWRITE_COLLECTION_ID_USERS = os.getenv('VITE_APPWRITE_COLLECTION_ID_USERS')

# Create API key for server-side operations
# Store this securely and use environment variable
APPWRITE_API_KEY = os.getenv('APPWRITE_API_KEY')  # Add this to your .env file

# Load words from files
def load_words(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

try:
    adjectives = load_words('words/adjectives.txt')
    nouns = load_words('words/nouns.txt')
except Exception as e:
    print(f"Error loading word files: {e}")
    adjectives = ["happy", "clever", "brave", "shiny", "gentle"]
    nouns = ["ghost", "cat", "star", "moon", "tiger"]

# Helper function to make Appwrite API requests
def appwrite_request(method, endpoint, data=None, params=None):
    headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY
    }
    
    url = f"{APPWRITE_ENDPOINT}{endpoint}"
    
    if method == 'GET':
        response = requests.get(url, headers=headers, params=params)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)
    
    return response

# Check if username exists in Appwrite
def username_exists(username):
    endpoint = f"/databases/{APPWRITE_DATABASE_ID}/collections/{APPWRITE_COLLECTION_ID_USERS}/documents"
    params = {
        'queries': [f'username={username}']
    }
    
    response = appwrite_request('GET', endpoint, params=params)
    
    if response.status_code == 200:
        data = response.json()
        return len(data.get('documents', [])) > 0
    
    return False

@app.route('/generate-username', methods=['GET'])
def generate_username():
    max_attempts = 10
    attempts = 0
    
    while attempts < max_attempts:
        # Generate a random username
        adj = random.choice(adjectives)
        noun = random.choice(nouns)
        number = random.randint(1, 999)
        username = f"{adj.capitalize()}{noun.capitalize()}{number}"
        
        # Check if username already exists in Appwrite
        try:
            if not username_exists(username):
                return jsonify({"username": username})
            
        except Exception as e:
            print(f"Appwrite error: {e}")
            # If there's an API error, just return the generated username
            return jsonify({"username": username})
        
        attempts += 1
    
    # If all attempts failed to generate a unique username
    return jsonify({"username": f"User{random.randint(10000, 99999)}"})

@app.route('/register', methods=['POST'])
def register():
    from appwrite.client import Client
    from appwrite.services.account import Account
    from appwrite.services.databases import Databases
    from appwrite.id import ID
    
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    gender = data.get('gender')
    remember_me = data.get('rememberMe', False)
    
    # Create Appwrite client
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(APPWRITE_API_KEY)
    
    databases = Databases(client)
    
    try:
        # Check if username already exists
        if username_exists(username):
            return jsonify({"error": "Username already exists"}), 400
        
        # Create user document in Appwrite
        user_data = {
            'username': username,
            'email': email,
            'password': password,  # In production, you should hash this
            'gender': gender,
            'remember': remember_me,
            'createdAt': str(int(time.time()))
        }
        
        # Create user document in the database
        result = databases.create_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_COLLECTION_ID_USERS,
            document_id=ID.unique(),
            data=user_data
        )
        
        return jsonify({"message": "Registration successful", "userId": result["$id"]}), 201
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)