import requests
import json

resp = requests.post("http://127.0.0.1:8000/api/chat", json={
    "prompt": "Hello",
    "dataset_state": "mock",
    "data_info": {},
    "safe_summary": "mock"
})

print("Status:", resp.status_code)
print("Response:", resp.text)
