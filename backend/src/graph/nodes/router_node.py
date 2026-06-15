"""
RouterNode — owns: next routing decision only (reads state.next_action, writes nothing).

Reads `state["next_action"]` and returns the name of the next node to run.
This is the traffic controller for the LangGraph StateGraph — every conditional
edge that needs to decide "what's next" delegates to this mapping.

Architecture principles followed:
- Additive extension: new next_action values are added to ROUTING_MAP without
  touching any other node.
- Never raises: unknown next_action values fall back to "error_handler".
"""

from src.graph.state import NexusState


# Maps every possible state["next_action"] value to the node that should run next.
# Keep this dict as the single source of truth for graph routing.
ROUTING_MAP: dict[str, str] = {
    # Entry / onboarding
    "start_session": "personality_quiz",
    "personality_quiz": "personality_quiz",
    "skip_personality": "skill_assessment",
    "skill_assessment": "skill_assessment",

    # Roadmap generation
    "generate_roadmap": "roadmap_generator",
    "regenerate_roadmap": "roadmap_generator",
    "roadmap_ready": "level_gate",

    # Core learning loop
    "level_gate": "level_gate",
    "gate_passed": "gamification",
    "gate_failed": "adaptive_sublevel",
    "gate_partial": "level_gate",

    # Sublevel / remediation
    "adaptive_sublevel": "adaptive_sublevel",
    "sublevel_offered": "rejection_handler",
    "sublevel_accepted": "adaptive_sublevel",
    "sublevel_rejected": "rejection_handler",
    "sublevel_hard_exit": "rejection_handler",

    # Gamification
    "award_points": "gamification",
    "gamification_done": "router_node",

    # Terminal / completion
    "roadmap_complete": "gamification",
    "complete": "__end__",

    # Error recovery
    "error": "error_handler",
    "retry": "router_node",
}

DEFAULT_FALLBACK_NODE = "error_handler"


def router_node(state: NexusState) -> str:
    """
    Read state["next_action"] and return the name of the next node to run.

    Owned fields: none (read-only node — does not mutate state).

    Never raises. Any next_action not present in ROUTING_MAP routes to
    "error_handler" so an unexpected/unknown action never crashes the graph.
    """
    next_action = state.get("next_action", "")

    if not next_action:
        return DEFAULT_FALLBACK_NODE

    return ROUTING_MAP.get(next_action, DEFAULT_FALLBACK_NODE)
