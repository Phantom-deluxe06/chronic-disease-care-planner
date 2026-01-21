"""List available Gemini models - save to file"""
import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai

api_key = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=api_key)

output = "Available models for generateContent:\n"
for m in genai.list_models():
    if 'generateContent' in str(m.supported_generation_methods):
        output += f"  - {m.name}\n"

print(output)
with open('available_models.txt', 'w') as f:
    f.write(output)
print("Saved to available_models.txt")
