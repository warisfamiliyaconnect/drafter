#!/usr/bin/env python3
"""
Drafter CLI: Interactive Terminal Interface for the Autonomous Document Agent.
Runs the exact same LangGraph cognitive agent that powers the TipTap live editor.
"""

import os
import sys
import argparse
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure project root is in python path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# ANSI Color Codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
RED = "\033[31m"
BG_BLUE = "\033[44m\033[37m"

def print_banner():
    banner = f"""
{CYAN}{BOLD}======================================================================
   ____             __ _               _     _____ 
  |  _ \ _ __ __ _ / _| |_ ___ _ __   / \   |_   _|
  | | | | '__/ _` | |_| __/ _ \ '__| / _ \    | |  
  | |_| | | | (_| |  _| ||  __/ |   / ___ \   | |  
  |____/|_|  \__,_|_|  \__\___|_|  /_/   \_\  |_|  
  
  Production-Grade Autonomous Document Agent (LangGraph)
======================================================================{RESET}
"""
    print(banner)

def run_agent_cli(
    topic: str,
    title: str = "Drafter Executive Document",
    auto_pilot: bool = False,
    output_path: Optional[str] = None
):
    from backend.app.agent.graph import document_agent
    from backend.app.services.exporter import export_to_docx

    session_id = f"cli_{uuid.uuid4().hex[:8]}"
    config = {"configurable": {"thread_id": session_id}}

    print(f"\n{BOLD}Document Title:{RESET} {CYAN}{title}{RESET}")
    print(f"{BOLD}Objective:{RESET}      {topic}")
    print(f"{BOLD}Session ID:{RESET}     {session_id}")
    print(f"{BOLD}Mode:{RESET}           {'🤖 Full Auto-Pilot' if auto_pilot else '👤 Human-in-the-Loop Review'}")
    print(f"{DIM}----------------------------------------------------------------------{RESET}")

    initial_state = {
        "blueprint": [],
        "current_section_index": 0,
        "glossary": {},
        "memory": [],
        "full_text": "",
        "global_instructions": f"{title}: {topic}",
        "retry_count": 0
    }

    print(f"\n{GREEN}▶ Starting Autonomous Cognitive Workflow...{RESET}\n")

    current_auto_pilot = auto_pilot

    # 1. Run the initial pipeline (Architect -> Drafter 0 -> Critic 0)
    for event in document_agent.stream(initial_state, config=config):
        for node_name, state_update in event.items():
            _handle_node_event(node_name, state_update)

    # 2. Main Human-in-the-Loop Loop
    while True:
        state = document_agent.get_state(config)
        next_nodes = state.next or ()

        # Check if the workflow has naturally terminated
        if not next_nodes or next_nodes == ("__end__",):
            break

        blueprint = state.values.get("blueprint", [])
        idx = state.values.get("current_section_index", 0)

        if idx >= len(blueprint):
            break

        current_sec = blueprint[idx]
        print(f"\n{BG_BLUE} 📋 HUMAN REVIEW GATE: Section {idx + 1}/{len(blueprint)} - {current_sec['title']} {RESET}")
        print(f"\n{BOLD}Drafted Text:{RESET}\n{current_sec['content']}\n")
        print(f"{BOLD}Status:{RESET} {GREEN}{current_sec['status'].upper()}{RESET} (Version {current_sec['version']})")

        if not current_auto_pilot:
            prompt_text = (
                f"\n{CYAN}Choose an action:{RESET}\n"
                f"  [{BOLD}Enter{RESET}/A] Approve & advance to next section\n"
                f"  [R] Request revision / provide critique\n"
                f"  [F] Fast-forward remaining sections on auto-pilot\n"
                f"  [Q] Stop & export document now\n"
                f"{YELLOW}Action > {RESET}"
            )
            choice = input(prompt_text).strip().lower()

            if choice in ("q", "quit", "exit"):
                print(f"\n{YELLOW}Halting drafting process early as requested.{RESET}")
                break

            elif choice in ("f", "fast", "auto"):
                current_auto_pilot = True
                print(f"\n{GREEN}⏩ Auto-pilot enabled for remaining sections.{RESET}")

            elif choice in ("r", "revise", "revision"):
                feedback = input(f"{MAGENTA}Enter your critique / instructions for the Refiner:{RESET} ").strip()
                if not feedback:
                    feedback = "Please improve precision and professional depth."

                print(f"\n{MAGENTA}🔧 Routing to Refiner Node with human feedback...{RESET}\n")
                new_blueprint = list(blueprint)
                new_blueprint[idx]["status"] = "reviewing"
                new_blueprint[idx]["critique"] = f"Human Feedback: {feedback}"
                document_agent.update_state(config, {"blueprint": new_blueprint, "retry_count": 0}, as_node="critic")

                for event in document_agent.stream(None, config=config):
                    for node_name, state_update in event.items():
                        _handle_node_event(node_name, state_update)
                continue

        # Approve and advance
        print(f"\n{GREEN}✓ Section approved. Advancing...{RESET}\n")
        for event in document_agent.stream(None, config=config):
            for node_name, state_update in event.items():
                _handle_node_event(node_name, state_update)

    # 3. Final State & Export
    final_state = document_agent.get_state(config)
    final_blueprint = final_state.values.get("blueprint", [])

    if not output_path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sanitized_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).rstrip().replace(" ", "_")
        output_path = f"exports/{sanitized_title}_{timestamp}.docx"

    print(f"\n{CYAN}{BOLD}======================================================================{RESET}")
    print(f"{GREEN}{BOLD}🎉 DOCUMENT DRAFTING COMPLETE!{RESET}")
    print(f"{CYAN}{BOLD}======================================================================{RESET}")

    saved_path = export_to_docx(final_blueprint, output_path, document_title=title)
    
    total_words = sum(len(s.get("content", "").split()) for s in final_blueprint)
    print(f"\n{BOLD}Document Summary:{RESET}")
    print(f"  • Total Sections: {len(final_blueprint)}")
    print(f"  • Total Words:    {total_words}")
    print(f"  • Export File:    {GREEN}{BOLD}{os.path.abspath(saved_path)}{RESET}\n")

    return saved_path

