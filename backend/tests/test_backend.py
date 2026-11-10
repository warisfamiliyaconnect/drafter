import httpx
import asyncio
import subprocess
import time
import os
import json

async def test_backend():
    # 1. Start the FastAPI server in the background
    print("Starting server...")
    log_path = "backend/tests/server_log.txt"
    with open(log_path, "w") as log_file:
        process = subprocess.Popen(
            [r".\venv\Scripts\python.exe", "-m", "app.main"],
            cwd="backend",
            stdout=log_file,
            stderr=log_file,
            text=True
        )

    # Wait for server to boot
    max_retries = 15
    server_up = False
    for i in range(max_retries):
        try:
            async with httpx.AsyncClient() as health_client:
                resp = await health_client.get("http://127.0.0.1:8000/")
                print(f"Server is up! Status: {resp.status_code}")
                server_up = True
                break
        except Exception as e:
            print(f"Waiting for server... ({i+1}/{max_retries}) - {e}")
            time.sleep(2)

    if not server_up:
        print("Server failed to start in time. Checking logs...")
        if os.path.exists(log_path):
            with open(log_path, "r") as f:
                print("\n--- SERVER LOG START ---")
                print(f.read())
                print("--- SERVER LOG END ---")
        process.terminate()
        return

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # Test 1: Agent Run
        print("\nTesting /agent/run...")
        try:
            resp = await client.post("/agent/run", params={"thread_id": "test_1"})
            data = resp.json()
            assert "blueprint" in data
            assert "full_text" in data
            print("✅ /agent/run passed")
        except Exception as e:
            print(f"❌ /agent/run failed: {e}")

        # Test 2: Import DOCX
        print("\nTesting /import...")
        try:
            abs_path = os.path.abspath("backend/data/test_import.docx")
            resp = await client.post("/import", json={"file_path": abs_path})
            data = resp.json()
            assert "ast" in data
            assert len(data["ast"]) > 0
            print("✅ /import passed")
        except Exception as e:
            print(f"❌ /import failed: {e}")

        # Test 3: Export DOCX
        print("\nTesting /export...")
        try:
            mock_sections = [
                {"title": "Test Section 1", "content": "Hello World"},
                {"title": "Test Section 2", "content": "AI Drafted Content"}
            ]
            resp = await client.post("/export", json={"sections": mock_sections})
            data = resp.json()
            assert "file_path" in data
            assert os.path.exists(data["file_path"])
            print("✅ /export passed")
        except Exception as e:
            print(f"❌ /export failed: {e}")

        # Test 4: Agent Stream (SSE)
        print("\nTesting /agent/stream...")
        try:
            async with client.stream("GET", "/agent/stream", params={"thread_id": "test_stream"}) as response:
                events_found = 0
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        events_found += 1
                        if events_found >= 2:
                            break
                assert events_found > 0
                print("✅ /agent/stream passed")
        except Exception as e:
            print(f"❌ /agent/stream failed: {e}")

    process.terminate()
    print("\nTests complete. Server terminated.")

if __name__ == "__main__":
    asyncio.run(test_backend())
