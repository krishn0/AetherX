import sys
import os

# Ensure we can import from the app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.core.config import settings
    print(f"Loaded Groq API Key: {'Present' if settings.groq_api_key else 'Missing'}")
    if settings.groq_api_key:
        print(f"Key preview: {settings.groq_api_key[:5]}...")
except Exception as e:
    print(f"Error loading settings: {e}")
