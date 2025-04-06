from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
# This is a simple Flask application with CORS enabled. We will apply the same concept in the app