"use client";

import { useState } from "react";
import QuizOption from "@/components/ui/QuizOption";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { submitGateTest } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GateTestQuestion {
  id: string;
  text: string;
  options: string[];
  concept_tag?: string; // sent back to backend for gap analysis
}

interface AnswerRecord {
  question_id: string;
  selected_index: number;
  concept_tag?: string;
}

type RevealState = "pass" | "partial" | "fail";

interface GateTestProps {
  levelId: string;
  questions: GateTestQuestion[];
  /** Called after score reveal — parent uses this to decide routing */
  onResult: (score: number, passed: boolean) => void;
}

// ─── Score thresholds (mirrors backend level_gate.py) ────────────────────────

const PASS_THRESHOLD = 70;
const PARTIAL_THRESHOLD = 60;

function getRevealState(score: number): RevealState {
  if (score >= PASS_THRESHOLD) return "pass";
  if (score >= PARTIAL_THRESHOLD) return "partial";
  return "fail";
}

// ─── Mock questions (used when no props supplied) ─────────────────────────────

const MOCK_QUESTIONS: GateTestQuestion[] = [
  {
    id: "q1",
    text: "In Python, what does the `__init__` method do?",
    options: [
      "Destroys an object when it goes out of scope",
      "Initialises a new instance of a class",
      "Imports external modules",
      "Defines a class method",
    ],
    concept_tag: "oop_basics",
  },
  {
    id: "q2",
    text: "Which of these is a mutable data type in Python?",
    options: ["tuple", "string", "list", "integer"],
    concept_tag: "data_types",
  },
  {
    id: "q3",
    text: "What does `*args` allow a function to accept?",
    options: [
      "A fixed number of keyword arguments",
      "Any number of positional arguments",
      "Only integer arguments",
      "A dictionary of named arguments",
    ],
    concept_tag: "functions",
  },
  {
    id: "q4",
    text: "What is the output of `type([])`?",
    options: [
      "<class 'array'>",
      "<class 'list'>",
      "<class 'tuple'>",
      "<class 'sequence'>",
    ],
    concept_tag: "data_types",
  },
  {
    id: "q5",
    text: "Which keyword creates a generator function in Python?",
    options: ["return", "async", "yield", "generate"],
    concept_tag: "advanced_functions",
  },
];

// Correct answer indices for mock questions (index into options array)
const MOCK_CORRECT: Record<string, number> = {
  q1: 1,
  q2: 2,
  q3: 1,
  q4: 1,
  q5: 2,
};

// ─── Score Reveal Screen ───────────────────────────────────────────────────────

interface RevealProps {
  score: number;
  state: RevealState;
  onContinue: () => void;
}

