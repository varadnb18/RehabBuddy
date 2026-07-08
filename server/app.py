from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Import controllers
from controllers.chat_controller import chat_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all domains on all routes to allow React frontend to communicate
CORS(app)

# Register Blueprints (Controllers)
app.register_blueprint(chat_bp)

@app.route("/", methods=["GET"])
def health_check():
    return {"status": "ok", "message": "InC Backend is running!"}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
