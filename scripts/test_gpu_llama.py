import sys
import os
import time

print("Importing llama_cpp...")
from llama_cpp import Llama

model_path = r"ai_engine/models/qwen3-8b/Qwen3-8B-Q4_K_M.gguf"
print(f"Loading {model_path} with GPU layers offloaded...")

t0 = time.time()
# n_gpu_layers=-1 offloads all layers to the Quadro P4000 GPU!
llm = Llama(
    model_path=model_path,
    n_gpu_layers=33,
    n_ctx=4096,
    verbose=True
)
print(f"Model loaded in {time.time() - t0:.2f}s!")

prompt = "<|im_start|>system\nYou are a corporate legal drafter.<|im_end|>\n<|im_start|>user\nWrite a 1-sentence clause about governing law in Delaware.<|im_end|>\n<|im_start|>assistant\n"
print("Generating response...")
t1 = time.time()
res = llm(prompt, max_tokens=60, stop=["<|im_end|>"])
gen_time = time.time() - t1
text = res["choices"][0]["text"].strip()
print("\n--- Model Output ---")
print(text)
print("--------------------")
print(f"Generation took {gen_time:.2f}s (~{res['usage']['completion_tokens']/gen_time:.1f} tokens/sec)")
