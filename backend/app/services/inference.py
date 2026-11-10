import os
import yaml
from llama_cpp import Llama
from typing import Optional

class InferenceEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InferenceEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        # 1. Load Model Parameters
        self.params = self._load_params()

        # 2. Locate GGUF Model
        self.model_path = self._find_model()

        # 3. Initialize Llama-CPP
        print(f"Loading GGUF model from: {self.model_path}...")
        self.llm = Llama(
            model_path=self.model_path,
            n_ctx=self.params['default_model']['context_window'],
            n_threads=os.cpu_count(), # Use all available CPU cores
            verbose=False
        )
        print("Model loaded successfully into CPU memory.")
        self._initialized = True

    def _load_params(self):
        with open("ai_engine/config/model_params.yaml", "r") as f:
            return yaml.safe_load(f)

    def _find_model(self) -> str:
        model_dir = "ai_engine/models"
        files = [f for f in os.listdir(model_dir) if f.endswith(".gguf")]
        if not files:
            raise FileNotFoundError("No .gguf model file found in ai_engine/models/")
        return os.path.join(model_dir, files[0])

    def generate(self, system_prompt: str, user_prompt: str, mode: str = "default") -> str:
        # Determine sampling parameters based on the agent mode
        mode_params = self.params.get(f"{mode}_mode", self.params['default_model'])

        # Construct the prompt (Basic ChatML style)
        full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"

        output = self.llm(
            full_prompt,
            max_tokens=1024,
            temperature=mode_params.get('temperature', 0.7),
            top_p=mode_params.get('top_p', 0.9),
            repeat_penalty=mode_params.get('repeat_penalty', 1.1),
            stop=["<|endoftext|>", "User:", "\n\n\n"]
        )

        return output['choices'][0]['text'].strip()

# Singleton instance
inference_engine = InferenceEngine()
