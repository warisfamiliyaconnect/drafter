"""
Inference layer for LLM communication.
Provides a standardized interface for interacting with local or remote models.
"""
try:
    import llama_cpp
    from llama_cpp import Llama
    HAS_LLAMA_CPP = True
except ImportError:
    class _LlamaFallback:
        def __init__(self, *args, **kwargs):
            raise ImportError("llama_cpp is not installed")

    class _MockLlamaModule:
        Llama = _LlamaFallback
        GGML_TYPE_Q8_0 = 8

    import sys
    llama_cpp = _MockLlamaModule()
    sys.modules["llama_cpp"] = llama_cpp
    Llama = _LlamaFallback
    HAS_LLAMA_CPP = False
from typing import List, Dict, Any, Optional, Union
from drafter.config import settings
from drafter.utils.logging import logger
from drafter.core.exceptions import ModelLoadError, DrafterInfrastructureError

class LLMInterface:
    """
    Abstraction layer for LLM inference.
    Allows the system to remain agnostic of the underlying model provider.
    """

    def __init__(self, model_path: Optional[str] = None) -> None:
        """
        Initializes the LLM wrapper.

        Args:
            model_path (str, optional): Path to the model weights. Defaults to settings.MODEL_PATH.
        """
        self.model_path = model_path or settings.MODEL_PATH
        logger.info(f"Initializing LLM from path: {self.model_path}")
        self.llm = self._init_llama()

    def _init_llama(self) -> Llama:
        """Configures the Llama-cpp-python instance."""
        try:
            return Llama(
                model_path=self.model_path,
                n_ctx=settings.N_CTX,
                n_threads=settings.N_THREADS,
                n_threads_batch=settings.N_THREADS_BATCH,
                n_batch=512,
                n_ubatch=512,
                type_k=llama_cpp.GGML_TYPE_Q8_0,
                type_v=llama_cpp.GGML_TYPE_Q8_0,
                flash_attn=True,
                use_mmap=True,
                use_mlock=True,
                verbose=False
            )
        except Exception as e:
            logger.critical(f"Failed to initialize Llama model: {e}")
            raise ModelLoadError(f"Critical failure loading model weights from {self.model_path}: {e}") from e

    def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 2048,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Union[Dict[str, Any], Any]:
        """
        Generates a response from the model.

        Args:
            messages (List[Dict[str, str]]): The conversation history.
            max_tokens (int): Maximum tokens to generate.
            temperature (float): Sampling temperature.
            stream (bool): Whether to stream the output.

        Returns:
            Union[Dict[str, Any], Any]: The completion result or stream generator.
        """
        return self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream
        )

    def tokenize(self, text: str) -> List[int]:
        """
        Converts text to token IDs.

        Args:
            text (str): The input text.

        Returns:
            List[int]: The resulting token sequence.
        """
        return self.llm.tokenize(text.encode("utf-8"))
