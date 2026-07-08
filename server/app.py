from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

from controllers.chat_controller import chat_bp

load_dotenv()

app = Flask(__name__)

CORS(app)

app.register_blueprint(chat_bp)

@app.route("/", methods=["GET"])
def health_check():
    return {"status": "ok", "message": "InC Backend is running!"}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
