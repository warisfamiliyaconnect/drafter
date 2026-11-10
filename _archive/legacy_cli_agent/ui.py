"""
UI components for the Drafter CLI.
"""
import sys
from typing import List, Dict, Optional, Any
from drafter.utils.logging import logger

try:
    import msvcrt
except ImportError:
    msvcrt = None

# ANSI color codes for TUI
CYAN = "\033[36m"
BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
GRAY = "\033[90m"
RESET = "\033[0m"
INVERT = "\033[7m"

def select_session_cli(sessions: List[Dict[str, Any]], current_session_id: str) -> Optional[str]:
    """
    Interactive arrow-key and styled menu to select a conversation session.

    Args:
        sessions (List[Dict[str, Any]]): List of available session metadata.
        current_session_id (str): The ID of the currently active session.

    Returns:
        Optional[str]: "NEW" for a new session, a filepath for an existing one, or None if cancelled.
    """
    if not sessions:
        print(f"\n{YELLOW}📭 No saved sessions found in sessions folder.{RESET}\n")
        return None

    # Options list: index 0 is always "✨ Start a Brand New Session"
    items = [{"type": "new", "title": "✨ Start a Brand New Session", "turns": 0, "date": ""}]
    for s in sessions:
        items.append({
            "type": "session",
            "id": s["session_id"],
            "title": s["title"],
            "turns": s["turns_count"],
            "date": s["created_at"],
            "filepath": s["filepath"],
            "is_active": s["session_id"] == current_session_id
        })

    selected_index = 0

    def draw_menu(clear_lines: int = 0) -> int:
        if clear_lines > 0:
            sys.stdout.write(f"\033[{clear_lines}A")

        lines_printed = 0
        header = f"\n{BOLD}{CYAN}┌── 📚 CONVERSATION HISTORY SELECTOR ──────────────────────────────────┐{RESET}"
        print(header)
        lines_printed += 2

        instructions = f"{GRAY}│  [↑/↓] Navigate  •  [Enter] Select  •  [N] New Session  •  [Esc/Q] Cancel │{RESET}"
        print(instructions)
        lines_printed += 1

        divider = f"{CYAN}├──────────────────────────────────────────────────────────────────────┤{RESET}"
        print(divider)
        lines_printed += 1

        for i, item in enumerate(items):
            is_cursor = (i == selected_index)

            if item["type"] == "new":
                prefix = f" {GREEN}❯ [*]{RESET} " if is_cursor else "   [ ] "
                line_text = f"{BOLD}{item['title']}{RESET}"
                if is_cursor:
                    row = f"│ {prefix}{INVERT} {item['title']} {RESET}"
                else:
                    row = f"│ {prefix}{line_text}"
                print(f"{row:<82}│")
                lines_printed += 1
            else:
                prefix = f" {CYAN}❯ [{i}]{RESET} " if is_cursor else f"   [{i}] "
                active_badge = f" {YELLOW}(Active){RESET}" if item.get("is_active") else ""
                date_str = item["date"]
                turns_str = f"{item['turns']} turn{'s' if item['turns'] != 1 else ''}"
                title_str = item["title"]

                if is_cursor:
                    row = f"│ {prefix}{INVERT} {date_str} │ {turns_str} │ \"{title_str}\"{RESET}{active_badge}"
                else:
                    row = f"│ {prefix}{date_str} │ {GRAY}{turns_str}{RESET} │ {BOLD}\"{title_str}\"{RESET}{active_badge}"

                print(f"{row:<90}│")
                lines_printed += 1

        footer = f"{CYAN}└──────────────────────────────────────────────────────────────────────┘{RESET}"
        print(footer)
        lines_printed += 1
        sys.stdout.flush()
        return lines_printed

    if not msvcrt:
        draw_menu()
        choice = input(f"\nEnter choice [0-{len(items)-1}] (or Enter to cancel): ").strip().lower()
        if choice in ['0', 'n', 'new']:
            return "NEW"
        if choice.isdigit() and 1 <= int(choice) < len(items):
            return items[int(choice)]["filepath"]
        return None

    lines_count = draw_menu(clear_lines=0)

    while True:
        key = msvcrt.getch()

        if key in (b'\xe0', b'\x00'):
            sub_key = msvcrt.getch()
            if sub_key == b'H':
                selected_index = (selected_index - 1) % len(items)
                lines_count = draw_menu(clear_lines=lines_count)
            elif sub_key == b'P':
                selected_index = (selected_index + 1) % len(items)
                lines_count = draw_menu(clear_lines=lines_count)
            continue

        if key in (b'\r', b'\n'):
            chosen = items[selected_index]
            print("\n")
            if chosen["type"] == "new":
                return "NEW"
            return chosen["filepath"]

        if key in (b'\x1b', b'q', b'Q'):
            print(f"\n{GRAY}Selection cancelled.{RESET}\n")
            return None

        if key in (b'n', b'N'):
            print("\n")
            return "NEW"

        if key.isdigit():
            num = int(key.decode('ascii'))
            if 0 <= num < len(items):
                selected_index = num
                chosen = items[selected_index]
                print("\n")
                if chosen["type"] == "new":
                    return "NEW"
                return chosen["filepath"]
