import os
from pathlib import Path
from typing import Optional, Dict, Any, Generator
import yaml

try:
    from llama_cpp import Llama
    HAS_LLAMA_CPP = True
except ImportError:
    HAS_LLAMA_CPP = False


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

        self.params = self._load_params()
        self.mock_mode = os.getenv("MOCK_INFERENCE", "").lower() in ("1", "true", "yes")
        self.model_path = None
        self.llm = None

        if not self.mock_mode and HAS_LLAMA_CPP:
            self.model_path = self._find_model()
            if self.model_path:
                try:
                    n_gpu = int(os.getenv("N_GPU_LAYERS", "28"))
                    print(f"[InferenceEngine] Loading GGUF model: {self.model_path} with {n_gpu} GPU layers on Quadro P4000...")
                    self.llm = Llama(
                        model_path=self.model_path,
                        n_gpu_layers=n_gpu,
                        n_ctx=min(4096, self.params.get("default_model", {}).get("context_window", 4096)),
                        n_threads=os.cpu_count() or 4,
                        verbose=False
                    )
                    print("[InferenceEngine] Model loaded successfully into GPU memory!")
                except Exception as e:
                    print(f"[InferenceEngine] Failed to load model ({e}). Falling back to simulation mode.")
                    self.mock_mode = True
            else:
                print("[InferenceEngine] No .gguf model found. Falling back to simulation mode.")
                self.mock_mode = True
        else:
            if not HAS_LLAMA_CPP:
                print("[InferenceEngine] 'llama-cpp-python' is not installed. Operating in simulation mode.")
            self.mock_mode = True

        self._initialized = True

    def _load_params(self) -> Dict[str, Any]:
        config_path = Path("ai_engine/config/model_params.yaml")
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        return {
            "default_model": {"context_window": 4096, "temperature": 0.7, "max_tokens": 512},
            "architect_mode": {"temperature": 0.4, "max_tokens": 512},
            "drafter_mode": {"temperature": 0.7, "max_tokens": 600},
            "critic_mode": {"temperature": 0.2, "max_tokens": 256},
        }

    def _find_model(self) -> Optional[str]:
        # Priority 1: Llama 3.2 3B Instruct in ai_engine
        p1 = Path("ai_engine/models/llama3.2-3b/Llama-3.2-3B-Instruct.gguf")
        if p1.exists():
            return str(p1.resolve())

        # Priority 2: Check any GGUF in ai_engine/models
        model_dir = Path("ai_engine/models")
        if model_dir.exists():
            for f in model_dir.rglob("*.gguf"):
                if "Llama" in f.name:
                    return str(f.resolve())
            all_gguf = list(model_dir.rglob("*.gguf"))
            if all_gguf:
                return str(all_gguf[0].resolve())

        # Priority 3: Check Ollama blob cache
        ollama_blob = os.path.expanduser(r"~\.ollama\models\blobs\sha256-dde5aa3fc5ffc17176b5e8bdc82f587b24b2678c6c66101bf7da77af9f7ccdff")
        if os.path.exists(ollama_blob):
            return ollama_blob

        return None

    def generate(self, system_prompt: str, user_prompt: str, mode: str = "default") -> str:
        if self.mock_mode or not self.llm:
            return self._mock_generate(system_prompt, user_prompt, mode)

        mode_params = self.params.get(f"{mode}_mode", self.params.get("default_model", {}))
        max_tokens = mode_params.get("max_tokens", 512)
        temperature = mode_params.get("temperature", 0.7)

        try:
            output = self.llm.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=mode_params.get("top_p", 0.9),
                repeat_penalty=mode_params.get("repeat_penalty", 1.1),
            )
            return output["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[InferenceEngine] Execution error: {e}. Falling back to mock generator.")
            return self._mock_generate(system_prompt, user_prompt, mode)

    def stream_generate(self, system_prompt: str, user_prompt: str, mode: str = "default") -> Generator[str, None, None]:
        if self.mock_mode or not self.llm:
            yield self._mock_generate(system_prompt, user_prompt, mode)
            return

        mode_params = self.params.get(f"{mode}_mode", self.params.get("default_model", {}))
        max_tokens = mode_params.get("max_tokens", 600)
        temperature = mode_params.get("temperature", 0.7)

        try:
            stream = self.llm.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            for chunk in stream:
                delta = chunk["choices"][0].get("delta", {})
                content = delta.get("content")
                if content:
                    yield content
        except Exception as e:
            print(f"[InferenceEngine] Stream error: {e}")
            yield self._mock_generate(system_prompt, user_prompt, mode)

    def _mock_generate(self, system_prompt: str, user_prompt: str, mode: str) -> str:
        if mode == "critic":
            return "PASS - Section satisfies corporate clarity and legal requirements."
        elif mode == "drafter":
            return (
                "This Agreement establishes the mutual terms and conditions governing the exchange "
                "of proprietary information between the Parties. All disclosures shall be maintained "
                "in strict confidence and protected using reasonable commercial safeguards."
            )
        elif "architect" in system_prompt.lower():
            return "Blueprint planned: 1. Introduction, 2. Confidentiality Terms, 3. Term & Termination, 4. Miscellaneous."
        return "This section defines standard obligations and compliance metrics for all parties."


inference_engine = InferenceEngine()
