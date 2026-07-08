import os
from flask import Blueprint, request, jsonify
from google import genai
import openai
# Create a Blueprint (Controller) for chat routes
chat_bp = Blueprint('chat', __name__)

# Get API Keys
API_KEYS = [
    os.environ.get("GEMINI_API_KEY"),
    os.environ.get("GEMINI_API_KEY_2")
]
# Filter out None or empty values
API_KEYS = [key for key in API_KEYS if key]

if not API_KEYS:
    print("WARNING: No GEMINI_API_KEY environment variables are set.")


SYSTEM_PROMPT = """You are Poco, a friendly penguin who is an expert rehabilitation assistant for humans.

- You have expertise in physical therapy, injury recovery, and rehabilitation exercises
- Keep responses concise and friendly
- For questions outside rehabilitation, politely redirect
- Always remind users to consult their healthcare provider
- Never repeat your introduction after the first message"""

@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """
    Receives conversation history and a new prompt from the frontend,
    sends it to Gemini, and returns the response.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    prompt = data.get("prompt", "")
    history = data.get("history", [])
    is_initial = data.get("is_initial", False)

    try:
        # Build the full conversation string to give context to the model
        conversation_context = ""
        for msg in history:
            role = "User" if msg.get("role") == "user" else "Assistant"
            conversation_context += f"{role}: {msg.get('content')}\n"
            
        if is_initial:
            full_prompt = f"{SYSTEM_PROMPT}\n\nIntroduce yourself as Poco in 2-3 short sentences. Ask how you can help with their recovery."
        else:
            full_prompt = f"{SYSTEM_PROMPT}\n\nConversation history:\n{conversation_context}\n\nUser: {prompt}\n\nProvide a direct and helpful response to the user's question without repeating your introduction. If they ask about an exercise, provide detailed instructions and benefits."
        
        # Try each API key in order as a fallback mechanism
        response_text = None
        last_error = None
        
        for key in API_KEYS:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model='gemini-2.0-flash-lite',
                    contents=full_prompt
                )
                response_text = response.text
                break # Success! Break out of the loop
            except Exception as e:
                print(f"Gemini API Key failed. Trying next key if available. Error: {e}")
                last_error = e
                continue # Try the next key
                
        # If all Gemini keys fail, FALLBACK TO OPENAI
        if response_text is None:
            print("All Gemini keys exhausted. Falling back to OpenAI...")
            try:
                openai_key = os.environ.get("OPENAI_API_KEY")
                if not openai_key:
                    raise Exception("OpenAI API key not configured in .env")
                
                openai_client = openai.OpenAI(api_key=openai_key)
                completion = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "user", "content": full_prompt}
                    ]
                )
                response_text = completion.choices[0].message.content
            except Exception as openai_err:
                print(f"OpenAI Fallback also failed: {openai_err}")
                last_error = f"Gemini Error: {last_error} | OpenAI Error: {openai_err}"
                
        # If OpenAI fails, FALLBACK TO GROQ
        if response_text is None:
            print("OpenAI exhausted. Falling back to Groq...")
            try:
                groq_key = os.environ.get("GROQ_API_KEY")
                if not groq_key:
                    raise Exception("Groq API key not configured in .env")
                
                from groq import Groq
                groq_client = Groq(api_key=groq_key)
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "user", "content": full_prompt}
                    ]
                )
                response_text = completion.choices[0].message.content
            except Exception as groq_err:
                print(f"Groq Fallback also failed: {groq_err}")
                raise Exception(f"{last_error} | Groq Error: {groq_err}")
            
        return jsonify({"response": response_text})

    except Exception as e:
        print(f"Error in chat controller: {e}")
        return jsonify({"error": str(e)}), 500

