"""
Reasoning engine implementing the Actor-Critic-Refiner pattern.
"""
from __future__ import annotations

import copy
from typing import Optional, List, Dict, Callable, Any
from drafter.config import settings
from drafter.managers.conversation import ConversationManager
from drafter.managers.telemetry import TelemetryTracker
from drafter.inference.llm import LLMInterface
from drafter.utils.logging import logger
from drafter.core.exceptions import DrafterReasoningError

# ANSI styling constants for TUI output
GRAY = "\033[90m"
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"


class ReflectionEngine:
    """
    Production-grade multi-pass Actor-Critic-Refiner reasoning engine.

    Executes 3 sequential passes:
      1. Draft Proposal (High creativity / exploratory)
      2. Adversarial Critique (Rigid audit for logic, assumptions & edge-cases)
      3. Synthesis & Refinement (Selectively applies valid critiques into a polished answer)

    Attributes:
        llm (LLMInterface): The model interface used for generation.
        stream_fn (Callable): Function to handle streaming output.
        draft_temp (float): Temperature for the initial drafting phase.
        critique_temp (float): Temperature for the adversarial audit phase.
        refine_temp (float): Temperature for the final synthesis phase.
    """

    def __init__(
        self,
        llm: LLMInterface,
        stream_fn: Optional[Callable[..., str]] = None,
        draft_temp: float = 0.7,
        critique_temp: float = 0.3,
        refine_temp: float = 0.4,
        draft_max_tokens: int = 3072,
        critique_max_tokens: int = 2048,
        refine_max_tokens: int = 4096,
    ) -> None:
        """Initializes the ReflectionEngine with hyperparameters."""
        self.llm = llm
        self.stream_fn = stream_fn or self._default_stream
        self.draft_temp = draft_temp
        self.critique_temp = critique_temp
        self.refine_temp = refine_temp
        self.draft_max_tokens = draft_max_tokens
        self.critique_max_tokens = critique_max_tokens
        self.refine_max_tokens = refine_max_tokens

    def _default_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
        tracker: Optional[TelemetryTracker] = None,
        suppress_think: bool = False,
        header_title: str = "Assistant",
        header_color: str = BOLD
    ) -> str:
        """
        Internal streaming fallback if no external stream function is provided.

        Args:
            messages (List[Dict[str, str]]): Conversation history.
            max_tokens (int): Max tokens to generate.
            temperature (float): Sampling temperature.
            tracker (TelemetryTracker, optional): Telemetry tracker.
            suppress_think (bool): Whether to hide <think> blocks.
            header_title (str): Title for the output header.
            header_color (str): ANSI color for the header.

        Returns:
            str: The generated text.
        """
        response_stream = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )

        in_think = False
        has_printed_header = False
        tokens = []

        try:
            for chunk in response_stream:
                delta = chunk['choices'][0]['delta']
                if 'content' in delta and delta['content']:
                    token = delta['content']
                    if tracker:
                        tracker.record_token()
                    tokens.append(token)

                    if suppress_think:
                        if "<think>" in token:
                            in_think = True
                            continue
                        elif "</think>" in token:
                            in_think = False
                            continue
                        elif in_think:
                            continue

                        if not has_printed_header:
                            print(f"{header_color}{header_title}: {RESET}", end="", flush=True)
                            has_printed_header = True
                        print(token, end="", flush=True)

                    else:
                        if "<think>" in token:
                            in_think = True
                            token = token.replace("<think>", f"\n{CYAN}💭 [Thinking Process]{RESET}\n{GRAY}")
                            has_printed_header = True
                        elif "</think>" in token:
                            in_think = False
                            token = token.replace("</think>", f"{RESET}\n\n{header_color}💡 {header_title}:{RESET}\n")
                            has_printed_header = True
                        elif not has_printed_header and not in_think:
                            print(f"{header_color}{header_title}: {RESET}", end="", flush=True)
                            has_printed_header = True

                        print(token, end="", flush=True)

        except KeyboardInterrupt:
            print(f"\n{YELLOW}⏹️  [Stage interrupted by user (Ctrl+C)]{RESET}")

        print(RESET)
        return "".join(tokens).strip()

    def run(
        self,
        conv: ConversationManager,
        user_input: str,
        tracker: Optional[TelemetryTracker] = None
    ) -> Optional[str]:
        """
        Execute the 3-pass reflection pipeline: Draft -> Critique -> Refine.

        Args:
            conv (ConversationManager): The active conversation manager.
            user_input (str): The original user request.
            tracker (TelemetryTracker, optional): Telemetry tracker.

        Returns:
            Optional[str]: The finalized synthesized response, or None if aborted.
        """
        logger.info(f"Starting Reflection pipeline for input: {user_input[:50]}...")

        # =====================================================================
        # PASS 1: INITIAL DRAFT PROPOSAL
        # =====================================================================
        print(f"\n{CYAN}{BOLD}┌── 📝 [PASS 1/3: Initial Draft Proposal] ────────────────────────────┐{RESET}")
        draft = self.stream_fn(
            messages=conv.messages,
            max_tokens=self.draft_max_tokens,
            temperature=self.draft_temp,
            tracker=tracker,
            suppress_think=False,
            header_title="Draft",
            header_color=CYAN + BOLD
        )
        print(f"{CYAN}{BOLD}└──────────────────────────────────────────────────────────────────────┘{RESET}\n")

        if not draft or len(draft.strip()) < 10:
            logger.warning("Draft phase produced an empty or too short response. Aborting pipeline.")
            print(f"{YELLOW}⚠️  Draft aborted or empty. Skipping reflection pipeline.{RESET}\n")
            return draft if draft else None

        # Clean think tags from draft so the critic audits clean content
        clean_draft = draft
        if "<think>" in clean_draft and "</think>" in clean_draft:
            clean_draft = clean_draft.split("</think>")[-1].strip()

        # =====================================================================
        # PASS 2: ADVERSARIAL CRITIQUE & AUDIT
        # =====================================================================
        print(f"\n{YELLOW}{BOLD}┌── 🔍 [PASS 2/3: Critical Audit & Edge-Case Detection] ───────────────┐{RESET}")

        critique_instruction = (
            f"Here is a candidate draft response to the user's latest query:\n\n"
            f"\"\"\"\n{clean_draft}\n\"\"\"\n\n"
            "Rigidly audit this candidate draft considering the full conversation context. Identify:\n"
            "1. Logical inconsistencies, unverified claims, or false assumptions.\n"
            "2. Missing edge cases, counterarguments, or historical/technical nuances.\n"
            "3. Actionable improvements to make the answer definitive, authoritative, and complete.\n"
            "Provide a concise, direct, bulleted critique."
        )

        critique_messages = []
        for msg in conv.messages[:-1]:
            critique_messages.append(msg)
        critique_messages.append({
            "role": "user",
            "content": f"[Context Request: {user_input}]\n\n{critique_instruction}"
        })

        critique = self.stream_fn(
            messages=critique_messages,
            max_tokens=self.critique_max_tokens,
            temperature=self.critique_temp,
            tracker=tracker,
            suppress_think=True,
            header_title="Critique Audit",
            header_color=YELLOW + BOLD
        )
        print(f"{YELLOW}{BOLD}└──────────────────────────────────────────────────────────────────────┘{RESET}\n")

        if not critique or len(critique.strip()) < 10:
            logger.warning("Critique phase produced an empty response. Falling back to initial draft.")
            print(f"{YELLOW}⚠️  Critique aborted. Using initial draft as output.{RESET}\n")
            return clean_draft

        # =====================================================================
        # PASS 3: SYNTHESIS & REFINEMENT
        # =====================================================================
        print(f"\n{GREEN}{BOLD}┌── ✨ [PASS 3/3: Synthesizing Final Polished Response] ─────────────────┐{RESET}")

        refine_instruction = (
            f"Candidate Draft:\n\"\"\"\n{clean_draft}\n\"\"\"\n\n"
            f"Expert Critique:\n\"\"\"\n{critique}\n\"\"\"\n\n"
            "Task: Synthesize the definitive, authoritative, and fully-polished final response.\n"
            "Guidelines:\n"
            "- Adopt all valid corrections, fill identified knowledge gaps, and address edge cases.\n"
            "- Disregard any pedantic or incorrect critique claims.\n"
            "- Deliver the final response directly and comprehensively."
        )

        refine_messages = []
        for msg in conv.messages[:-1]:
            refine_messages.append(msg)
        refine_messages.append({
            "role": "user",
            "content": f"[Original Request: {user_input}]\n\n{refine_instruction}"
        })

        try:
            final_answer = self.stream_fn(
                messages=refine_messages,
                max_tokens=self.refine_max_tokens,
                temperature=self.refine_temp,
                tracker=tracker,
                suppress_think=True,
                header_title="Final Refined Answer",
                header_color=GREEN + BOLD
            )
        except Exception as e:
            logger.exception(f"Synthesis phase failed: {e}")
            raise DrafterReasoningError(f"Failed to synthesize final response: {e}") from e

        print(f"{GREEN}{BOLD}└──────────────────────────────────────────────────────────────────────┘{RESET}\n")

        return final_answer if final_answer else clean_draft
