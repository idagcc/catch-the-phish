export type Answer = 'phishing' | 'legitimate';

export interface Question {
  id: string;
  image: string;
  answer: Answer;
  explanation?: string;
}

export interface AnswerRecord {
  questionId: string;
  answer: Answer;
  correct: boolean;
  elapsedMs: number;
}

export interface RoundState {
  questions: readonly Question[];
  index: number;
  completed: boolean;
  currentIndex: number;
  status: 'question' | 'answered' | 'complete';
  questionStartedAt: number;
  answers: readonly AnswerRecord[];
}

export interface RoundResult {
  correct: number;
  total: number;
  elapsedMs: number;
  answers: readonly AnswerRecord[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  email?: string;
  correct: number;
  total: number;
  elapsedMs: number;
  completedAt: string;
}

export interface LeaderboardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const LEADERBOARD_KEY = 'catch-the-phish.leaderboard.v1';
export const MAX_LEADERBOARD_ENTRIES = 1000;

function randomIndex(length: number, rng: () => number): number {
  const value = rng();
  return Math.floor(Math.min(1 - Number.EPSILON, Math.max(0, Number.isFinite(value) ? value : 0)) * length);
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = randomIndex(index + 1, rng);
    [shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!];
  }
  return shuffled;
}

/** Select a balanced random round without mutating the bank or repeating IDs. */
export function selectQuestions(pool: readonly Question[], count = 10, rng: () => number = Math.random): Question[] {
  if (!Number.isFinite(count) || count < 0) throw new RangeError('Question count must be a finite, non-negative number.');
  const unique = [...new Map(pool.map(question => [question.id, question])).values()];
  const size = Math.min(Math.floor(count), unique.length);
  const phishing = shuffle(unique.filter(question => question.answer === 'phishing'), rng);
  const legitimate = shuffle(unique.filter(question => question.answer === 'legitimate'), rng);
  const extraPhishing = size % 2 === 1 && randomIndex(2, rng) === 0;
  let phishingCount = Math.min(phishing.length, Math.floor(size / 2) + Number(extraPhishing));
  let legitimateCount = Math.min(legitimate.length, size - phishingCount);
  phishingCount = Math.min(phishing.length, size - legitimateCount);
  legitimateCount = Math.min(legitimate.length, size - phishingCount);
  return shuffle([...phishing.slice(0, phishingCount), ...legitimate.slice(0, legitimateCount)], rng);
}

function timestamp(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Timestamp must be finite.');
  return value;
}

/** Start timing only after the current question's image is ready to display. */
export function startRound(questions: readonly Question[], startedAt: number): RoundState {
  return {
    questions: [...questions],
    index: 0,
    completed: questions.length === 0,
    currentIndex: 0,
    status: questions.length ? 'question' : 'complete',
    questionStartedAt: timestamp(startedAt),
    answers: [],
  };
}

/** Answer once; subsequent touches return the same state until nextQuestion. */
export function answerQuestion(state: RoundState, answer: Answer, now: number): RoundState {
  if (state.status !== 'question') return state;
  if (answer !== 'phishing' && answer !== 'legitimate') throw new TypeError('Unknown answer.');
  const question = state.questions[state.currentIndex];
  if (!question) return state;
  const record: AnswerRecord = {
    questionId: question.id,
    answer,
    correct: answer === question.answer,
    elapsedMs: Math.max(0, timestamp(now) - state.questionStartedAt),
  };
  return { ...state, status: 'answered', answers: [...state.answers, record] };
}

/** Advance after feedback; feedback time is excluded from the score. */
export function nextQuestion(state: RoundState, now: number): RoundState {
  if (state.status !== 'answered') return state;
  const currentIndex = state.currentIndex + 1;
  return {
    ...state,
    index: currentIndex,
    completed: currentIndex >= state.questions.length,
    currentIndex,
    status: currentIndex >= state.questions.length ? 'complete' : 'question',
    questionStartedAt: timestamp(now),
  };
}

