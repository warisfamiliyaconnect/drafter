import os
from pathlib import Path
from typing import Optional, Dict, Any
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
                    print(f"Loading GGUF model from: {self.model_path}...")
                    self.llm = Llama(
                        model_path=self.model_path,
                        n_ctx=self.params.get("default_model", {}).get("context_window", 8192),
                        n_threads=os.cpu_count() or 4,
                        verbose=False
                    )
                    print("Model loaded successfully into CPU memory.")
                except Exception as e:
                    print(f"Failed to load model ({e}). Falling back to simulation mode.")
                    self.mock_mode = True
            else:
                print("No .gguf model found. Falling back to simulation mode.")
                self.mock_mode = True
        else:
            if not HAS_LLAMA_CPP:
                print("Notice: 'llama-cpp-python' is not installed. Operating in high-fidelity simulation mode.")
            self.mock_mode = True

        self._initialized = True

    def _load_params(self) -> Dict[str, Any]:
        config_path = Path("ai_engine/config/model_params.yaml")
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        return {
            "default_model": {"context_window": 8192, "temperature": 0.7},
            "architect_mode": {"temperature": 0.4},
            "drafter_mode": {"temperature": 0.8},
            "critic_mode": {"temperature": 0.2},
        }

    def _find_model(self) -> Optional[str]:
        model_dir = Path("ai_engine/models")
        if not model_dir.exists():
            return None
        # Recursively search for .gguf files
        gguf_files = list(model_dir.rglob("*.gguf"))
        if gguf_files:
            return str(gguf_files[0])
        return None

    def generate(self, system_prompt: str, user_prompt: str, mode: str = "default") -> str:
        if self.mock_mode or not self.llm:
            return self._mock_generate(system_prompt, user_prompt, mode)

        mode_params = self.params.get(f"{mode}_mode", self.params.get("default_model", {}))
        full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"

        output = self.llm(
            full_prompt,
            max_tokens=1024,
            temperature=mode_params.get("temperature", 0.7),
            top_p=mode_params.get("top_p", 0.9),
            repeat_penalty=mode_params.get("repeat_penalty", 1.1),
            stop=["<|endoftext|>", "User:", "\n\n\n"]
        )
        return output["choices"][0]["text"].strip()

    def _mock_generate(self, system_prompt: str, user_prompt: str, mode: str) -> str:
        """High-fidelity simulation mode for rapid testing without GPU/CPU heavy weights."""
        if mode == "critic":
            # Realistic adversarial critique
            if "flaw" in user_prompt.lower() or "draft 1" in user_prompt.lower():
                return (
                    "- Tone check: Paragraph 2 contains mildly informal transitions.\n"
                    "- Consistency: Ensure all references to terms strictly follow the Global Glossary.\n"
                    "- Depth: Add quantitative metrics to substantiate claims."
                )
            return "PASS - Section satisfies all corporate clarity, terminology, and structural standards."

        elif mode == "drafter":
            return (
                f"This section establishes the strategic framework and core deliverables. "
                f"In accordance with institutional standards, operations are synchronized across all nodes "
                f"to ensure verifiable auditability and high-fidelity output. Empirical benchmarks demonstrate "
                f"a 34% reduction in latency and consistent alignment with defined glossary specifications."
            )

        elif "architect" in system_prompt.lower():
            return (
                "Blueprint planned with 4 core sections: Introduction, Executive Summary, "
                "Detailed Technical Analysis, and Strategic Recommendations."
            )

        # Default refiner response
        return (
            f"This section establishes the institutional framework and verified deliverables. "
            f"Operations are methodically synchronized across all nodes to guarantee rigorous auditability "
            f"and high-fidelity output. Verified empirical benchmarks confirm a 34% reduction in processing latency "
            f"while maintaining strict alignment with approved terminology."
        )


inference_engine = InferenceEngine()
