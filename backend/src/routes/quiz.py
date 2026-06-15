"""
Quiz routes — personality + assessment.

Additions for Feature 9:
- GET  /stream/assessment        SSE stream of adaptive questions
- POST /quiz/assessment/submit   submit one answer, get next question or final score

NOTE: This file is additive to Feature 8's personality quiz routes.
If src/routes/quiz.py already exists from Feature 8, merge the
personality router with this assessment router (e.g. combine into
one APIRouter or include both in graph.py / main.py).
"""

import asyncio
import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.graph.nodes.skill_assessment import (
    calculate_skill_score,
    next_question_difficulty,
    score_to_level,
)

router = APIRouter()

TOTAL_QUESTIONS = 6

# --- In-memory session store (dev only — swap for Redis in prod) ---
_assessment_sessions: dict[str, dict] = {}


def _generate_question(skill_name: str, difficulty: str, index: int) -> dict:
    """
    Placeholder question generator. In production this calls
    model_router.get_model("quiz_generation") (GPT-4o Mini) to generate
    a question. Kept synchronous + mocked here so the SSE flow and
    unit tests don't require an API key.
    """
    return {
        "id": f"q-{index}",
        "question": f"[{difficulty.upper()}] {skill_name} question #{index + 1}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 0,  # placeholder — real impl validates server-side only
        "difficulty": difficulty,
    }


@router.get("/stream/assessment")
async def stream_assessment(request: Request, session_id: str, skill_name: str = "Python"):
    """
    Opens an SSE connection and streams adaptive assessment questions.
    Each question is sent as: data: {"type": "question", "question": {...}}
    Final event: data: {"type": "done", "skill_score": ..., "skill_level": ...}
    """
    _assessment_sessions[session_id] = {
        "skill_name": skill_name,
        "answers": [],
        "current_difficulty": "easy",
    }

    async def event_generator():
        sess = _assessment_sessions[session_id]

        for i in range(TOTAL_QUESTIONS):
            if await request.is_disconnected():
                break

            difficulty = next_question_difficulty(sess["answers"], sess["current_difficulty"])
            question = _generate_question(sess["skill_name"], difficulty, i)
            question["_session_id"] = session_id  # convenience; not sent in real impl

            payload = {"type": "question", "question": {k: v for k, v in question.items() if not k.startswith("_")}}
            yield f"data: {json.dumps(payload)}\n\n"

            # Wait for the answer to arrive via POST /quiz/assessment/submit.
            # Simplified polling loop for the stub — real impl uses an
            # async event/queue keyed by session_id.
            while len(sess["answers"]) <= i:
                if await request.is_disconnected():
                    return
                await asyncio.sleep(0.1)

        score = calculate_skill_score(sess["answers"])
        level = score_to_level(score)
        yield f"data: {json.dumps({'type': 'done', 'skill_score': score, 'skill_level': level})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class AssessmentAnswer(BaseModel):
    session_id: str
    question_index: int
    selected_index: int


@router.post("/quiz/assessment/submit")
async def submit_assessment_answer(payload: AssessmentAnswer):
    """
    Records one answer for the session. The SSE stream picks this up
    and emits the next question (or the final 'done' event).
    """
    sess = _assessment_sessions.get(payload.session_id)
    if sess is None:
        return {"error": "session not found"}, 404

    difficulty = next_question_difficulty(sess["answers"], sess["current_difficulty"])

    # Placeholder: correctness is mocked. Real impl compares
    # selected_index to the stored correct_index for this question.
    correct = payload.selected_index == 0

    sess["answers"].append({"difficulty": difficulty, "correct": correct})

    is_last = len(sess["answers"]) >= TOTAL_QUESTIONS
    response = {"recorded": True, "answers_so_far": len(sess["answers"])}

    if is_last:
        score = calculate_skill_score(sess["answers"])
        level = score_to_level(score)
        response["skill_score"] = score
        response["skill_level"] = level
        response["complete"] = True

    return response
