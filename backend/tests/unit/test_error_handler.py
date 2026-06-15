"""Unit tests for error_handler — see Feature 7."""

from src.graph.nodes.error_handler import error_handler, RECOVERY_MAP, RECOVERY_DEFAULT


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


def test_error_handler_writes_valid_recovery_for_known_node():
    """A known error_node maps to its specific recovery action from RECOVERY_MAP."""
    for node_name, expected_action in RECOVERY_MAP.items():
        state = make_state(
            error_message=f"{node_name} failed",
            error_node=node_name,
        )
        result = error_handler(state)
        assert result["next_action"] == expected_action
        assert result["error_message"] is None
        assert result["error_node"] is None


def test_error_handler_handles_unknown_error_node():
    """Unknown error_node -> RECOVERY_DEFAULT, never raises."""
    state = make_state(error_message="boom", error_node="some_unregistered_node")
    result = error_handler(state)
    assert result["next_action"] == RECOVERY_DEFAULT
    assert result["error_message"] is None
    assert result["error_node"] is None


def test_error_handler_handles_no_error_present():
    """No error fields set -> routes to 'retry', clears (already-None) fields,
    and never raises."""
    state = make_state(error_message=None, error_node=None)
    result = error_handler(state)
    assert result["next_action"] == "retry"
    assert result["error_message"] is None
    assert result["error_node"] is None


def test_error_handler_never_raises_on_malformed_state():
    """Even with unexpected/missing keys the handler must not raise and must
    always produce a valid next_action."""
    state = {"error_message": "weird state", "error_node": "roadmap_generator"}
    result = error_handler(state)
    assert "next_action" in result
    assert isinstance(result["next_action"], str)
    assert result["next_action"] != ""


def test_error_handler_only_writes_owned_fields():
    """ErrorHandlerNode must only change error_message, error_node, next_action."""
    state = make_state(error_message="x", error_node="level_gate", points=100, badges=["bronze"])
    result = error_handler(state)
    for key in state:
        if key in ("error_message", "error_node", "next_action"):
            continue
        assert result[key] == state[key]
