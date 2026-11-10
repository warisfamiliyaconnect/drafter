"""
Application entry point for the Drafter system.
Handles the main CLI loop and mode switching.
"""
import os
import sys
from pathlib import Path

# Ensure the 'src' directory is in the Python path so the 'drafter' package can be found
# This removes the need to manually set PYTHONPATH
src_path = str(Path(__file__).parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)

import re
from typing import Dict, Optional, Any


from drafter.config import settings
from drafter.inference.llm import LLMInterface
from drafter.managers.conversation import ConversationManager
from drafter.managers.telemetry import TelemetryTracker
from drafter.core.reflection import ReflectionEngine
from drafter.core.agent import AutonomousAgent
from drafter.utils.exporter import convert_markdown_to_docx
from drafter.utils.ui import select_session_cli
from drafter.utils.logging import logger
from drafter.core.exceptions import DrafterError, ModelLoadError, SessionPersistenceError

# ANSI styling constants for the Terminal UI
GRAY = "\033[90m"
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"
RED = "\033[31m"

def stream_llm_response(
    llm: LLMInterface,
    messages: list,
    max_tokens: int,
    temperature: float,
    tracker: Optional[TelemetryTracker] = None,
    suppress_think: bool = False,
    header_title: str = "Assistant",
    header_color: str = BOLD
) -> str:
    """
    Universal streaming function with ANSI styling and think-block parsing.

    Args:
        llm (LLMInterface): The LLM interface instance.
        messages (list): Conversation history.
        max_tokens (int): Max tokens to generate.
        temperature (float): Sampling temperature.
        tracker (TelemetryTracker, optional): Metrics tracker.
        suppress_think (bool): Whether to hide <think> blocks.
        header_title (str): Title for the output header.
        header_color (str): ANSI color for the header.

    Returns:
        str: The finalized generated text.
    """
    response_stream = llm.create_chat_completion(
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True
    )

    in_think = False
    has_printed_header = False
    tokens_builder = []

    try:
        for chunk in response_stream:
            delta = chunk['choices'][0]['delta']
            if 'content' in delta and delta['content']:
                token = delta['content']
                if tracker:
                    tracker.record_token()
                tokens_builder.append(token)

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
        print(f"\n{YELLOW}⏹️  [Generation halted by user (Ctrl+C)]{RESET}")

    print(RESET)
    return "".join(tokens_builder).strip()

def evaluate_adaptive_reasoning(
    user_input: str,
    current_conv_tokens: int,
    max_context: int = settings.MAX_CONTEXT_TOKENS
) -> Dict[str, Any]:
    """
    Dynamically evaluates prompt complexity and allocates reasoning budget.

    Args:
        user_input (str): The raw user request.
        current_conv_tokens (int): Current total tokens in session.
        max_context (int): Total context window limit.

    Returns:
        Dict[str, Any]: Configuration including max_tokens, temperature, and prompts.
    """
    lowered = user_input.lower().strip()
    words = lowered.split()

    analytical_triggers = [
        "compare", "contrast", "analyze", "analysis", "prove", "proof", "derive",
        "derivation", "evaluate", "evaluation", "difference between", "step by step",
        "philosophical", "paradox", "critique", "tradeoff", "trade-off", "architecture",
        "investigate", "debug", "refactor", "optimal", "theorem", "logic puzzle",
        "counterexample", "why does", "explain why", "deduce", "implications"
    ]

    math_triggers = [
        "calculate", "computation", "equation", "integral", "derivative", "probability",
        "combinatorics", "matrix", "formula", "algebra", "discrete"
    ]

    has_analytical = any(trigger in lowered for trigger in analytical_triggers)
    has_math = any(trigger in lowered for trigger in math_triggers)
    is_lengthy = len(words) > 35

    is_complex = has_analytical or has_math or is_lengthy

    if is_complex:
        target_tokens = 16384
        system_prompt = (
            "You are an advanced reasoning model operating with dynamic test-time compute. "
            "Before providing your final solution, thoroughly explore the problem: "
            "1. Explicitly challenge and question initial assumptions. "
            "2. Consider multiple alternative solution paths and verify edge cases. "
            "3. Prove intermediate mathematical or logical deductions step-by-step. "
            "4. Self-correct any discrepancies before formulating the definitive answer."
        )
        temperature = 0.5 if has_math else 0.65
        header_title = "Deep Reasoner (Adaptive Extended)"
        header_color = CYAN + BOLD
        status_label = "🔬 Deep Adaptive Reasoning (High-Budget TTC)..."
    else:
        target_tokens = 4096
        system_prompt = "You are a helpful, smart, and concise AI assistant."
        temperature = 0.7
        header_title = "Assistant"
        header_color = BOLD
        status_label = "🧠 Standard Reasoning (Adaptive CoT)..."

    headroom = max_context - current_conv_tokens - 512
    allocated_tokens = max(512, min(target_tokens, headroom))

    return {
        "max_tokens": allocated_tokens,
        "temperature": temperature,
        "system_prompt": system_prompt,
        "header_title": header_title,
        "header_color": header_color,
        "status_msg": status_label,
        "is_complex": is_complex
    }

