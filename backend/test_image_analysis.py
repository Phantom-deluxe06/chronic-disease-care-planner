"""Test image analysis with correct inline_data format"""
import os
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
import base64

api_key = os.environ.get('GEMINI_API_KEY')
print(f"API Key present: {bool(api_key)}")

genai.configure(api_key=api_key)

# Try gemini-1.5-pro with inline_data format
model = genai.GenerativeModel('gemini-1.5-pro')
print("Using model: gemini-1.5-pro")

# Small valid red PNG 10x10
png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNYAADqkC/fHVQdUAAAAASUVORK5CYII="

print("Testing with inline_data format...")
try:
    response = model.generate_content([
        "What color is this image? Reply in one word.",
        {
            "inline_data": {
                "mime_type": "image/png",
                "data": png_base64
            }
        }
    ])
    print(f"SUCCESS!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"FAILED: {type(e).__name__}")
    print(f"Error: {e}")
    
    # Check if it's a quota issue
    error_str = str(e).lower()
    if "429" in str(e) or "quota" in error_str or "resource" in error_str:
        print("\n⚠️ This appears to be a QUOTA/RATE LIMIT issue!")
        print("The Gemini API has limits on image analysis requests.")
        print("Try again later or upgrade to a paid tier.")
