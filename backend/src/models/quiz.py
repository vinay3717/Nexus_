"""
Pydantic models for quiz/assessment content.

Used by skill_assessment.py (adaptive assessment) and level_gate.py (gate tests).
Frozen after Day 1 alongside NexusState.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class Question(BaseModel):
    """A single quiz/assessment question."""

    id: str = Field(..., description="Unique identifier for this question")
    text: str = Field(..., description="The question text")
    options: list[str] = Field(..., description="Answer options, typically 4")
    correct_index: int = Field(..., description="Index into options of the correct answer")
    difficulty: Literal["easy", "medium", "hard"] = Field(
        ..., description="Difficulty of this question, used for adaptive scaling"
    )
    concept_tag: Optional[str] = Field(
        default=None,
        description="The concept this question tests — used for gap analysis on gate tests",
    )


class Answer(BaseModel):
    """A single submitted answer to a question."""

    question_id: str = Field(..., description="ID of the question being answered")
    selected_index: int = Field(..., description="Index of the option the user selected")
    correct: bool = Field(..., description="Whether the selected answer was correct")
    concept_tag: Optional[str] = Field(
        default=None, description="Concept tag carried over from the Question for gap analysis"
    )


class QuizResult(BaseModel):
    """The result of a completed quiz (assessment or gate test)."""

    score: float = Field(..., description="Score from 0.0 to 1.0")
    passed: Optional[bool] = Field(
        default=None, description="Pass/fail outcome — used for gate tests, None for assessments"
    )
    skill_level: Optional[Literal["beginner", "intermediate", "advanced"]] = Field(
        default=None, description="Mapped skill level — only set for the personality/skill assessment"
    )
    answers: list[Answer] = Field(
        default_factory=list, description="Full answer record, used for gap analysis"
    )
