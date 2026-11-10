from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional
from drafter.utils.logging import logger

class Settings(BaseSettings):
    """
    Centralized configuration for Drafter.
    Loads values from environment variables or a .env file.
    """
    # Project Root
    PROJECT_ROOT: Path = Path(__file__).parent.parent.parent

    # Model Configuration
    MODEL_PATH: str = "models/qwen3-8b/Qwen3-8B-Q4_K_M.gguf"
    MAX_CONTEXT_TOKENS: int = 32768
    DEFAULT_TEMPERATURE: float = 0.7

    # Directory Configuration
    SESSIONS_DIR: str = "data/sessions"
    EXPORTS_DIR: str = "data/exports"
    MODELS_DIR: str = "data/models"

    # Model Hyperparameters
    N_CTX: int = 32768
    N_THREADS: int = 4
    N_THREADS_BATCH: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Global settings instance
settings = Settings()
