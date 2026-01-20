"""
Test script to verify Gemini API connectivity and list available models
Run this script to ensure the API key is valid and working
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def list_available_models():
    """List all available Gemini models"""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found!")
        return []
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        print("\n📋 AVAILABLE MODELS:")
        print("-" * 60)
        
        models = []
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                models.append(model.name)
                print(f"  ✅ {model.name}")
                print(f"     Display: {model.display_name}")
                print(f"     Input limit: {model.input_token_limit} tokens")
                print()
        
        return models
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return []

def test_gemini_api(model_name="gemini-1.5-flash"):
    """Test if Gemini API is properly configured and working"""
    
    # Check if API key exists
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file!")
        print("\nTo fix this:")
        print("1. Open .env file in the root directory")
        print("2. Add: GEMINI_API_KEY=your_api_key_here")
        print("3. Get your API key from: https://makersuite.google.com/app/apikey")
        return False
    
    print(f"✅ API Key found: {api_key[:8]}...{api_key[-4:]}")
    
    # Try to import and configure Gemini
    try:
        import google.generativeai as genai
        print("✅ google-generativeai package installed")
    except ImportError:
        print("❌ ERROR: google-generativeai package not installed!")
        print("Run: pip install google-generativeai")
        return False
    
    # Configure the API
    try:
        genai.configure(api_key=api_key)
        print("✅ Gemini API configured")
    except Exception as e:
        print(f"❌ ERROR configuring Gemini: {e}")
        return False
    
    # Try to initialize the model
    try:
        model = genai.GenerativeModel(model_name)
        print(f"✅ Model '{model_name}' initialized")
    except Exception as e:
        print(f"❌ ERROR initializing model: {e}")
        return False
    
    # Make a simple test request
    try:
        print(f"\n🔄 Testing API with model '{model_name}'...")
        response = model.generate_content("Say 'Hello! Gemini API is working!' in exactly those words.")
        print(f"✅ API Response: {response.text.strip()}")
        return True
    except Exception as e:
        print(f"❌ ERROR making API request: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("           GEMINI API CONNECTION TEST")
    print("=" * 60)
    print()
    
    # First list available models
    models = list_available_models()
    
    print("=" * 60)
    print("           TESTING API CONNECTION")
    print("=" * 60)
    print()
    
    # Try models in order of preference
    models_to_try = [
        "gemini-2.5-flash",      # Latest recommended model
        "gemini-1.5-flash",      # Fallback
        "gemini-2.0-flash",      # Alternative
    ]
    
    success = False
    working_model = None
    
    for model in models_to_try:
        print(f"\n🔄 Trying model: {model}")
        if test_gemini_api(model):
            success = True
            working_model = model
            break
        else:
            print(f"   ⚠️ Model {model} failed, trying next...")
    
    print()
    print("=" * 60)
    if success:
        print(f"✅ SUCCESS! Working model: {working_model}")
        print(f"\n💡 RECOMMENDATION: Update ai_analyzer.py to use '{working_model}'")
        print(f"   Line 34: gemini_model = genai.GenerativeModel('{working_model}')")
    else:
        print("❌ ALL MODELS FAILED - Check your API key and rate limits")
        print("   Wait a few minutes and try again if you hit rate limits")
    print("=" * 60)
