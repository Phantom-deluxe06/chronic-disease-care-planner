"""
Test script to verify Gemini 2.5 Flash Image model works
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_model():
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    
    if not GEMINI_API_KEY:
        print("❌ ERROR: GEMINI_API_KEY not found in environment")
        return False
    
    print(f"✅ API Key found (length: {len(GEMINI_API_KEY)})")
    
    try:
        import google.generativeai as genai
        print("✅ google.generativeai imported successfully")
        
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ API key configured")
        
        # Test with gemini-2.5-flash-image model
        model_name = 'gemini-2.5-flash-image'
        print(f"\n🔄 Testing model: {model_name}")
        
        try:
            model = genai.GenerativeModel(model_name)
            print(f"✅ Model '{model_name}' initialized")
            
            # Simple text test
            response = model.generate_content("Say 'Hello, I am working!' in exactly 5 words")
            print(f"✅ Response: {response.text.strip()}")
            print(f"\n🎉 SUCCESS! Model {model_name} is working!")
            return True
            
        except Exception as e:
            print(f"❌ Error with {model_name}: {e}")
            
            # Try alternative models
            alternatives = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
            for alt_model in alternatives:
                print(f"\n🔄 Trying alternative: {alt_model}")
                try:
                    model = genai.GenerativeModel(alt_model)
                    response = model.generate_content("Say 'Hello' in 1 word")
                    print(f"✅ {alt_model} works! Response: {response.text.strip()}")
                except Exception as alt_e:
                    print(f"❌ {alt_model} failed: {alt_e}")
            
            return False
            
    except ImportError as e:
        print(f"❌ ImportError: {e}")
        print("Install with: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 GEMINI MODEL TEST")
    print("=" * 50 + "\n")
    
    success = test_gemini_model()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ TEST PASSED")
    else:
        print("❌ TEST FAILED")
    print("=" * 50)
