// frontend/lib/api.ts
// Typed API client for all Nexus backend endpoints.
// All functions currently return mock data.
// To wire up the real backend: replace the `return MOCK_...` line in each
// function with the `fetch(...)` block shown in the comment above it.

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ─── Shared types (mirror NexusState) ────────────────────────────────────────

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "exercise";
}

export interface Level {
  index: number;
  title: string;
  description: string;
  resources: Resource[];
  locked: boolean;
}

export interface Roadmap {
  id: string;
  skill_name: string;
  skill_level: SkillLevel;
  total_levels: number;
  levels: Level[];
  roadmap_version: number;
  current_level_index: number;
  roadmap_locked: boolean;
  regeneration_count: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizResult {
  skill_score: number;        // 0.0 – 1.0
  skill_level: SkillLevel;
  total_questions: number;
  correct_answers: number;
}

export interface PersonalityProfile {
  learning_style: "visual" | "text";
  pace: "structured" | "exploratory";
  feedback_preference: "frequent" | "minimal";
  goal_type: "career" | "hobby" | "academic";
  session_length: "short" | "long";
}

export interface UserStats {
  points: number;
  badges: string[];
  streak_days: number;
  last_active: string;
}

export interface SessionStartResponse {
  session_id: string;
  user_id: string;
  feature_flags: Record<string, boolean>;
  skill_name: string;
  skill_level: SkillLevel;
}

export interface GateTestAnswer {
  question_id: string;
  selected_option: string;
}

export interface GateTestResult {
  score: number;             // 0–100
  passed: boolean;
  partial_credit: boolean;
  fail_count: number;
  concept_gaps: string[];
}

export interface SublevelDecision {
  decision: "accept" | "challenge" | "reassess" | "microlesson";
}

export interface SublevelResponse {
  sublevel_reject_count: number;
  next_action: string;
  mini_roadmap?: {
    title: string;
    lessons: { title: string; description: string }[];
  };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LEVELS: Level[] = [
  {
    index: 0,
    title: "Python Fundamentals",
    description: "Variables, data types, control flow, and basic functions.",
    resources: [
      { title: "Python Crash Course — Ch. 1–3", url: "#", type: "article" },
      { title: "Automate the Boring Stuff — Ch. 1", url: "#", type: "video" },
      { title: "FizzBuzz & basic loops exercise", url: "#", type: "exercise" },
    ],
    locked: false,
  },
  {
    index: 1,
    title: "Functions & Modules",
    description: "Writing reusable functions, scope, imports, and the standard library.",
    resources: [
      { title: "Real Python — Functions deep dive", url: "#", type: "article" },
      { title: "Corey Schafer — Python modules", url: "#", type: "video" },
      { title: "Build a CLI calculator", url: "#", type: "exercise" },
    ],
    locked: true,
  },
  {
    index: 2,
    title: "OOP & Project Structure",
    description: "Classes, inheritance, encapsulation, and laying out a real project.",
    resources: [
      { title: "Python OOP — Real Python", url: "#", type: "article" },
      { title: "Corey Schafer — OOP series", url: "#", type: "video" },
      { title: "Build a bank account class", url: "#", type: "exercise" },
    ],
    locked: true,
  },
];

const MOCK_ROADMAP: Roadmap = {
  id: "mock-roadmap-001",
  skill_name: "Python",
  skill_level: "beginner",
  total_levels: 3,
  levels: MOCK_LEVELS,
  roadmap_version: 1,
  current_level_index: 0,
  roadmap_locked: false,
  regeneration_count: 0,
};

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "What does `len([1, 2, 3])` return?",
    options: ["2", "3", "4", "undefined"],
    difficulty: "easy",
  },
  {
    id: "q2",
    text: "Which keyword is used to define a function in Python?",
    options: ["func", "def", "fn", "function"],
    difficulty: "easy",
  },
  {
    id: "q3",
    text: "What is the output of `list(range(2, 8, 2))`?",
    options: ["[2, 4, 6]", "[2, 4, 6, 8]", "[2, 3, 4, 5, 6, 7]", "[0, 2, 4, 6]"],
    difficulty: "medium",
  },
];

const MOCK_USER_STATS: UserStats = {
  points: 50,
  badges: ["⭐ First skill"],
  streak_days: 1,
  last_active: new Date().toISOString(),
};

