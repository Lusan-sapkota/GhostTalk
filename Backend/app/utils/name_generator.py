import os
import random

def load_words(filename):
    """Load words from a file"""
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'words', filename)
    with open(path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

def generate_random_name():
    """Generate a random name using adjective + noun"""
    try:
        adjectives = load_words('english-adjectives.txt')
        nouns = load_words('english-nouns.txt')
        
        adjective = random.choice(adjectives).capitalize()
        noun = random.choice(nouns).capitalize()
        
        return f"{adjective}{noun}"
    except Exception as e:
        print(f"Error generating name: {str(e)}")
        return f"User{random.randint(1000, 9999)}"