import sys
from loguru import logger

def setup_logging():
    """
    Configures Loguru for production-grade structured logging.
    Logs are directed to both stdout (for development) and a file.
    """
    # Remove default handler
    logger.remove()

    # 1. Console Handler: Focused on readability for developers
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
    )

    # 2. File Handler: Detailed logs for debugging (stored in data/logs)
    import os
    log_dir = "data/logs"
    os.makedirs(log_dir, exist_ok=True)

    logger.add(
        f"{log_dir}/drafter.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        rotation="10 MB",
        retention="10 days",
        compression="zip",
    )

# Initialize logging immediately on module import
setup_logging()
