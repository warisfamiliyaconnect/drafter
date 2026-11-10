"""
Telemetry module for tracking LLM inference performance.
"""
import time
from typing import Optional
from drafter.utils.logging import logger

class TelemetryTracker:
    """
    Tracks and reports low-level inference performance metrics.

    Attributes:
        context_window (int): The maximum context window of the model.
        n_layers (int): Number of transformer layers.
        n_head_kv (int): Number of KV heads.
        head_dim (int): Dimension of each head.
        kv_bytes_per_elem (float): Memory size per element in bytes.
    """

    def __init__(
        self,
        context_window: int = 32768,
        n_layers: int = 36,
        n_head_kv: int = 8,
        head_dim: int = 128,
        kv_bytes_per_elem: float = 1.0625
    ) -> None:
        """Initializes the telemetry tracker with model architecture parameters."""
        self.context_window = context_window
        self.n_layers = n_layers
        self.n_head_kv = n_head_kv
        self.head_dim = head_dim
        self.kv_bytes_per_elem = kv_bytes_per_elem

        self.start_time: Optional[float] = None
        self.first_token_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.token_count: int = 0
        self.input_tokens: int = 0

        self.reset()

    def reset(self) -> None:
        """Resets all counters and timers for a new inference turn."""
        self.start_time = None
        self.first_token_time = None
        self.end_time = None
        self.token_count = 0
        self.input_tokens = 0

    def start(self, input_tokens: int) -> None:
        """
        Signals the start of a generation turn.

        Args:
            input_tokens (int): The number of tokens in the prompt.
        """
        self.reset()
        self.input_tokens = input_tokens
        self.start_time = time.time()
        logger.debug(f"Telemetry started with {input_tokens} input tokens.")

    def record_token(self) -> None:
        """Records the arrival of a single output token."""
        if self.first_token_time is None:
            self.first_token_time = time.time()
        self.token_count += 1

    def stop(self) -> None:
        """Signals the end of the generation turn."""
        self.end_time = time.time()
        logger.debug(f"Telemetry stopped. Total tokens generated: {self.token_count}")

    def generate_report(self) -> str:
        """
        Calculates and returns a formatted performance report.

        Returns:
            str: A multi-line string containing TTFT, TPOT, and memory utilization.
        """
        if self.token_count == 0 or self.first_token_time is None:
            return "No tokens generated."

        # Pre-fill Phase (Prompt Ingestion / TTFT)
        prefill_time = self.first_token_time - self.start_time
        prefill_speed = self.input_tokens / prefill_time if prefill_time > 0 else 0

        # Generation Phase (Decode / Token-by-token)
        total_latency = self.end_time - self.start_time
        generation_time = self.end_time - self.first_token_time

        # Inter-Token Latency (Time Per Output Token)
        tpot = generation_time / (self.token_count - 1) if self.token_count > 1 else generation_time

        # Generation Speed (Tokens Per Second)
        tokens_per_second = 1 / tpot if tpot > 0 else 0

        # Normalized Latency
        normalized_latency = total_latency / self.token_count

        # Token Efficiency Ratio (Output Tokens / Input Tokens)
        efficiency_ratio = self.token_count / self.input_tokens if self.input_tokens > 0 else 0

        # KV Pressure & RAM Utilization
        total_context_used = self.input_tokens + self.token_count
        kv_pressure = (total_context_used / self.context_window) * 100

        # 2 (K + V) * layers * kv_heads * head_dim * bytes_per_element
        bytes_per_token = 2 * self.n_layers * self.n_head_kv * self.head_dim * self.kv_bytes_per_elem
        kv_ram_used_gb = (total_context_used * bytes_per_token) / (1024 ** 3)
        kv_ram_alloc_gb = (self.context_window * bytes_per_token) / (1024 ** 3)

        report = [
            "-" * 60,
            "--- TELEMETRY REPORT ---",
            f"1. Prompt Pre-fill (TTFT):      {prefill_time:.3f} s ({prefill_speed:.1f} tok/s across {self.input_tokens} input tokens)",
            f"2. Generation Speed (Decode):   {tokens_per_second:.1f} tok/s",
            f"3. Inter-Token Latency (TPOT):  {tpot * 1000:.1f} ms/token",
            f"4. Normalized Total Latency:    {normalized_latency * 1000:.1f} ms/token",
            f"5. Token Efficiency Ratio:      {efficiency_ratio:.2f}x (Out: {self.token_count} | In: {self.input_tokens})",
            f"6. Context Budget Used:         {kv_pressure:.2f}% ({total_context_used:,} / {self.context_window:,} tokens)",
            f"7. KV Memory Budget Used:       {kv_ram_used_gb:.3f} GB / {kv_ram_alloc_gb:.2f} GB",
            "-" * 60,
        ]

        return "\n".join(report)
