import os
import sys
import pandas as pd

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ghostguard_service import GhostGuardService

def train_from_csv(csv_path):
    """Train the GhostGuard model from a CSV file."""
    try:
        # Load the CSV file
        df = pd.read_csv(csv_path)
        
        # Check if the required columns exist
        if 'text' not in df.columns or 'is_inappropriate' not in df.columns:
            print("CSV must have 'text' and 'is_inappropriate' columns")
            return False
            
        # Extract training data
        X = df['text'].tolist()
        y = df['is_inappropriate'].astype(int).tolist()
        
        # Create and train the model
        service = GhostGuardService()
        service._train_model(training_data=(X, y))
        
        print(f"Model trained successfully with {len(X)} examples")
        return True
        
    except Exception as e:
        print(f"Error training model: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python train_ghostguard.py path/to/training_data.csv")
        sys.exit(1)
        
    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        sys.exit(1)
        
    success = train_from_csv(csv_path)
    sys.exit(0 if success else 1)