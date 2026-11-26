import os

file_path = r"ai_engine/models/qwen3-8b/Qwen3-8B-Q4_K_M.gguf"
print(f"Reading header of {file_path}...")

with open(file_path, "r+b") as f:
    # Read the first 1MB where metadata KV resides
    header_chunk = f.read(1024 * 1024)
    count = header_chunk.count(b"qwen3")
    print(f"Found {count} occurrences of b'qwen3' in the metadata header.")
    
    if count == 11:
        new_header = header_chunk.replace(b"qwen3", b"qwen2")
        f.seek(0)
        f.write(new_header)
        print("Successfully patched header: 'qwen3' -> 'qwen2'!")
    else:
        print(f"Unexpected count ({count}), aborting patch.")
