"""Unit tests for router_node — see Feature 7."""

from src.graph.nodes.router_node import router_node, ROUTING_MAP, DEFAULT_FALLBACK_NODE


def make_state(**overrides):
    base = {
        "user_id": "test-user", "session_id": "test-session",
        "skill_name": "Python", "skill_score": 0.0, "skill_level": "beginner",
        "personality_profile": None, "quiz_skipped": False,
        "roadmap": None, "roadmap_version": 1, "current_level_index": 0,
        "roadmap_locked": False, "user_roadmap_feedback": None, "regeneration_count": 0,
        "skip_assessment": False,
        "fail_count": 0, "sublevel_reject_count": 0, "test_history": [],
        "points": 0, "badges": [], "streak_days": 0,
        "next_action": "", "task_type": "",
        "error_message": None, "error_node": None, "feature_flags": {}
    }
    return {**base, **overrides}


def test_router_returns_correct_node_for_every_known_action():
    """RouterNode must return the correct next node name for every value
    that appears in ROUTING_MAP."""
    for action, expected_node in ROUTING_MAP.items():
        state = make_state(next_action=action)
        assert router_node(state) == expected_node


def test_router_handles_empty_next_action():
    """No next_action set -> falls back to error_handler, never raises."""
    state = make_state(next_action="")
    assert router_node(state) == DEFAULT_FALLBACK_NODE


def test_router_handles_unknown_next_action():
    """Unrecognised next_action -> falls back to error_handler, never raises."""
    state = make_state(next_action="some_made_up_action_xyz")
    assert router_node(state) == DEFAULT_FALLBACK_NODE


def test_router_terminal_complete_routes_to_end_sentinel():
    state = make_state(next_action="complete")
    assert router_node(state) == "__end__"


def test_router_does_not_mutate_state():
    """RouterNode is read-only — must not write to state."""
    state = make_state(next_action="generate_roadmap")
    original = dict(state)
    router_node(state)
    assert state == original
