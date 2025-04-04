from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import os
from dotenv import load_dotenv
import time
import json
import requests

app = Flask(__name__)
CORS(app)
load_dotenv()

# Load words from files
def load_words(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

try:
    # Update path to match your workspace structure
    adjectives = load_words('./words/english-adjectives.txt')
    nouns = load_words('./words/english-nouns.txt')
    print(f"Loaded {len(adjectives)} adjectives and {len(nouns)} nouns")
except Exception as e:
    print(f"Error loading word files: {e}")
    adjectives = ["happy", "clever", "brave", "shiny", "gentle"]
    nouns = ["ghost", "cat", "star", "moon", "tiger"]

# Appwrite configuration
APPWRITE_ENDPOINT = os.getenv('VITE_APPWRITE_ENDPOINT')
APPWRITE_PROJECT_ID = os.getenv('VITE_APPWRITE_PROJECT_ID')
APPWRITE_API_KEY = os.getenv('VITE_APPWRITE_API_KEY')
APPWRITE_DATABASE_ID = os.getenv('VITE_APPWRITE_DATABASE_ID')
APPWRITE_COLLECTION_ID_USERS = os.getenv('VITE_APPWRITE_COLLECTION_ID_USERS')

def check_username_exists(username):
    headers = {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Use Appwrite's database API to query for the username
    url = f"{APPWRITE_ENDPOINT}/databases/{APPWRITE_DATABASE_ID}/collections/{APPWRITE_COLLECTION_ID_USERS}/documents"
    params = {
        'queries': [f'equal("username", "{username}")']
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            return len(data.get('documents', [])) > 0
        return False
    except Exception as e:
        print(f"Error checking username: {e}")
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
        if not check_username_exists(username):
            return jsonify({"username": username})
        
        attempts += 1
    
    # If all attempts failed to generate a unique username
    return jsonify({"username": f"User{random.randint(10000, 99999)}"})

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    gender = data.get('gender')
    remember_me = data.get('rememberMe', False)
    
    # Check if the username already exists
    if check_username_exists(username):
        return jsonify({"error": "Username already exists"}), 400
    
    # Create headers for Appwrite API
    headers = {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Create user document in Appwrite
    document_data = {
        'username': username,
        'email': email,
        'password': password,  # In production, you should hash this before storing
        'gender': gender,
        'remember': remember_me,
        'createdAt': str(int(time.time()))
    }
    
    # Use Appwrite's API to create a document
    url = f"{APPWRITE_ENDPOINT}/databases/{APPWRITE_DATABASE_ID}/collections/{APPWRITE_COLLECTION_ID_USERS}/documents"
    
    try:
        response = requests.post(url, headers=headers, json={
            'documentId': 'unique()',
            'data': document_data
        })
        
        if response.status_code == 201:
            return jsonify({"message": "Registration successful", "userId": response.json()['$id']}), 201
        else:
            print(f"Error response from Appwrite: {response.text}")
            return jsonify({"error": "Registration failed"}), 500
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)