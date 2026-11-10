"""
Manages multi-turn conversation state and session persistence.
"""
from __future__ import annotations

import os
import json
import time
from dataclasses import dataclass
from typing import List, Dict, Optional, Callable
from drafter.config import settings
from drafter.utils.logging import logger
from drafter.core.exceptions import SessionPersistenceError

@dataclass
class Message:
    """Represents a single message in a conversation."""
    role: str  # "system", "user", or "assistant"
    content: str

    def to_dict(self) -> Dict[str, str]:
        """Returns the message as a dictionary for JSON serialization."""
        return {"role": self.role, "content": self.content}


class ConversationManager:
    """
    Production-grade multi-turn conversation manager with multi-session history.

    Attributes:
        max_context_tokens (int): Token budget for the conversation.
        token_counter (Callable): Function to calculate token length.
        sessions_dir (str): Directory where session JSON files are stored.
    """

    def __init__(
        self,
        system_prompt: str = "You are a helpful, smart, and concise AI assistant.",
        max_context_tokens: Optional[int] = None,
        token_counter: Optional[Callable[[str], int]] = None,
        sessions_dir: Optional[str] = None,
    ) -> None:
        """
        Initializes the conversation manager.

        Args:
            system_prompt (str): The initial system instruction.
            max_context_tokens (int, optional): Override for the global token budget.
            token_counter (Callable, optional): Function to count tokens.
            sessions_dir (str, optional): Override for the global sessions directory.
        """
        self.max_context_tokens = max_context_tokens or settings.MAX_CONTEXT_TOKENS
        self.token_counter = token_counter or self._default_token_counter
        self.sessions_dir = sessions_dir or settings.SESSIONS_DIR
        self._system_prompt = system_prompt
        self._messages: List[Message] = []

        os.makedirs(self.sessions_dir, exist_ok=True)
        self.start_new_session()

    @staticmethod
    def _default_token_counter(text: str) -> int:
        """Basic character-based token approximation."""
        return max(1, len(text) // 4)

    @property
    def messages(self) -> List[Dict[str, str]]:
        """Returns the current conversation as a list of role/content dicts."""
        return [m.to_dict() for m in self._messages]

    @property
    def raw_messages(self) -> List[Message]:
        """Returns the raw Message objects."""
        return self._messages

    @property
    def turns_count(self) -> int:
        """Calculates the number of user turns in the session."""
        return sum(1 for m in self._messages if m.role == "user")

    def start_new_session(self) -> None:
        """Starts a fresh session with a unique timestamped ID."""
        self.session_id = f"session_{int(time.time())}"
        self.created_at = time.strftime("%Y-%m-%d %H:%M:%S")
        self.title = "New Session"
        self._messages = []
        if self._system_prompt:
            self._messages.append(Message(role="system", content=self._system_prompt))
        logger.debug(f"Started new session: {self.session_id}")

    def set_system_prompt(self, prompt: str) -> None:
        """
        Updates the system prompt and refreshes the message history.

        Args:
            prompt (str): The new system instruction.
        """
        self._system_prompt = prompt
        self._messages = [m for m in self._messages if m.role != "system"]
        if prompt:
            self._messages.insert(0, Message(role="system", content=prompt))
        self.save_session()

    def add_user_message(self, content: str) -> None:
        """
        Adds a user message and updates the session title if it's the first turn.

        Args:
            content (str): The user's input text.
        """
        if self.turns_count == 0:
            clean_title = content.strip().replace("\n", " ")
            self.title = (clean_title[:45] + "...") if len(clean_title) > 45 else clean_title

        self._messages.append(Message(role="user", content=content))
        self._enforce_budget()
        self.save_session()

    def add_assistant_message(self, content: str) -> None:
        """
        Adds an assistant response to the conversation.

        Args:
            content (str): The model's generated text.
        """
        self._messages.append(Message(role="assistant", content=content))
        self._enforce_budget()
        self.save_session()

    def clear(self, keep_system: bool = True) -> None:
        """
        Clears the conversation history.

        Args:
            keep_system (bool): Whether to preserve the system prompt.
        """
        self._messages = []
        if keep_system and self._system_prompt:
            self._messages.append(Message(role="system", content=self._system_prompt))
        self.save_session()
        logger.info("Conversation history cleared.")

    def total_tokens(self) -> int:
        """Calculates the total token count of the current conversation."""
        total = 0
        for m in self._messages:
            total += self.token_counter(m.content) + 4
        return total + 2

    def _enforce_budget(self) -> None:
        """Prunes the oldest messages to stay within the max_context_tokens budget."""
        while self.total_tokens() > (self.max_context_tokens - 1024) and len(self._messages) > 2:
            start_idx = 1 if self._messages[0].role == "system" else 0
            if start_idx >= len(self._messages) - 1:
                break
            self._messages.pop(start_idx)
            if start_idx < len(self._messages) and self._messages[start_idx].role == "assistant":
                self._messages.pop(start_idx)

    def save_session(self) -> None:
        """Persists the current session to a JSON file in the sessions directory."""
        if self.turns_count == 0:
            return

        filepath = os.path.join(self.sessions_dir, f"{self.session_id}.json")
        payload = {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "title": self.title,
            "turns_count": self.turns_count,
            "system_prompt": self._system_prompt,
            "messages": [m.to_dict() for m in self._messages]
        }
        temp_path = f"{filepath}.tmp"
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, filepath)
        except Exception as e:
            logger.error(f"Failed to save session {self.session_id}: {e}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise SessionPersistenceError(f"Could not save session {self.session_id} to disk: {e}") from e

    def list_saved_sessions(self) -> List[Dict]:
        """
        Lists all available sessions from the filesystem.

        Returns:
            List[Dict]: A list of session metadata sorted by date (newest first).
        """
        sessions = []
        if not os.path.exists(self.sessions_dir):
            return sessions

        for fname in os.listdir(self.sessions_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(self.sessions_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    sessions.append({
                        "session_id": data.get("session_id", fname.replace(".json", "")),
                        "created_at": data.get("created_at", "Unknown Date"),
                        "title": data.get("title", "Untitled Session"),
                        "turns_count": data.get("turns_count", 0),
                        "filepath": fpath
                    })
                except Exception as e:
                    logger.debug(f"Skipping corrupted session file {fname}: {e}")
                    continue

        sessions.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        return sessions

    def load_session(self, filepath: str) -> bool:
        """
        Loads a session from a JSON file.

        Args:
            filepath (str): Path to the session file.

        Returns:
            bool: True if loading was successful, False otherwise.
        """
        if not os.path.exists(filepath):
            logger.warning(f"Session file not found: {filepath}")
            return False
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.session_id = data.get("session_id", self.session_id)
            self.created_at = data.get("created_at", self.created_at)
            self.title = data.get("title", self.title)
            self._system_prompt = data.get("system_prompt", self._system_prompt)
            raw = data.get("messages", [])
            self._messages = [Message(role=m["role"], content=m["content"]) for m in raw]
            return True
        except Exception as e:
            logger.error(f"Error loading session from {filepath}: {e}")
            raise SessionPersistenceError(f"Could not load session from {filepath}: {e}") from e

    def __len__(self) -> int:
        """Returns the number of messages in the current conversation."""
        return len(self._messages)
