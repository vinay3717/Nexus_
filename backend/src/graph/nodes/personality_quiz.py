"""
PersonalityQuizNode

Owned state fields:
- personality_profile
- quiz_skipped
- next_action
- task_type
- error_message
- error_node

Reads:
- feature_flags["personality_quiz"]
- input quiz answers (passed via state injection from route handler)
"""

from typing import Optional
from src.graph.state import NexusState


# The 5 fixed personality quiz questions and their learning-style dimensions
PERSONALITY_DIMENSIONS = [
    "visual_vs_text",
    "structured_vs_exploratory",
    "pace_preference",
    "feedback_preference",
    "goal_type",
]


def personality_quiz_node(state: NexusState) -> NexusState:
    """
    Processes personality quiz submission.

    Expects state to contain a transient key 'quiz_input' set by the route handler:
        quiz_input = {"skipped": bool, "answers": Optional[list[str]]}

    Writes:
        - personality_profile: dict | None
        - quiz_skipped: bool
        - next_action: str (routes to skill_assessment next)
        - task_type: str
    """
    try:
        # Feature flag check — graceful skip if disabled
        if not state.get("feature_flags", {}).get("personality_quiz", True):
            state["personality_profile"] = None
            state["quiz_skipped"] = True
            state["next_action"] = "skill_assessment"
            state["task_type"] = "personality_quiz"
            return state

        quiz_input = state.get("quiz_input")

        # Missing upstream data — no crash, treat as skipped
        if quiz_input is None:
            state["personality_profile"] = None
            state["quiz_skipped"] = True
            state["next_action"] = "skill_assessment"
            state["task_type"] = "personality_quiz"
            return state

        # User explicitly skipped
        if quiz_input.get("skipped", False):
            state["personality_profile"] = None
            state["quiz_skipped"] = True
            state["next_action"] = "skill_assessment"
            state["task_type"] = "personality_quiz"
            return state

        answers = quiz_input.get("answers")

        # Missing or malformed answers — no crash, treat as skipped
        if not answers or len(answers) != len(PERSONALITY_DIMENSIONS):
            state["personality_profile"] = None
            state["quiz_skipped"] = True
            state["next_action"] = "skill_assessment"
            state["task_type"] = "personality_quiz"
            return state

        # Build personality_profile dict from answers
        profile = {
            dimension: answer
            for dimension, answer in zip(PERSONALITY_DIMENSIONS, answers)
        }

        state["personality_profile"] = profile
        state["quiz_skipped"] = False
        state["next_action"] = "skill_assessment"
        state["task_type"] = "personality_quiz"
        return state

    except Exception as e:
        state["error_message"] = str(e)
        state["error_node"] = "personality_quiz"
        state["next_action"] = "error_handler"
        return state
