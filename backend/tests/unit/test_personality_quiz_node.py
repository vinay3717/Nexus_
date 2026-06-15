"""
Unit tests for PersonalityQuizNode.

Covers:
- Happy path: full answers -> personality_profile populated
- Skipped path: skipped=True -> quiz_skipped=True, profile=None
- Missing upstream data: no quiz_input -> graceful skip, no crash
- Malformed answers: wrong length -> graceful skip
- Feature flag disabled: skips gracefully
- Error injection: never raises, routes to error_handler
"""

import pytest
from src.graph.nodes.personality_quiz import personality_quiz_node, PERSONALITY_DIMENSIONS


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
        "error_message": None, "error_node": None, "feature_flags": {"personality_quiz": True},
    }
    return {**base, **overrides}


def test_happy_path_full_answers():
    state = make_state(quiz_input={
        "skipped": False,
        "answers": ["visual", "structured", "fast", "frequent", "career"],
    })

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is False
    assert result["personality_profile"] is not None
    assert set(result["personality_profile"].keys()) == set(PERSONALITY_DIMENSIONS)
    assert result["personality_profile"]["visual_vs_text"] == "visual"
    assert result["next_action"] == "skill_assessment"
    assert result["task_type"] == "personality_quiz"
    assert result["error_message"] is None


def test_skipped_path():
    state = make_state(quiz_input={"skipped": True, "answers": None})

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is True
    assert result["personality_profile"] is None
    assert result["next_action"] == "skill_assessment"
    assert result["error_message"] is None


def test_missing_quiz_input_no_crash():
    state = make_state()  # no quiz_input key at all

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is True
    assert result["personality_profile"] is None
    assert result["next_action"] == "skill_assessment"
    assert result["error_message"] is None


def test_malformed_answers_wrong_length():
    state = make_state(quiz_input={
        "skipped": False,
        "answers": ["visual", "structured"],  # only 2, expected 5
    })

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is True
    assert result["personality_profile"] is None
    assert result["next_action"] == "skill_assessment"


def test_feature_flag_disabled():
    state = make_state(feature_flags={"personality_quiz": False})
    state["quiz_input"] = {
        "skipped": False,
        "answers": ["visual", "structured", "fast", "frequent", "career"],
    }

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is True
    assert result["personality_profile"] is None
    assert result["next_action"] == "skill_assessment"


def test_feature_flag_missing_defaults_to_enabled():
    # feature_flags dict present but key absent -- defaults to True (enabled)
    state = make_state(feature_flags={})
    state["quiz_input"] = {
        "skipped": False,
        "answers": ["visual", "structured", "fast", "frequent", "career"],
    }

    result = personality_quiz_node(state)

    assert result["quiz_skipped"] is False
    assert result["personality_profile"] is not None


def test_error_injection_never_raises(monkeypatch):
    state = make_state(quiz_input={
        "skipped": False,
        "answers": ["visual", "structured", "fast", "frequent", "career"],
    })

    # Force an exception by making feature_flags.get blow up
    class BadFlags:
        def get(self, *args, **kwargs):
            raise RuntimeError("simulated failure")

    state["feature_flags"] = BadFlags()

    result = personality_quiz_node(state)

    assert result["error_message"] == "simulated failure"
    assert result["error_node"] == "personality_quiz"
    assert result["next_action"] == "error_handler"
