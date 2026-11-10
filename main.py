#!/usr/bin/env python3
"""
Application entry point for the Drafter system.
Launches the unified LangGraph Autonomous Document Agent CLI.
"""

import sys
from pathlib import Path

# Ensure root directory is on Python path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from cli import main

if __name__ == "__main__":
    main()
