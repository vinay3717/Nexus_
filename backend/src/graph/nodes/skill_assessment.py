"""
Skill Assessment Node — Nexus

Owned NexusState fields:
- skill_score
- skill_level
- next_action
- error_message, error_node (on failure only)

Reads:
- skill_name
- feature_flags
- task_type (set before calling model_router, if questions are LLM-generated)

Adaptive difficulty ladder: easy -> medium -> hard.
Correct answer -> increase difficulty (cap at hard).
Wrong answer -> difficulty stays the same.

skill_score = weighted_correct / weighted_total
  weights: easy=1, medium=2, hard=3

skill_level mapping:
  score == 0.0           -> beginner
  0.0 < score <= 0.5     -> intermediate  (covers the 0.5 boundary case)
  score > 0.5            -> advanced

NOTE: exact boundary test cases required by spec:
  0.0 -> beginner
  0.5 -> intermediate
  1.0 -> advanced
"""

from typing import Literal

from src.graph.state import NexusState

DIFFICULTY_LADDER = ["easy", "medium", "hard"]
DIFFICULTY_WEIGHTS = {"easy": 1, "medium": 2, "hard": 3}


def _next_difficulty(current: str, correct: bool) -> str:
    """Move up the ladder on correct answers, stay put on incorrect ones."""
    if not correct:
        return current
    idx = DIFFICULTY_LADDER.index(current)
    return DIFFICULTY_LADDER[min(idx + 1, len(DIFFICULTY_LADDER) - 1)]


def calculate_skill_score(answers: list[dict]) -> float:
    """
    answers: list of {"difficulty": "easy"|"medium"|"hard", "correct": bool}

    Returns weighted_correct / weighted_total, rounded to 2 dp.
    Empty input -> 0.0 (no crash).
    """
    if not answers:
        return 0.0

    weighted_total = 0
    weighted_correct = 0

    for a in answers:
        difficulty = a.get("difficulty", "easy")
        weight = DIFFICULTY_WEIGHTS.get(difficulty, 1)
        weighted_total += weight
        if a.get("correct"):
            weighted_correct += weight

    if weighted_total == 0:
        return 0.0

    return round(weighted_correct / weighted_total, 2)


def score_to_level(score: float) -> Literal["beginner", "intermediate", "advanced"]:
    """
    0.0          -> beginner
    0.0 < x <=0.5 -> intermediate
    > 0.5         -> advanced
    """
    if score <= 0.0:
        return "beginner"
    elif score <= 0.5:
        return "intermediate"
    else:
        return "advanced"


def build_question_sequence(starting_difficulty: str = "easy", num_questions: int = 6) -> list[dict]:
    """
    Generates the difficulty progression for a session BEFORE the user
    starts answering. Used by the SSE route to know what difficulty to
    send next, given the running list of answers so far.

    This function itself doesn't decide adaptively (that requires live
    answers) — see `next_question_difficulty` for the live adaptive step.
    """
    return [{"index": i, "difficulty": starting_difficulty} for i in range(num_questions)]


def next_question_difficulty(answers_so_far: list[dict], starting_difficulty: str = "easy") -> str:
    """
    Given the answers submitted so far (in order), compute the difficulty
    of the NEXT question using the adaptive ladder.
    """
    current = starting_difficulty
    for a in answers_so_far:
        current = _next_difficulty(current, bool(a.get("correct")))
    return current


def skill_assessment_node(state: NexusState) -> NexusState:
    """
    Computes skill_score and skill_level from state['test_history']
    (or a dedicated 'assessment_answers' list if present), writes them
    to state, and sets next_action to proceed to roadmap generation.

    Never raises — on any error, writes error_message/error_node and
    routes to error_handler.
    """
    try:
        # Feature flag check — skip gracefully if assessment disabled
        if not state.get("feature_flags", {}).get("skill_assessment", True):
            state["next_action"] = "roadmap_generation"
            return state

        answers = state.get("assessment_answers", []) or []

        score = calculate_skill_score(answers)
        level = score_to_level(score)

        state["skill_score"] = score
        state["skill_level"] = level
        state["next_action"] = "roadmap_generation"
        state["task_type"] = "roadmap_generation"

        return state

    except Exception as e:
        state["error_message"] = str(e)
        state["error_node"] = "skill_assessment"
        state["next_action"] = "error_handler"
        return state
