import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv("GROQ_API_KEY")
print(f"Key loaded: {bool(api_key)}")

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=api_key.strip()
)

try:
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print("Success:", resp.choices[0].message.content)
except Exception as e:
    print("Error:", e)
