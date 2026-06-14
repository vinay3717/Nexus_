"""
NexusState — The Shared Contract

This TypedDict travels through every LangGraph node.
FROZEN AFTER DAY 1. Do not add, remove, or rename fields without updating both teammates.
"""

from typing import TypedDict, Optional, Literal


class NexusState(TypedDict):
    # Identity
    user_id: str
    session_id: str

    # Personality
    personality_profile: Optional[dict]  # None if quiz skipped
    quiz_skipped: bool

    # Skill
    skill_name: str
    skill_score: float  # 0.0 - 1.0
    skill_level: Literal["beginner", "intermediate", "advanced"]

    # Roadmap
    roadmap: Optional[dict]  # Pydantic Roadmap serialised to dict
    roadmap_version: int  # increments on every regeneration
    current_level_index: int
    roadmap_locked: bool  # True once user enters Level 1

    # Roadmap regeneration
    user_roadmap_feedback: Optional[str]  # free text from user, None on first gen
    regeneration_count: int  # max 2 — prevents abuse

    # Progressive level flow
    skip_assessment: bool  # True when levelling up — user already proved competency

    # Gate test
    test_history: list[dict]
    fail_count: int  # resets after sublevel completion
    sublevel_reject_count: int  # hard exit after 3

    # Gamification
    points: int
    badges: list[str]
    streak_days: int

    # Routing
    next_action: str
    task_type: str  # model_router reads this to pick LLM
    error_message: Optional[str]
    error_node: Optional[str]

    # Config
    feature_flags: dict[str, bool]


def make_state(**overrides) -> NexusState:
    """
    Shared test helper — paste into every unit test file.
    Returns a valid NexusState with sensible defaults, overridden by kwargs.
    """
    base: NexusState = {
        "user_id": "test-user",
        "session_id": "test-session",
        "skill_name": "Python",
        "skill_score": 0.0,
        "skill_level": "beginner",
        "personality_profile": None,
        "quiz_skipped": False,
        "roadmap": None,
        "roadmap_version": 1,
        "current_level_index": 0,
        "roadmap_locked": False,
        "user_roadmap_feedback": None,
        "regeneration_count": 0,
        "skip_assessment": False,
        "fail_count": 0,
        "sublevel_reject_count": 0,
        "test_history": [],
        "points": 0,
        "badges": [],
        "streak_days": 0,
        "next_action": "",
        "task_type": "",
        "error_message": None,
        "error_node": None,
        "feature_flags": {},
    }
    return {**base, **overrides}
