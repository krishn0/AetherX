import os
import sys
from dotenv import load_dotenv

# Load env from backend/.env if it exists, or current directory
backend_env_path = os.path.join("backend", ".env")
if os.path.exists(backend_env_path):
    print(f"Loading env from {backend_env_path}")
    load_dotenv(backend_env_path)
else:
    print("Loading env from current directory or system env")
    load_dotenv()

try:
    from groq import Groq
except ImportError:
    print("Error: 'groq' library not installed. Please run 'pip install groq'")
    sys.exit(1)

api_key = os.getenv("GROQ_API_KEY") or os.getenv("groq_api_key")

if not api_key:
    # Try finding it in the file manually in case python-dotenv fails (unlikely but safe)
    if os.path.exists(backend_env_path):
        with open(backend_env_path, 'r') as f:
            for line in f:
                if line.strip().upper().startswith("GROQ_API_KEY"):
                    print("Found GROQ_API_KEY in .env file (maybe not loaded correctly?)")

    print("ERROR: GROQ_API_KEY not found in environment variables.")
    sys.exit(1)

print(f"API Key found: {api_key[:5]}...{api_key[-4:]}")

client = Groq(api_key=api_key)
model_name = "llama-3.3-70b-versatile"

print(f"Testing connectivity with model: {model_name}")

try:
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Hello, how are you?"
            }
        ],
        model=model_name,
        timeout=10.0
    )
    print("SUCCESS! Response received:")
    print(chat_completion.choices[0].message.content)

except Exception as e:
    print("\nFAILED TO CONNECT OR GENERATE RESPONSE")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    
    # Suggest fixes
    if "401" in str(e) or "AuthenticationError" in str(e):
        print("\nSUGGESTION: Your API Key seems invalid. Please generate a new one at https://console.groq.com/keys")
    elif "404" in str(e) or "NotFoundError" in str(e):
        if "model" in str(e).lower():
            print(f"\nSUGGESTION: The model '{model_name}' might be decommissioned or invalid.")
            print("Try 'llama3-8b-8192' or 'mixtral-8x7b-32768'.")