def main() -> None:
    """Main entry point for the Drafter CLI application."""
    logger.info("Starting Drafter Application...")
    print(f"Loading model from {settings.MODEL_PATH}...")

    # Model Initialization
    try:
        llm_interface = LLMInterface()
    except ModelLoadError as e:
        logger.critical(f"Model load failed: {e.message}")
        print(f"{RED}Critical Error: {e.message}{RESET}")
        sys.exit(1)
    except DrafterInfrastructureError as e:
        logger.critical(f"Infrastructure failure: {e.message}")
        print(f"{RED}Infrastructure Error: {e.message}{RESET}")
        sys.exit(1)
    except DrafterError as e:
        logger.critical(f"System error during initialization: {e.message}")
        print(f"{RED}Initialization Error: {e.message}{RESET}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Unexpected system crash: {e}")
        print(f"{RED}Unexpected Error: {e}{RESET}")
        sys.exit(1)

    print("\n" + "=" * 65)
    print(f"{BOLD}{CYAN}🚀 LOCAL TEST-TIME COMPUTE INFERENCE SYSTEM{RESET}")
    print("=" * 65)
    print("Inference Modes:")
    print(f"  {BOLD}/fast{RESET}    ⚡ Direct low-latency answers (no thinking)")
    print(f"  {BOLD}/deep{RESET}    🧠 Adaptive reasoning (dynamically scales 4K-16K tokens & verification)")
    print(f"  {BOLD}/reflect{RESET} 🪞 Multi-Pass Reflection Engine (Draft -> Critique -> Refine)")
    print(f"  {BOLD}/agent{RESET}   🤖 Autonomous Agent (Dynamic ReAct tool-use & self-evaluation)")
    print("Session Commands:")
    print("  /export docx [name] - Export latest draft/response to a styled Word (.docx) file")
    print("  /history            - Browse and select past conversation sessions")
    print("  /new                - Start a brand new conversation session")
    print("  /clear              - Clear messages in current session")
    print("quit                - Exit the system\n")

    tracker = TelemetryTracker(context_window=settings.MAX_CONTEXT_TOKENS)
    mode = "deep"
    default_system_prompt = "You are a helpful, smart, and concise AI assistant."

    conv = ConversationManager(
        system_prompt=default_system_prompt,
        max_context_tokens=settings.MAX_CONTEXT_TOKENS,
        token_counter=lambda text: len(llm_interface.tokenize(text)),
        sessions_dir=settings.SESSIONS_DIR
    )

    reflection_engine = ReflectionEngine(llm_interface, stream_fn=stream_llm_response)
    agent = AutonomousAgent(llm_interface)

    mode_tags = {
        "fast": f"{YELLOW}⚡ [FAST",
        "deep": f"{CYAN}🧠 [DEEP",
        "reflect": f"{GREEN}🪞 [REFLECT",
        "agent": f"{MAGENTA}🤖 [AGENT"
    }

    while True:
        try:
            turn_num = conv.turns_count + 1
            tag = mode_tags.get(mode, f"{CYAN}🧠 [DEEP")
            user_input = input(f"\nYou {tag} | Turn {turn_num}]{RESET}: ")
            cleaned_input = user_input.strip().lower()

            if cleaned_input in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break

            if cleaned_input == '/new':
                conv.start_new_session()
                print("✨ Started a fresh conversation session. Turn counter reset to 1.")
                continue

            if cleaned_input in ['/clear', '/reset']:
                conv.clear(keep_system=True)
                print("🧹 Current session cleared. Starting fresh in this session.")
                continue

            if cleaned_input in ['/history', '/sessions']:
                sessions = conv.list_saved_sessions()
                choice = select_session_cli(sessions, conv.session_id)
                if choice == "NEW":
                    conv.start_new_session()
                    print("✨ Started a brand new conversation session. Turn counter reset to 1.\n")
                elif choice:
                    conv.load_session(choice)
                    print(f"\n────────── Resumed: \"{conv.title}\" ──────────")
                    user_turn_counter = 1
                    for msg in conv.raw_messages:
                        if msg.role == "user":
                            print(f"\n{BOLD}{CYAN}You (Turn {user_turn_counter}):{RESET} {msg.content}")
                            user_turn_counter += 1
                        elif msg.role == "assistant":
                            text = msg.content
                            if "<think>" in text and "</think>" in text:
                                think_part = text.split("</think>")[0].replace("<think>", "").strip()
                                answer_part = text.split("</think>")[-1].strip()
                                print(f"{CYAN}💭 [Previous Reasoning]:{RESET} {GRAY}{think_part[:120]}...{RESET}")
                                print(f"{BOLD}Assistant:{RESET} {text}")
                            else:
                                print(f"{BOLD}Assistant:{RESET} {text}")
                    print(f"────────────────────────────────────────────────────────────\n")
                continue

            if cleaned_input.startswith('/export') or cleaned_input.startswith('/docx'):
                parts = user_input.strip().split()
                custom_name = None
                for p in parts[1:]:
                    if p.lower() != "docx":
                        custom_name = p
                        break

                if not custom_name:
                    custom_name = f"draft_turn_{conv.turns_count}.docx"

                latest_reply = None
                for msg in reversed(conv.raw_messages):
                    if msg.role == "assistant":
                        latest_reply = msg.content
                        break

                if not latest_reply:
                    print(f"\n{YELLOW}⚠️  No assistant response to export yet. Generate a response first!{RESET}")
                    continue

                clean_name = re.sub(r'[^\w\-_\.]', '_', custom_name)
                if not clean_name.endswith(".docx"):
                    clean_name += ".docx"
                out_path = os.path.join(settings.EXPORTS_DIR, clean_name)

                try:
                    abs_path = convert_markdown_to_docx(latest_reply, out_path, title=conv.title)
                    print(f"\n{GREEN}📄 Word Document Exported Successfully!{RESET}")
                    print(f"   {BOLD}File:{RESET} {out_path}")
                    print(f"   {BOLD}Full Path:{RESET} {abs_path}\n")
                except Exception as e:
                    logger.error(f"Export failed: {e}")
                    print(f"\n{RED}Error exporting docx: {e}{RESET}")
                continue

            if cleaned_input == '/fast':
                mode = "fast"
                fast_sys = (
                    "You are a concise assistant. Provide the direct answer immediately. "
                    "Do not think, do not reason step-by-step, and do not use <think> tags."
                )
                conv.set_system_prompt(fast_sys)
                print("⚡ Switched to FAST mode (Direct answers, thinking suppressed).")
                continue

            if cleaned_input == '/deep':
                mode = "deep"
                conv.set_system_prompt(default_system_prompt)
                print("🧠 Switched to DEEP mode (Adaptive reasoning with dynamic compute scaling).")
                continue

            if cleaned_input in ['/deep+', '/ttc']:
                mode = "deep"
                conv.set_system_prompt(default_system_prompt)
                print("💡 /deep+ is now unified into /deep! Switched to DEEP mode (auto-scales up to 16K tokens for complex prompts).")
                continue

            if cleaned_input == '/reflect':
                mode = "reflect"
                conv.set_system_prompt("You are a master analytical drafting agent.")
                print("🪞 Switched to REFLECT mode (Multi-pass: Draft -> Critical Audit -> Final Synthesis).")
                continue

            if cleaned_input in ['/agent', '/auto']:
                mode = "agent"
                print("🤖 Switched to AUTONOMOUS AGENT mode (Dynamic ReAct loop with tools & self-direction).")
                continue

            if not user_input.strip():
                continue

            conv.add_user_message(user_input)
            input_tokens = conv.total_tokens()
            tracker.start(input_tokens)

            if mode == "reflect":
                final_answer = reflection_engine.run(conv, user_input, tracker)
                if final_answer:
                    conv.add_assistant_message(final_answer)

            elif mode == "agent":
                final_answer = agent.run(conv, user_input, tracker)
                if final_answer:
                    conv.add_assistant_message(final_answer)

            else:
                if mode == "fast":
                    max_tokens = 1024
                    temperature = 0.3
                    suppress_think = True
                    header_title = "Assistant"
                    header_color = BOLD
                    print("⚡ Processing...", end="\r", flush=True)
                else:
                    adaptive_cfg = evaluate_adaptive_reasoning(user_input, conv.total_tokens(), max_context=settings.MAX_CONTEXT_TOKENS)
                    conv.set_system_prompt(adaptive_cfg["system_prompt"])
                    max_tokens = adaptive_cfg["max_tokens"]
                    temperature = adaptive_cfg["temperature"]
                    suppress_think = False
                    header_title = adaptive_cfg["header_title"]
                    header_color = adaptive_cfg["header_color"]
                    print(adaptive_cfg["status_msg"], end="\r", flush=True)

                reply = stream_llm_response(
                    llm_interface, conv.messages, max_tokens=max_tokens, temperature=temperature,
                    tracker=tracker, suppress_think=suppress_think,
                    header_title=header_title, header_color=header_color
                )

                if reply:
                    conv.add_assistant_message(reply)

            tracker.stop()
            print("\n")
            print(tracker.generate_report())

        except KeyboardInterrupt:
            print("\nExiting. Goodbye!")
            break
        except DrafterError as e:
            logger.exception(f"Project-specific error occurred: {e}")
            print(f"\n{RED}⚠️  Application Error:{RESET} {e.message}")
        except Exception as e:
            logger.exception(f"Unhandled system exception: {e}")
            print(f"\n{RED}❌ Unexpected Error:{RESET} {e}")

if __name__ == "__main__":
    main()