def _handle_node_event(node_name: str, state_update: Dict[str, Any]):
    """Renders formatted real-time logs as each LangGraph node finishes."""
    if node_name == "architect":
        blueprint = state_update.get("blueprint", [])
        print(f"{CYAN}🏛️  [Architect Node] Blueprint established ({len(blueprint)} sections):{RESET}")
        for i, s in enumerate(blueprint, 1):
            print(f"    {i}. {s['title']}")
        print()

    elif node_name == "drafter":
        blueprint = state_update.get("blueprint", [])
        idx = [i for i, s in enumerate(blueprint) if s.get("status") == "reviewing"]
        title = blueprint[idx[0]]["title"] if idx else "Active Section"
        print(f"{BLUE}✍️  [Drafter Node] Drafted initial prose for: '{title}'{RESET}")

    elif node_name == "critic":
        blueprint = state_update.get("blueprint", [])
        # Find which section changed
        reviewing = [s for s in blueprint if s.get("status") == "approved" or s.get("critique")]
        active_sec = reviewing[-1] if reviewing else (blueprint[0] if blueprint else None)
        if active_sec:
            if active_sec.get("status") == "approved":
                print(f"{GREEN}⚖️  [Critic Node] Audit PASSED for: '{active_sec['title']}'{RESET}")
            else:
                print(f"{YELLOW}⚖️  [Critic Node] Audit Flagged Flaws for: '{active_sec['title']}'{RESET}")
                if active_sec.get("critique"):
                    print(f"{DIM}{active_sec['critique']}{RESET}")

    elif node_name == "refiner":
        print(f"{MAGENTA}🔧 [Refiner Node] Self-correction completed. Resubmitting to Critic...{RESET}")

def main():
    parser = argparse.ArgumentParser(description="Drafter Autonomous Document Agent CLI")
    parser.add_argument("-t", "--topic", type=str, help="Document objective / topic")
    parser.add_argument("--title", type=str, default="Corporate Policy & Strategic Analysis", help="Document Title")
    parser.add_argument("--auto", action="store_true", help="Run in auto-pilot mode without pausing for human review")
    parser.add_argument("--mock", action="store_true", help="Force high-fidelity mock inference mode")
    parser.add_argument("-o", "--output", type=str, help="Custom output .docx path")

    args = parser.parse_args()

    if args.mock:
        os.environ["MOCK_INFERENCE"] = "true"

    print_banner()

    topic = args.topic
    if not topic:
        print(f"{BOLD}Select a document template or type a custom prompt:{RESET}")
        print("  1. Executive Report on Enterprise AI Adoption")
        print("  2. Corporate Information Security Policy (ISO 27001)")
        print("  3. SaaS Service Level Agreement (SLA)")
        print("  4. Custom Topic")
        
        choice = input(f"\n{CYAN}Selection [1-4, default=1]: {RESET}").strip()
        if choice == "2":
            topic = "Comprehensive corporate information security policy detailing data protection, access controls, and incident response."
            title = "Corporate Information Security Policy"
        elif choice == "3":
            topic = "Enterprise SaaS Service Level Agreement detailing 99.9% uptime commitments, penalties, maintenance windows, and support tiers."
            title = "Service Level Agreement (SLA)"
        elif choice == "4":
            topic = input(f"{YELLOW}Enter your custom document objective:{RESET} ").strip()
            title = input(f"{YELLOW}Enter document title:{RESET} ").strip() or "Custom Document"
        else:
            topic = "Executive analysis on modernizing legacy enterprise systems with autonomous agentic architectures."
            title = "Enterprise AI Modernization Report"
    else:
        title = args.title

    run_agent_cli(
        topic=topic,
        title=title,
        auto_pilot=args.auto,
        output_path=args.output
    )

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Execution interrupted by user. Exiting.{RESET}")
        sys.exit(0)
