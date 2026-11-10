import pytest
from unittest.mock import MagicMock, patch
from drafter.inference.llm import LLMInterface
from drafter.core.exceptions import ModelLoadError

def test_llm_interface_init_failure(mocker):
    """Verify that ModelLoadError is raised when LLM initialization fails."""
    # Mock Llama to raise an exception during init
    mocker.patch('llama_cpp.Llama', side_effect=Exception("Weights not found"))

    with pytest.raises(ModelLoadError) as excinfo:
        LLMInterface(model_path="invalid/path")

    assert "Critical failure loading model weights" in str(excinfo.value)

def test_llm_interface_init_success(mocker):
    """Verify LLMInterface initializes correctly when path is valid."""
    # We must patch the Llama class in the module where it is USED, not where it is defined.
    # The module is drafter.inference.llm
    with patch('drafter.inference.llm.Llama') as mock_llama:
        llm = LLMInterface(model_path="valid/path")
        assert llm.model_path == "valid/path"
        mock_llama.assert_called_once()
