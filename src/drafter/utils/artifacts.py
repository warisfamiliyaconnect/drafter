"""
Handles the persistence of reasoning artifacts, trajectories, and intermediate outputs.
"""
import os
import re
from pathlib import Path
from typing import Optional
from drafter.config import settings
from drafter.utils.logging import logger

class ArtifactManager:
    """
    Manages the storage of AI-generated artifacts to ensure transparency and auditability.
    Organizes artifacts by session ID and task type.
    """

    def __init__(self) -> None:
        self.base_dir = Path(settings.PROJECT_ROOT) / "data" / "artifacts"
        os.makedirs(self.base_dir, exist_ok=True)

    def _get_session_dir(self, session_id: str) -> Path:
        """Returns and creates a directory specific to a session."""
        session_dir = self.base_dir / session_id
        os.makedirs(session_dir, exist_ok=True)
        return session_dir

    def save_artifact(self, session_id: str, task_id: str, filename: str, content: str) -> str:
        """
        Saves a specific piece of content as an artifact file.

        Args:
            session_id (str): The ID of the active session.
            task_id (str): A unique identifier for the task (e.g., 'turn_1_reflect').
            filename (str): The name of the file (e.g., 'critique.md').
            content (str): The text content to save.

        Returns:
            str: The absolute path to the saved artifact.
        """
        try:
            # Create folder structure: data/artifacts/{session_id}/{task_id}/
            target_dir = self._get_session_dir(session_id) / task_id
            os.makedirs(target_dir, exist_ok=True)

            # Clean filename to prevent path injection
            clean_filename = re.sub(r'[^\w\-_\.]', '_', filename)
            file_path = target_dir / clean_filename

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

            logger.debug(f"Artifact saved: {file_path}")
            return str(file_path.absolute())
        except Exception as e:
            logger.error(f"Failed to save artifact {filename}: {e}")
            return ""

    def log_trajectory(self, session_id: str, task_id: str, entry: str) -> None:
        """
        Appends a line to a trajectory log file.
        Used for recording the ReAct loop (Thought -> Action -> Observation).
        """
        try:
            target_dir = self._get_session_dir(session_id) / task_id
            os.makedirs(target_dir, exist_ok=True)

            log_path = target_dir / "trajectory.log"
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(entry + "\n")
        except Exception as e:
            logger.error(f"Failed to log trajectory entry: {e}")

    def get_session_artifacts_path(self, session_id: str) -> str:
        """Returns the root directory containing all artifacts for a session."""
        return str((self.base_dir / session_id).absolute())

# Global instance for easy access across the system
artifact_manager = ArtifactManager()
