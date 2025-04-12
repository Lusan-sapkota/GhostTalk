from app import create_app

app = create_app()

if __name__ == '__main__':
    # Enable CORS headers in server responses
    app.run(host='0.0.0.0', port=5000, debug=True, 
           threaded=True, 
           # Add these options to ensure headers are sent properly:
           processes=1)
# This is a simple Flask application with CORS enabled. We will apply the same concept in the app