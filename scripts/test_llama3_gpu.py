import sys
import os
import time
from llama_cpp import Llama

model_path = os.path.expanduser(r"~\.ollama\models\blobs\sha256-dde5aa3fc5ffc17176b5e8bdc82f587b24b2678c6c66101bf7da77af9f7ccdff")
print(f"Testing Llama 3.2 3B with llama-cpp-python: {model_path}...")

t0 = time.time()
# Load with CUDA
llm = Llama(
    model_path=model_path,
    n_gpu_layers=28,  # all 28 layers offloaded to Quadro P4000 GPU!
    n_ctx=2048,
    verbose=True
)
print(f"Model loaded in {time.time() - t0:.2f}s!")

prompt = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are a professional corporate legal drafter.<|eot_id|><|start_header_id|>user<|end_header_id|>\nWrite a 1-sentence opening clause for a Mutual Non-Disclosure Agreement.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n"
print("Generating response on GPU...")
t1 = time.time()
res = llm(prompt, max_tokens=80, stop=["<|eot_id|>"])
gen_time = time.time() - t1
text = res["choices"][0]["text"].strip()
print("\n--- Model Output ---")
print(text)
print("--------------------")
print(f"Generation took {gen_time:.2f}s (~{res['usage']['completion_tokens']/gen_time:.1f} tokens/sec on Quadro P4000!)")
