/**
 * Reusable automatic grading. An exercise is data (instructions, hints,
 * rules); a rule inspects the student's actual work — a network, a circuit,
 * an algorithm trace — never how it is drawn on screen. All human text is a
 * locale key plus params, so the UI translates it and the logic stays pure.
 */

/** A translatable message: `key` is a locale key, params fill `{name}` slots. */
export interface Feedback {
  key: string;
  params?: Record<string, string | number>;
  /** A nested reason shown after the message, e.g. why a PING failed. */
  detail?: Feedback;
}

export interface RuleResult {
  passed: boolean;
  /** 0..1 share of the rule's points; defaults to 1 when passed, 0 when not. */
  partial?: number;
  /** Why it failed (or notes when it passed) — shown to the student. */
  feedback?: Feedback[];
}

export interface GradingRule<Work> {
  id: string;
  points: number;
  /** What the rule checks, e.g. "All three computers are cabled". */
  label: Feedback;
  evaluate: (work: Work) => RuleResult;
}

export interface Exercise<Work> {
  id: string;
  /** Lab family, e.g. 'network' | 'logic' | 'algorithm'. */
  type: string;
  instructions: Feedback;
  expectedResult: Feedback;
  maxScore: number;
  hints: Feedback[];
  gradingRules: GradingRule<Work>[];
  /** Points lost per hint opened (default 1). */
  hintPenalty?: number;
  /** Points lost per earlier submission that was not yet complete (default 1). */
  retryPenalty?: number;
  /** Penalties never take more than this off a complete solution (default 3). */
  maxPenalty?: number;
  /**
   * When the exercise counts as done. Default: every rule passed. A lab can
   * relax it — e.g. a fully assembled PC is "done" even after a few mistakes,
   * which still cost points through the rules.
   */
  isComplete?: (work: Work, outcomes: RuleOutcome[]) => boolean;
}

/** One student's attempt at an exercise; immutable, updated by session helpers. */
export interface Attempt {
  exerciseId: string;
  startedAt: number;
  hintsUsed: number;
  /** Submissions graded so far. */
  submissions: number;
  /** Submissions that were not complete. */
  failedSubmissions: number;
  /** Failed rules summed over all submissions — the "Errors" counter. */
  errors: number;
  completed: boolean;
}

export interface RuleOutcome {
  id: string;
  label: Feedback;
  points: number;
  earned: number;
  passed: boolean;
  feedback: Feedback[];
}

export type GradeStatus = 'completed' | 'incomplete';

export interface GradeReport {
  exerciseId: string;
  score: number;
  maxScore: number;
  /** Score as 0..100 for progress storage. */
  percent: number;
  seconds: number;
  errors: number;
  hints: number;
  submissions: number;
  penalty: number;
  status: GradeStatus;
  outcomes: RuleOutcome[];
}
