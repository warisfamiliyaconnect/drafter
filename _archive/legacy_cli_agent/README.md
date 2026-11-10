# Legacy CLI Agent (Archived)

These files contain the original standalone ReAct CLI agent from `src/drafter/`.
They have been superseded by the unified LangGraph-based agent architecture.

## Why Archived

The project now uses a **"Single Engine, Dual Interface"** pattern:
- **Single Engine**: `backend/app/agent/` (LangGraph cognitive graph)
- **CLI Interface**: `cli.py` (streams LangGraph events to the terminal)
- **Web Interface**: `backend/app/main.py` (streams LangGraph events via SSE to Next.js)

This ensures that CLI testing exercises the **exact same agent logic** that runs in production.

## Original Files

| File | Original Location | Purpose |
|------|-------------------|---------|
| `agent.py` | `src/drafter/core/agent.py` | Custom ReAct autonomous agent loop |
| `reflection.py` | `src/drafter/core/reflection.py` | Self-correction / reflection engine |
| `conversation.py` | `src/drafter/managers/conversation.py` | Session & conversation management |
| `telemetry.py` | `src/drafter/managers/telemetry.py` | Token & latency tracking |
| `ui.py` | `src/drafter/utils/ui.py` | Terminal UI session selector |
| `artifacts.py` | `src/drafter/utils/artifacts.py` | Artifact utilities |

## Restoring

If you need to reference or restore any of this code, it is preserved here and in Git history.
