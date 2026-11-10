"""
Custom exception hierarchy for the Drafter project.
"""

class DrafterError(Exception):
    """Base class for all exceptions raised by the Drafter system."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class DrafterInfrastructureError(DrafterError):
    """Raised when low-level infrastructure (I/O, Model, OS) fails."""
    pass

class DrafterReasoningError(DrafterError):
    """Raised when the AI reasoning process fails (parsing, tool usage)."""
    pass

class ModelLoadError(DrafterInfrastructureError):
    """Raised when the LLM weights cannot be loaded from disk."""
    pass

class SessionPersistenceError(DrafterInfrastructureError):
    """Raised when saving or loading a conversation session fails."""
    pass

class ToolExecutionError(DrafterReasoningError):
    """Raised when a ReAct tool fails to execute correctly."""
    pass

class ActionParseError(DrafterReasoningError):
    """Raised when model output does not conform to the required JSON contract."""
    pass
