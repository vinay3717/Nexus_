"""
Unit tests for skill_assessment_node and its helper functions.
"""

import pytest

from src.graph.nodes.skill_assessment import (
    calculate_skill_score,
    next_question_difficulty,
    score_to_level,
    skill_assessment_node,
)


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
        "error_message": None, "error_node": None, "feature_flags": {},
        "assessment_answers": [],
    }
    return {**base, **overrides}


# ---------- calculate_skill_score ----------

def test_score_all_correct_hard():
    answers = [{"difficulty": "hard", "correct": True}] * 3
    assert calculate_skill_score(answers) == 1.0


def test_score_all_wrong():
    answers = [{"difficulty": "easy", "correct": False}] * 3
    assert calculate_skill_score(answers) == 0.0


def test_score_mixed_weighted():
    # easy correct (1), medium wrong (0/2), hard correct (3) => 4/6 = 0.67
    answers = [
        {"difficulty": "easy", "correct": True},
        {"difficulty": "medium", "correct": False},
        {"difficulty": "hard", "correct": True},
    ]
    assert calculate_skill_score(answers) == round(4 / 6, 2)


def test_score_empty_answers_no_crash():
    assert calculate_skill_score([]) == 0.0


# ---------- score_to_level boundary cases ----------

def test_level_beginner_at_zero():
    assert score_to_level(0.0) == "beginner"


def test_level_intermediate_at_half():
    assert score_to_level(0.5) == "intermediate"


def test_level_advanced_at_one():
    assert score_to_level(1.0) == "advanced"


def test_level_intermediate_just_below_half():
    assert score_to_level(0.49) == "intermediate"


def test_level_advanced_just_above_half():
    assert score_to_level(0.51) == "advanced"


# ---------- next_question_difficulty (adaptive ladder) ----------

def test_difficulty_increases_on_correct():
    answers = [{"difficulty": "easy", "correct": True}]
    assert next_question_difficulty(answers, "easy") == "medium"


def test_difficulty_stays_on_incorrect():
    answers = [{"difficulty": "easy", "correct": False}]
    assert next_question_difficulty(answers, "easy") == "easy"


def test_difficulty_caps_at_hard():
    answers = [{"difficulty": "easy", "correct": True}] * 5
    assert next_question_difficulty(answers, "easy") == "hard"


def test_difficulty_no_answers_returns_starting():
    assert next_question_difficulty([], "easy") == "easy"


# ---------- skill_assessment_node — happy path ----------

def test_node_happy_path_advanced():
    answers = [{"difficulty": "hard", "correct": True}] * 3
    state = make_state(assessment_answers=answers)

    result = skill_assessment_node(state)

    assert result["skill_score"] == 1.0
    assert result["skill_level"] == "advanced"
    assert result["next_action"] == "roadmap_generation"
    assert result["task_type"] == "roadmap_generation"
    assert result["error_message"] is None


def test_node_happy_path_beginner():
    answers = [{"difficulty": "easy", "correct": False}] * 3
    state = make_state(assessment_answers=answers)

    result = skill_assessment_node(state)

    assert result["skill_score"] == 0.0
    assert result["skill_level"] == "beginner"
    assert result["next_action"] == "roadmap_generation"


# ---------- skill_assessment_node — missing upstream data ----------

def test_node_missing_assessment_answers_no_crash():
    state = make_state()
    state.pop("assessment_answers")  # simulate missing upstream field entirely

    result = skill_assessment_node(state)

    assert result["skill_score"] == 0.0
    assert result["skill_level"] == "beginner"
    assert result["next_action"] == "roadmap_generation"
    assert result["error_message"] is None


# ---------- skill_assessment_node — feature flag disabled ----------

def test_node_feature_flag_disabled_skips_gracefully():
    state = make_state(feature_flags={"skill_assessment": False})

    result = skill_assessment_node(state)

    # Untouched skill_score/level, but routes forward correctly
    assert result["skill_score"] == 0.0
    assert result["skill_level"] == "beginner"
    assert result["next_action"] == "roadmap_generation"


# ---------- skill_assessment_node — error injection ----------

def test_node_error_injection_never_raises(monkeypatch):
    import src.graph.nodes.skill_assessment as mod

    def boom(_answers):
        raise RuntimeError("synthetic failure")

    monkeypatch.setattr(mod, "calculate_skill_score", boom)

    state = make_state(assessment_answers=[{"difficulty": "easy", "correct": True}])

    result = skill_assessment_node(state)

    assert result["error_message"] == "synthetic failure"
    assert result["error_node"] == "skill_assessment"
    assert result["next_action"] == "error_handler"
