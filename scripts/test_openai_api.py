import openai
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get API Key
api_key = os.getenv("OPENAI_API_KEY")

# Test API Call
try:
    response = openai.models.list()
    print("✅ API Key is working! Models available:", [model.id for model in response.data])
except openai.OpenAIError as e:
    print("❌ API Key is invalid or has no quota:", e)