const MOCK_SESSION: SessionStartResponse = {
  session_id: "mock-session-001",
  user_id: "mock-user-001",
  feature_flags: {
    personality_quiz: true,
    adaptive_sublevel: true,
    gamification: true,
    email_job: false,
  },
  skill_name: "Python",
  skill_level: "beginner",
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * POST /session/start
 * Starts a new learning session. Pass skill_level + skip_assessment for
 * the progressive level-up flow (Beginner → Intermediate → Advanced).
 */
export async function startSession(params: {
  skill_name: string;
  skill_level?: SkillLevel;
  skip_assessment?: boolean;
}): Promise<SessionStartResponse> {
  // Real call (swap in when backend is live):
  // const res = await fetch(`${BACKEND_URL}/session/start`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(params),
  // });
  // return res.json();

  return { ...MOCK_SESSION, skill_name: params.skill_name, skill_level: params.skill_level ?? "beginner" };
}

/**
 * POST /quiz/personality/submit
 * Stores the personality profile. Pass { skipped: true } to skip.
 */
export async function submitPersonalityQuiz(
  payload: { skipped: true } | { skipped: false; profile: PersonalityProfile }
): Promise<{ success: boolean; personality_profile: PersonalityProfile | null }> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/quiz/personality/submit`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // return res.json();

  if (payload.skipped) return { success: true, personality_profile: null };
  return {
    success: true,
    personality_profile: payload.profile,
  };
}

/**
 * GET /stream/assessment  (SSE)
 * Returns the EventSource URL to open. The caller uses this with useAssessmentStream.
 * Not a fetch — just returns the URL so the hook can open EventSource(url).
 */
export function getAssessmentStreamUrl(session_id: string): string {
  return `${BACKEND_URL}/stream/assessment?session_id=${session_id}`;
}

/**
 * POST /quiz/assessment/submit
 * Submits one assessment answer and returns the next question or a final result.
 */
export async function submitAssessmentAnswer(params: {
  session_id: string;
  question_id: string;
  answer: string;
}): Promise<{ next_question: Question | null; result: QuizResult | null }> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/quiz/assessment/submit`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(params),
  // });
  // return res.json();

  // Mock: return a next question for the first 2 calls, then a final result
  const mockNextQuestion = MOCK_QUESTIONS[1] ?? null;
  const isLastQuestion = params.question_id === "q3";

  if (isLastQuestion) {
    return {
      next_question: null,
      result: { skill_score: 0.6, skill_level: "beginner", total_questions: 3, correct_answers: 2 },
    };
  }
  return { next_question: mockNextQuestion, result: null };
}

/**
 * GET /stream/roadmap  (SSE)
 * Returns the EventSource URL. Caller opens EventSource(url).
 */
export function getRoadmapStreamUrl(session_id: string): string {
  return `${BACKEND_URL}/stream/roadmap?session_id=${session_id}`;
}

/**
 * GET /roadmap/:id
 * Fetches the full structured roadmap JSON after the stream completes.
 */
export async function getRoadmap(roadmap_id: string): Promise<Roadmap> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/roadmap/${roadmap_id}`);
  // return res.json();

  return { ...MOCK_ROADMAP, id: roadmap_id };
}

/**
 * POST /roadmap/:id/regenerate
 * Submits user feedback and triggers a new roadmap stream.
 * Returns 202 Accepted — caller should re-open the SSE stream URL after this.
 */
export async function regenerateRoadmap(
  roadmap_id: string,
  feedback: string
): Promise<{ accepted: boolean; regeneration_count: number }> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/roadmap/${roadmap_id}/regenerate`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ feedback }),
  // });
  // return res.json();

  return { accepted: true, regeneration_count: 1 };
}

/**
 * POST /level/:id/submit
 * Submits all gate test answers for a level.
 */
export async function submitGateTest(params: {
  level_id: string;
  answers: GateTestAnswer[];
}): Promise<GateTestResult> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/level/${params.level_id}/submit`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ answers: params.answers }),
  // });
  // return res.json();

  // Mock: always return a fail so the sublevel flow can be demoed
  return {
    score: 55,
    passed: false,
    partial_credit: false,
    fail_count: 1,
    concept_gaps: ["List comprehensions", "Dictionary methods"],
  };
}

/**
 * POST /sublevel/decision
 * Sends the user's decision after a gate test failure.
 */
export async function submitSublevelDecision(
  decision: SublevelDecision
): Promise<SublevelResponse> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/sublevel/decision`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(decision),
  // });
  // return res.json();

  if (decision.decision === "accept") {
    return {
      sublevel_reject_count: 0,
      next_action: "sublevel_content",
      mini_roadmap: {
        title: "Closing Your Gaps: Lists & Dicts",
        lessons: [
          { title: "List Comprehensions", description: "Write concise list transforms in one line." },
          { title: "Dictionary Methods", description: "keys(), values(), items(), get(), and update()." },
          { title: "Mini-project", description: "Refactor a script using comprehensions and dict methods." },
        ],
      },
    };
  }

  return { sublevel_reject_count: 1, next_action: "gate_test_retry" };
}

/**
 * GET /user/stats
 * Returns points, badges, and streak for the current user.
 */
export async function getUserStats(): Promise<UserStats> {
  // Real call:
  // const res = await fetch(`${BACKEND_URL}/user/stats`);
  // return res.json();

  return MOCK_USER_STATS;
}
