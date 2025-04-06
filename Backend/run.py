from flask import Flask
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/')
def hello_world():
    return 'Hello, World!'
@app.route('/api')
def api():
    return 'API endpoint'
@app.route('/api/data')
def data():
    return {'data': 'This is some data'}
@app.route('/api/another')
def another():
    return {'data': 'This is some other data'}


if __name__ == '__main__':
    app.run(debug=True)
# This is a simple Flask application with CORS enabled. We will apply the same concept in the app