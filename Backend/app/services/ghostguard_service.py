import os
import pickle
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

class GhostGuardService:
    """Content moderation service for GhostTalk"""
    
    def __init__(self):
        """Initialize the GhostGuard service"""
        self.model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                        'models', 'ghostguard_model.pkl')
        self.model = None
        self.last_confidence = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print("GhostGuard model loaded successfully")
            else:
                print("GhostGuard model not found, will need training")
        except Exception as e:
            print(f"Error loading GhostGuard model: {str(e)}")
    
    def _save_model(self):
        """Save the trained model to disk"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print("GhostGuard model saved successfully")
            return True
        except Exception as e:
            print(f"Error saving GhostGuard model: {str(e)}")
            return False
    
    def _preprocess_text(self, text):
        """Basic text preprocessing"""
        if not text:
            return ""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters
        text = re.sub(r'[^\w\s]', '', text)
        return text
    
    def _train_model(self, training_data=None, csv_path=None):
        """Train the content moderation model"""
        try:
            X, y = None, None
            
            if training_data:
                X, y = training_data
            elif csv_path:
                df = pd.read_csv(csv_path)
                X = df['text'].tolist()
                y = df['is_inappropriate'].astype(int).tolist()
            else:
                raise ValueError("Either training_data or csv_path must be provided")
            
            # Create a pipeline with TF-IDF and logistic regression
            self.model = Pipeline([
                ('tfidf', TfidfVectorizer(preprocessor=self._preprocess_text, 
                                          min_df=2, max_df=0.95)),
                ('classifier', LogisticRegression(C=1.0, class_weight='balanced'))
            ])
            
            # Train the model
            self.model.fit(X, y)
            
            # Save the model
            return self._save_model()
            
        except Exception as e:
            print(f"Error training GhostGuard model: {str(e)}")
            return False
    
    def contains_inappropriate_content(self, text):
        """Check if content contains inappropriate text"""
        if not self.model:
            print("WARNING: GhostGuard model not loaded, allowing all content")
            return False, 0.0
        
        try:
            # Predict and get probability
            prediction = self.model.predict([text])[0]
            proba = self.model.predict_proba([text])[0]
            
            # Store confidence for the predicted class
            confidence = proba[1] if prediction == 1 else proba[0]
            
            # Return True if inappropriate, False if appropriate
            return prediction == 1, confidence
        except Exception as e:
            print(f"Error checking content: {str(e)}")
            # Default to allowing content in case of errors
            return False, 0.0
    
    def filter_message(self, text):
        """Filter inappropriate words from a message"""
        is_inappropriate, confidence = self.contains_inappropriate_content(text)
        
        if is_inappropriate:
            # Simple filtering - replace with asterisks
            # In a real implementation, you'd have a more sophisticated word-level filter
            words = text.split()
            filtered_words = []
            
            for word in words:
                # Check if this individual word is inappropriate
                word_inappropriate, _ = self.contains_inappropriate_content(word)
                if word_inappropriate and len(word) > 3:
                    # Replace with asterisks, keeping first and last character
                    filtered_word = word[0] + '*' * (len(word) - 2) + word[-1]
                    filtered_words.append(filtered_word)
                else:
                    filtered_words.append(word)
            
            filtered_text = ' '.join(filtered_words)
            return filtered_text, True, confidence
        else:
            return text, False, confidence

# Create a singleton instance
ghostguard_service = GhostGuardService()