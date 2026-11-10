"""
Autonomous ReAct agent for dynamic task execution.
"""
from __future__ import annotations

import json
import os
import re
from typing import Dict, Any, Callable, Optional, List, Union
from drafter.inference.llm import LLMInterface
from drafter.managers.conversation import ConversationManager
from drafter.managers.telemetry import TelemetryTracker
from drafter.utils.exporter import convert_markdown_to_docx
from drafter.utils.logging import logger
from drafter.core.exceptions import ToolExecutionError, ActionParseError

# ANSI styling constants for TUI output
GRAY = "\033[90m"
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"
RED = "\033[31m"


class AutonomousAgent:
    """
    Production-grade Autonomous ReAct Agent.

    Instead of hardcoding sequential passes, this agent dynamically decides its
    own execution path at each step:
      - Can immediately answer simple queries in 1 step.
      - Can invoke `critic_audit` to evaluate complex drafts.
      - Can execute `python_interpreter` for exact math / logic verification.
      - Halts autonomously via `finish` when satisfied with the response.
    """

    def __init__(
        self,
        llm: LLMInterface,
        stream_fn: Optional[Callable] = None,
        max_steps: int = 5,
        temperature: float = 0.4
    ) -> None:
        """
        Initializes the AutonomousAgent.

        Args:
            llm (LLMInterface): The model interface.
            stream_fn (Callable, optional): Function to handle output streaming.
            max_steps (int): Maximum number of ReAct iterations.
            temperature (float): Sampling temperature.
        """
        self.llm = llm
        self.stream_fn = stream_fn
        self.max_steps = max_steps
        self.temperature = temperature
        self.tools: Dict[str, Dict[str, Any]] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        """Registers the core set of default tools available to the agent."""
        self.register_tool(
            name="critic_audit",
            description="Audit a draft proposal for logical flaws, missing edge cases, or false assumptions.",
            parameters={"draft": "The candidate draft text to evaluate"},
            func=self._tool_critic_audit
        )
        self.register_tool(
            name="python_interpreter",
            description="Execute a safe Python mathematical expression or logic check (e.g. '349 * 82 + 912').",
            parameters={"expression": "The Python math expression or calculation to evaluate"},
            func=self._tool_python_interpreter
        )
        self.register_tool(
            name="export_docx",
            description="Export formatted Markdown content or agreement to a styled Microsoft Word (.docx) document.",
            parameters={"content": "The formatted Markdown text", "filename": "Optional target filename"},
            func=self._tool_export_docx
        )

    def register_tool(self, name: str, description: str, parameters: Dict[str, str], func: Callable) -> None:
        """
        Registers a new tool into the agent's action space.

        Args:
            name (str): Tool identifier.
            description (str): Human-readable description for the LLM.
            parameters (Dict[str, str]): Parameter definitions.
            func (Callable): The Python function to execute.
        """
        self.tools[name] = {
            "description": description,
            "parameters": parameters,
            "func": func
        }

    def _tool_critic_audit(self, draft: str, context: str = "") -> str:
        """Adversarial critic tool that evaluates candidate text."""
        logger.info("Executing tool: critic_audit")
        audit_prompt = (
            f"Context: {context}\n\n"
            f"Candidate Draft:\n\"\"\"\n{draft}\n\"\"\"\n\n"
            "Rigidly audit this draft. Identify:\n"
            "1. Any factual inaccuracies, unverified claims, or logical gaps.\n"
            "2. Missing edge cases or key nuances.\n"
            "3. State [STATUS: PASS] if the draft is already optimal, or list concrete improvements required."
        )
        messages = [
            {"role": "system", "content": "You are a master analytical editor and reasoning auditor. Be concise and direct."},
            {"role": "user", "content": audit_prompt}
        ]
        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=1536,
            temperature=0.2,
            stream=False
        )
        return response['choices'][0]['message']['content'].strip()

    def _tool_python_interpreter(self, expression: str) -> str:
        """Safe math evaluator for deterministic arithmetic and logic checks."""
        logger.info(f"Executing tool: python_interpreter with expr: {expression}")
        allowed_names = {"abs": abs, "round": round, "min": min, "max": max, "sum": sum, "pow": pow, "len": len}
        try:
            clean_expr = expression.strip().replace("```python", "").replace("```", "").strip()
            if clean_expr.startswith("print(") and clean_expr.endswith(")"):
                clean_expr = clean_expr[6:-1]
            result = eval(clean_expr, {"__builtins__": {}}, allowed_names)
            return str(result)
        except Exception as e:
            logger.error(f"Python interpreter error: {e}")
            return f"Error executing expression: {e}"

    def _tool_export_docx(self, content: str, filename: str = "document.docx") -> str:
        """Exports markdown content to a formatted Word document."""
        logger.info(f"Executing tool: export_docx to {filename}")
        try:
            import os
            from drafter.config import settings
            clean_name = re.sub(r'[^\w\-_\.]', '_', filename.strip())
            if not clean_name or clean_name == ".docx":
                clean_name = "document.docx"
            if not clean_name.endswith(".docx"):
                clean_name += ".docx"
            out_path = os.path.join(settings.EXPORTS_DIR, clean_name)
            abs_path = convert_markdown_to_docx(content, out_path)
            return f"Successfully generated Word document at: {abs_path}"
        except Exception as e:
            logger.error(f"Docx export error: {e}")
            return f"Error generating docx: {e}"

    def _build_system_prompt(self) -> str:
        """Construct the ReAct system prompt describing action space and JSON contract."""
        tool_descriptions = []
        for name, meta in self.tools.items():
            params_str = ", ".join([f'"{k}": "{v}"' for k, v in meta["parameters"].items()])
            tool_descriptions.append(f"- `{name}`: {meta['description']}\n  Arguments: {{{params_str}}}")

        tools_block = "\n".join(tool_descriptions)

        return (
            "You are an autonomous AI agent operating in a ReAct (Reason + Act) loop.\n"
            "You dynamically decide your own actions to produce the highest-quality, accurate answer.\n\n"
            "AVAILABLE TOOLS:\n"
            f"{tools_block}\n"
            "- `finish`: Conclude the task and output the final response when you are confident.\n"
            "  Arguments: {\"answer\": \"The complete, polished final response to the user\"}\n\n"
            "DECISION RULES:\n"
            "1. For simple questions or direct lookups, you can call `finish` immediately on Step 1 (do not over-complicate).\n"
            "2. For complex drafting or analysis, you can draft, then call `critic_audit` to review your draft before finalizing.\n"
            "3. For arithmetic or calculations, always use `python_interpreter` for exact precision.\n"
            "4. At EVERY step, you MUST respond in the following EXACT JSON format:\n"
            "```json\n"
            "{\n"
            '  "thought": "Your internal reasoning explaining what you are doing and why",\n'
            '  "action": "tool_name",\n'
            '  "action_input": {"param_name": "param_value"}\n'
            "}\n"
            "```\n"
            "Do NOT output text outside of the JSON block."
        )

    def _parse_action(self, raw_output: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON action payload from model generation."""
        try:
            return json.loads(raw_output.strip())
        except Exception:
            pass

        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_output, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass

        start = raw_output.find("{")
        end = raw_output.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(raw_output[start:end + 1])
            except Exception:
                pass

        logger.warning(f"Failed to parse action from output: {raw_output[:100]}...")
        return None

    def run(self, conv: ConversationManager, user_input: str, tracker: Optional[TelemetryTracker] = None) -> str:
        """
        Run the autonomous ReAct decision loop.

        Args:
            conv (ConversationManager): The conversation state.
            user_input (str): The user's request.
            tracker (TelemetryTracker, optional): Telemetry tracker for token counting.

        Returns:
            str: The finalized answer chosen by the agent.
        """
        logger.info(f"Starting AutonomousAgent loop for: {user_input[:50]}...")
        system_prompt = self._build_system_prompt()

        trajectory = []
        for msg in conv.messages[:-1]:
            trajectory.append(msg)

        trajectory.append({"role": "system", "content": system_prompt})
        trajectory.append({"role": "user", "content": f"User Request: {user_input}"})

        print(f"\n{BOLD}{MAGENTA}┌── 🤖 AUTONOMOUS AGENT REASONING LOOP ──────────────────────────────┐{RESET}")

        for step in range(1, self.max_steps + 1):
            print(f"{BOLD}{MAGENTA}│ [STEP {step}/{self.max_steps}]{RESET} Calling Agent Core...")

            response = self.llm.create_chat_completion(
                messages=trajectory,
                max_tokens=2048,
                temperature=self.temperature,
                stream=True
            )

            chunk_tokens = []
            for chunk in response:
                delta = chunk['choices'][0]['delta']
                if 'content' in delta and delta['content']:
                    token = delta['content']
                    chunk_tokens.append(token)
                    if tracker:
                        tracker.record_token()

            response_raw = "".join(chunk_tokens).strip()
            decision = self._parse_action(response_raw)

            if not decision:
                logger.warning(f"Step {step}: Model emitted non-structured response.")
                print(f"{YELLOW}│ ⚠️  Warning: Model emitted non-structured response.{RESET}")
                trajectory.append({"role": "assistant", "content": response_raw})
                trajectory.append({
                    "role": "user",
                    "content": "Error: You must output a valid JSON block with 'thought', 'action', and 'action_input'."
                })
                continue

            try:
                thought = decision.get("thought", "")
                action = decision.get("action", "")
                action_input = decision.get("action_input", {})
            except Exception as e:
                raise ActionParseError(f"Decision object is missing required fields or is malformed: {e}") from e

            if thought:
                print(f"{CYAN}│ 💭 Thought:{RESET} {GRAY}{thought}{RESET}")

            if action == "finish":
                final_answer = action_input.get("answer", "")
                if not final_answer and isinstance(action_input, str):
                    final_answer = action_input

                print(f"{GREEN}│ 🎯 Decision: Task Completed Successfully on Step {step}.{RESET}")
                print(f"{BOLD}{MAGENTA}└────────────────────────────────────────────────────────────────────┘{RESET}\n")
                print(f"{BOLD}💡 Final Agent Answer:{RESET}\n{final_answer}")
                return final_answer

            if action in self.tools:
                tool_meta = self.tools[action]
                print(f"{YELLOW}│ ⚡ Action:{RESET} {BOLD}{action}{RESET}({action_input})")
                print(f"{YELLOW}│    Executing tool...{RESET}", end="\r", flush=True)

                try:
                    if isinstance(action_input, dict):
                        if "context" in tool_meta["parameters"] and "context" not in action_input:
                            action_input["context"] = user_input
                        observation = tool_meta["func"](**action_input)
                    else:
                        observation = tool_meta["func"](str(action_input))
                except Exception as e:
                    logger.exception(f"Tool {action} failed: {e}")
                    observation = f"Tool Execution Error: {e}"
                    # In a more strict mode, we could raise ToolExecutionError(str(e)) here
                    # but for a ReAct loop, we feed the error back to the LLM as an observation.

                obs_preview = observation.replace("\n", " ")
                if len(obs_preview) > 95:
                    obs_preview = obs_preview[:95] + "..."
                print(f"{GREEN}│ 👁️  Observation:{RESET} {obs_preview}")

                trajectory.append({"role": "assistant", "content": json.dumps(decision)})
                trajectory.append({"role": "user", "content": f"Observation from {action}:\n{observation}"})

            else:
                logger.error(f"Unknown action requested: {action}")
                print(f"{RED}│ ❌ Error: Unknown action '{action}'. Available: {list(self.tools.keys()) + ['finish']}{RESET}")
                trajectory.append({
                    "role": "user",
                    "content": f"Error: '{action}' is not a valid tool. Choose from: {list(self.tools.keys()) + ['finish']}"
                })

        logger.warning(f"Step limit ({self.max_steps}) reached without finish action.")
        print(f"{YELLOW}│ ⚠️  Step limit ({self.max_steps}) reached. Synthesizing best effort...{RESET}")
        print(f"{BOLD}{MAGENTA}└────────────────────────────────────────────────────────────────────┘{RESET}\n")

        fallback_response = self.llm.create_chat_completion(
            messages=trajectory + [{"role": "user", "content": "Step limit reached. Output your best final answer directly."}],
            max_tokens=2048,
            temperature=0.3,
            stream=False
        )
        final_answer = fallback_response['choices'][0]['message']['content'].strip()
        print(f"{BOLD}💡 Final Agent Answer:{RESET}\n{final_answer}")
        return final_answer