function ScoreReveal({ score, state, onContinue }: RevealProps) {
  const config = {
    pass: {
      icon: "🏆",
      headline: "Level complete",
      sub: "You passed. The next level is unlocked — you've clearly got this.",
      cta: "Go to next level",
      ctaIcon: "→",
      barColor: "#1D9E75",
      scoreColor: "#085041",
      bgColor: "#E1F5EE",
      thresholdLabel: "✓ 70% pass",
      thresholdColor: "#0F6E56",
    },
    partial: {
      icon: "🔥",
      headline: "Almost there",
      sub: "You're in the 60–69% range. One more attempt available — no penalty for trying again.",
      cta: "Retry test",
      ctaIcon: "↺",
      barColor: "#EF9F27",
      scoreColor: "#633806",
      bgColor: "#FAEEDA",
      thresholdLabel: "↑ 70% to pass",
      thresholdColor: "#BA7517",
    },
    fail: {
      icon: "⚠️",
      headline: "Some concepts need work",
      sub: "Nexus found gaps in your answers. A short targeted lesson covers only what tripped you up.",
      cta: "View sublevel suggestion",
      ctaIcon: "📖",
      barColor: "#D85A30",
      scoreColor: "#712B13",
      bgColor: "#FAECE7",
      thresholdLabel: "↑ 70% to pass",
      thresholdColor: "#D85A30",
    },
  }[state];

  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      {/* Icon circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
        style={{ background: config.bgColor }}
        aria-hidden="true"
      >
        {config.icon}
      </div>

      {/* Score */}
      <p
        className="text-6xl font-medium mb-1 leading-none"
        style={{ color: config.scoreColor }}
      >
        {Math.round(score)}%
      </p>
      <p className="text-xs tracking-widest uppercase text-secondary mb-3">
        your score
      </p>

      {/* Headline + sub */}
      <p className="text-xl font-medium text-primary mb-2">{config.headline}</p>
      <p className="text-sm text-secondary leading-relaxed max-w-sm mb-8">
        {config.sub}
      </p>

      {/* Score bar */}
      <div className="w-full max-w-xs mb-8">
        <div
          className="h-1.5 rounded-full overflow-hidden mb-1.5"
          style={{ background: "var(--color-border-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round(score)}%`,
              background: config.barColor,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-tertiary">
          <span>0%</span>
          <span style={{ color: config.thresholdColor, fontWeight: 500 }}>
            {config.thresholdLabel}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" onClick={onContinue}>
          {config.ctaIcon} {config.cta}
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>
          Back to content
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GateTest({
  levelId,
  questions = MOCK_QUESTIONS,
  onResult,
}: GateTestProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // Reveal state (null = still in quiz)
  const [revealState, setRevealState] = useState<RevealState | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex) / questions.length) * 100;

  // ── Answer selection ──────────────────────────────────────────────────────

  function handleSelect(optionIndex: number) {
    if (revealed) return; // lock after reveal
    setSelectedOption(optionIndex);
    setRevealed(true);
  }

  // ── Advance or finish ─────────────────────────────────────────────────────

  async function handleNext() {
    if (selectedOption === null) return;

    const record: AnswerRecord = {
      question_id: question.id,
      selected_index: selectedOption,
      concept_tag: question.concept_tag,
    };

    const nextAnswers = [...answers, record];
    setAnswers(nextAnswers);

    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setRevealed(false);
      return;
    }

    // ── Last question: submit and compute score ────────────────────────────

    setSubmitting(true);
    setError(null);

    try {
      // Try real backend; falls back to local mock scoring if api throws
      let score: number;

      try {
        const result = await submitGateTest(levelId, nextAnswers);
        score = result.score; // backend returns 0–100
      } catch {
        // Mock scoring: count correct answers against MOCK_CORRECT
        const correct = nextAnswers.filter(
          (a) => MOCK_CORRECT[a.question_id] === a.selected_index
        ).length;
        score = Math.round((correct / questions.length) * 100);
      }

      const state = getRevealState(score);
      setFinalScore(score);
      setRevealState(state);
    } catch (err) {
      setError("Something went wrong submitting your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── After reveal CTA ──────────────────────────────────────────────────────

  function handleRevealContinue() {
    if (revealState === null) return;
    onResult(finalScore, revealState === "pass");
  }

  // ── Option display state ──────────────────────────────────────────────────

  function getOptionState(
    optIndex: number
  ): "default" | "selected" | "correct" | "wrong" {
    if (!revealed) {
      return optIndex === selectedOption ? "selected" : "default";
    }
    // After reveal: show correct in green, wrong selection in red
    const correctIndex = MOCK_CORRECT[question.id]; // replace with real correct from API if available
    if (optIndex === correctIndex) return "correct";
    if (optIndex === selectedOption && optIndex !== correctIndex) return "wrong";
    return "default";
  }

  // ── Score reveal screen ───────────────────────────────────────────────────

  if (revealState !== null) {
    return (
      <ScoreReveal
        score={finalScore}
        state={revealState}
        onContinue={handleRevealContinue}
      />
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl">
      {/* Progress */}
      <ProgressBar
        value={progressPercent}
        label={`Question ${currentIndex + 1} of ${questions.length}`}
      />

      {/* Question */}
      <p className="text-lg font-medium text-primary leading-snug mb-6">
        {question.text}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2.5 mb-8">
        {question.options.map((opt, i) => (
          <QuizOption
            key={i}
            label={["A", "B", "C", "D"][i]}
            text={opt}
            state={getOptionState(i)}
            onClick={() => handleSelect(i)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {/* Next / Submit */}
      <Button
        variant="primary"
        onClick={handleNext}
        disabled={selectedOption === null || submitting}
        loading={submitting}
      >
        {submitting
          ? "Submitting…"
          : isLastQuestion
          ? "See results"
          : "Next question →"}
      </Button>
    </div>
  );
}
