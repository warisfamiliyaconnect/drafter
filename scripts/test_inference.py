import httpx
import json

url = "http://localhost:11434/v1/chat/completions"
payload = {
    "model": "drafter-qwen3",
    "messages": [
        {"role": "system", "content": "You are a professional corporate legal drafter."},
        {"role": "user", "content": "Write a 1-sentence opening clause for a Mutual Non-Disclosure Agreement."}
    ],
    "temperature": 0.7,
    "max_tokens": 120
}

print(f"Connecting to {url}...")
try:
    response = httpx.post(url, json=payload, timeout=60.0)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    print("\n--- Model Response ---")
    print(content.strip())
    print("----------------------\nSuccess! Real GPU/Ollama model inference is working.")
except Exception as e:
    print("Inference error:", e)
