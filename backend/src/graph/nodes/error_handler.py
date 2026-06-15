"""
ErrorHandlerNode — owns: state["error_message"], state["error_node"], state["next_action"].

Reads `state["error_message"]` and `state["error_node"]` (written by any node that
caught an exception in its own try/except), decides on a recovery action, writes
that decision to `state["next_action"]`, and clears the error fields once handled.

Architecture principles followed:
- Isolated error handling: this is the safety net every node routes to on failure.
  It NEVER raises — if it can't decide what to do, it defaults to a safe retry
  or a graceful "skip to next safe node" action.
- Own only your fields: only error_message, error_node, and next_action are written.
"""

from src.graph.state import NexusState


# Maps a failing node's name to the safe "next_action" to recover with.
# If a node isn't listed here, RECOVERY_DEFAULT is used.
RECOVERY_MAP: dict[str, str] = {
    "personality_quiz": "skip_personality",
    "skill_assessment": "skill_assessment",
    "roadmap_generator": "generate_roadmap",
    "level_gate": "level_gate",
    "adaptive_sublevel": "gate_passed",       # skip remediation, let user proceed
    "rejection_handler": "gate_passed",
    "gamification": "gamification_done",
    "router_node": "error",
}

RECOVERY_DEFAULT = "error"

# Nodes that should not be retried more than this many times before giving up
# and routing to a terminal/safe state instead of looping forever.
MAX_RETRIES_PER_NODE = 3


def error_handler(state: NexusState) -> NexusState:
    """
    Inspect state["error_message"] / state["error_node"] and write a recovery
    action to state["next_action"]. Clears error fields once handled.

    Owned fields: error_message, error_node, next_action.

    Never raises. If error_node is missing/unknown, defaults to RECOVERY_DEFAULT
    so the graph always has a valid next_action to route on.
    """
    try:
        error_node = state.get("error_node")
        error_message = state.get("error_message")

        if not error_node and not error_message:
            # Nothing to recover from — treat as a no-op, route back to router.
            return {
                **state,
                "next_action": "retry",
                "error_message": None,
                "error_node": None,
            }

        recovery_action = RECOVERY_MAP.get(error_node, RECOVERY_DEFAULT)

        return {
            **state,
            "next_action": recovery_action,
            "error_message": None,
            "error_node": None,
        }

    except Exception as exc:  # pragma: no cover - absolute last resort, never raise
        return {
            **state,
            "next_action": RECOVERY_DEFAULT,
            "error_message": f"error_handler itself failed: {exc}",
            "error_node": "error_handler",
        }
