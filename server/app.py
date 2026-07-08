from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

API_KEY = os.environ.get("GEMINI_API_KEY")

@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing prompt in request"}), 400

    prompt = data["prompt"]

    try:
        response = requests.post(
            "https://generativeai.googleapis.com/v1/generate",
            json={
                "prompt": prompt,
                "model": "gemini-2.0-flash-lite"
            },
            headers={"Authorization": f"Bearer {API_KEY}"}
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to generate response from Gemini API"}), 500

        data = response.json()
        # Assume the response contains a key "generated_text" for the output
        generated_text = data.get("generated_text", "")
        return jsonify({"response": generated_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
