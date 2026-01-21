"""Test with gemini-2.0-flash model"""
import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai
import base64

api_key = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=api_key)

# Use the correct model name
model = genai.GenerativeModel('models/gemini-2.0-flash')

# Read prescription
img_path = r'C:/Users/Ajay Balaji/.gemini/antigravity/brain/aa32581f-f067-4efb-b8a1-b5a0deec3743/uploaded_image_1769004091110.png'
with open(img_path, 'rb') as f:
    img_data = f.read()

print(f'Image size: {len(img_data)} bytes')
print('Testing with gemini-2.0-flash...')

result = ""
try:
    response = model.generate_content([
        'List medications from this prescription as JSON: {"medications": [{"name": "...", "dosage": "...", "frequency": "..."}]}',
        {
            'inline_data': {
                'mime_type': 'image/png',
                'data': base64.b64encode(img_data).decode('utf-8')
            }
        }
    ])
    result = f"SUCCESS!\n{response.text}"
except Exception as e:
    result = f"FAILED: {type(e).__name__}\nError: {e}"

print(result)
with open('test_result.txt', 'w') as f:
    f.write(result)
