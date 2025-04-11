import os
import random
import string
import logging
from flask import current_app

def load_words(filename):
    """Load words from a file"""
    try:
        path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'words', filename)
        current_app.logger.debug(f"Loading words from {path}")
        
        with open(path, 'r') as file:
            words = [line.strip() for line in file if line.strip()]
            current_app.logger.debug(f"Loaded {len(words)} words from {filename}")
            return words
    except Exception as e:
        current_app.logger.error(f"Error loading words file {filename}: {str(e)}")
        # Return some default words as a fallback
        if 'adjectives' in filename:
            return ["Happy", "Brave", "Smart", "Kind", "Swift", "Gentle", "Noble", "Wise"]
        else:
            return ["Ghost", "Spirit", "Soul", "Mind", "Guide", "Sage", "Oracle", "Phantom"]

def generate_random_name():
    """Generate a unique username without numbers"""
    try:
        current_app.logger.debug("Starting random name generation")
        
        adjectives = load_words('english-adjectives.txt')
        nouns = load_words('english-nouns.txt')
        
        # Get two random adjectives for more uniqueness
        adjective1 = random.choice(adjectives).capitalize()
        adjective2 = random.choice(adjectives).capitalize()
        noun = random.choice(nouns).capitalize()
        
        current_app.logger.debug(f"Selected words: adj1={adjective1}, adj2={adjective2}, noun={noun}")
        
        # Create variations to ensure uniqueness without numbers
        variations = [
            f"{adjective1}{noun}",  # Simple adjective+noun
            f"{adjective1}{adjective2}{noun}",  # Two adjectives + noun
            f"{noun}{adjective1}",  # Reversed order
            f"The{adjective1}{noun}",  # Adding "The" prefix
            f"{adjective1}The{noun}",  # Adding "The" as a connector
            f"{adjective1}Of{noun}",  # Using "Of" as a connector
        ]
        
        chosen = random.choice(variations)
        current_app.logger.debug(f"Generated username: {chosen}")
        return chosen
    except Exception as e:
        current_app.logger.error(f"Error generating name: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Generate a truly random fallback without numbers
        letters = string.ascii_letters
        prefix = ''.join(random.choice(letters) for _ in range(5)).capitalize()
        suffix = ''.join(random.choice(letters) for _ in range(5)).capitalize()
        result = f"{prefix}{suffix}"
        current_app.logger.debug(f"Generated fallback username: {result}")
        return result