/** Also works during a round, for progress displays; total is the full round size. */
export function getRoundResult(state: RoundState): RoundResult {
  return {
    correct: state.answers.filter(answer => answer.correct).length,
    total: state.questions.length,
    elapsedMs: state.answers.reduce((total, answer) => total + answer.elapsedMs, 0),
    answers: [...state.answers],
  };
}

function cleanPlayerName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 40) || 'Guest';
}

function validScore(value: { correct: number; total: number; elapsedMs: number }): boolean {
  return Number.isSafeInteger(value.total) && value.total > 0
    && Number.isSafeInteger(value.correct) && value.correct >= 0 && value.correct <= value.total
    && Number.isFinite(value.elapsedMs) && value.elapsedMs >= 0;
}

/** Only completed rounds can enter the leaderboard. IDs/dates can be injected for tests. */
export function createLeaderboardEntry(
  playerName: string,
  result: RoundResult,
  options: { id?: string; completedAt?: string; email?: string } = {},
): LeaderboardEntry {
  if (!validScore(result) || result.answers.length !== result.total) throw new RangeError('Only a completed, valid round can be saved.');
  const completedAt = options.completedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(completedAt))) throw new RangeError('Completion date must be valid.');
  return {
    id: options.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    playerName: cleanPlayerName(playerName),
    ...(typeof options.email === 'string' ? { email: options.email.trim() } : {}),
    correct: result.correct,
    total: result.total,
    elapsedMs: result.elapsedMs,
    completedAt,
  };
}

/** Correct answers take priority; speed breaks ties; date and ID make ties stable. */
export function compareLeaderboardEntries(left: LeaderboardEntry, right: LeaderboardEntry): number {
  return right.correct - left.correct
    || left.elapsedMs - right.elapsedMs
    || Date.parse(left.completedAt) - Date.parse(right.completedAt)
    || left.id.localeCompare(right.id);
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as LeaderboardEntry;
  return typeof entry.id === 'string' && entry.id.length > 0
    && typeof entry.playerName === 'string'
    && (entry.email === undefined || typeof entry.email === 'string')
    && typeof entry.completedAt === 'string' && Number.isFinite(Date.parse(entry.completedAt))
    && validScore(entry);
}

function normalizeEntries(entries: readonly unknown[]): LeaderboardEntry[] {
  const unique = new Map<string, LeaderboardEntry>();
  for (const entry of entries) {
    if (isLeaderboardEntry(entry)) unique.set(entry.id, { ...entry, playerName: cleanPlayerName(entry.playerName) });
  }
  return [...unique.values()].sort(compareLeaderboardEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
}

/** Unavailable storage, corrupt JSON, and malformed records are safe to recover from. */
export function readLeaderboard(storage: LeaderboardStorage): LeaderboardEntry[] {
  try {
    const raw = storage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return [];
    const saved = data as { version?: number; entries?: unknown[] };
    return saved.version === 1 && Array.isArray(saved.entries) ? normalizeEntries(saved.entries) : [];
  } catch {
    return [];
  }
}

/** Return in-memory rankings even when storage is full; callers can surface persisted=false. */
export function saveLeaderboardEntry(
  storage: LeaderboardStorage,
  entry: LeaderboardEntry,
): LeaderboardEntry[] & { persisted: boolean } {
  if (!isLeaderboardEntry(entry)) throw new TypeError('Leaderboard entry is invalid.');
  const entries = normalizeEntries([...readLeaderboard(storage), entry]);
  try {
    storage.setItem(LEADERBOARD_KEY, JSON.stringify({ version: 1, entries }));
    return Object.assign(entries, { persisted: true });
  } catch {
    return Object.assign(entries, { persisted: false });
  }
}

export function clearLeaderboard(storage: LeaderboardStorage): boolean {
  try {
    storage.removeItem(LEADERBOARD_KEY);
    return true;
  } catch {
    return false;
  }
}
