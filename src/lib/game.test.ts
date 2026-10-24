import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerQuestion, clearLeaderboard, compareLeaderboardEntries, createLeaderboardEntry,
  getRoundResult, LEADERBOARD_KEY, nextQuestion, readLeaderboard, saveLeaderboardEntry,
  selectQuestions, startRound,
  type LeaderboardEntry, type LeaderboardStorage, type Question,
} from './game.ts';

const bank: Question[] = Array.from({ length: 20 }, (_, index) => ({
  id: String(index), image: `/quiz/${index}.png`, answer: index < 10 ? 'phishing' : 'legitimate',
}));

function memoryStorage(initial?: string): LeaderboardStorage {
  const values = new Map(initial === undefined ? [] : [[LEADERBOARD_KEY, initial]]);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
}

function entry(id: string, correct: number, elapsedMs: number): LeaderboardEntry {
  return { id, playerName: id, correct, total: 10, elapsedMs, completedAt: '2026-10-24T12:00:00.000Z' };
}

test('each random round balances labels, never repeats a question, and leaves the bank intact', () => {
  const original = JSON.stringify(bank);
  const round = selectQuestions(bank, 10, () => 0.61);
  assert.equal(round.length, 10);
  assert.equal(round.filter(question => question.answer === 'phishing').length, 5);
  assert.equal(new Set(round.map(question => question.id)).size, 10);
  assert.equal(JSON.stringify(bank), original);
  assert.deepEqual(round, selectQuestions(bank, 10, () => 0.61));
});

test('odd rounds differ by only one label; shortages fill from the remaining label', () => {
  assert.equal(selectQuestions(bank, 9, () => 0).filter(question => question.answer === 'phishing').length, 5);
  const unbalanced = [bank[0]!, ...bank.slice(10)];
  const round = selectQuestions(unbalanced, 10, () => 0.2);
  assert.equal(round.length, 10);
  assert.equal(round.filter(question => question.answer === 'phishing').length, 1);
  assert.equal(selectQuestions(bank.slice(0, 3), 10).length, 3);
});

test('selection deduplicates IDs and handles count boundaries', () => {
  assert.equal(selectQuestions([bank[0]!, bank[0]!], 10).length, 1);
  assert.deepEqual(selectQuestions(bank, 0), []);
  assert.deepEqual(selectQuestions([], 10), []);
  assert.equal(selectQuestions(bank, 2.8).length, 2);
  assert.throws(() => selectQuestions(bank, -1), RangeError);
  assert.throws(() => selectQuestions(bank, Number.NaN), RangeError);
});

test('answer locking prevents duplicate touches and excludes feedback time from score', () => {
  let state = startRound([bank[0]!, bank[10]!], 100);
  assert.equal(nextQuestion(state, 200), state);
  state = answerQuestion(state, 'phishing', 1100);
  assert.equal(answerQuestion(state, 'legitimate', 1200), state);
  assert.equal(getRoundResult(state).correct, 1);
  state = nextQuestion(state, 5100);
  assert.equal(state.index, 1);
  assert.equal(state.completed, false);
  state = answerQuestion(state, 'phishing', 5600);
  state = nextQuestion(state, 9000);
  assert.equal(state.status, 'complete');
  assert.equal(state.completed, true);
  assert.equal(state.index, 2);
  const result = getRoundResult(state);
  assert.equal(result.correct, 1);
  assert.equal(result.total, 2);
  assert.equal(result.elapsedMs, 1500);
  assert.equal(result.answers.length, 2);
  assert.equal(answerQuestion(state, 'legitimate', 10000), state);
  assert.equal(nextQuestion(state, 10000), state);
});

test('backward timestamps never produce a negative response time; invalid timestamps fail early', () => {
  const state = answerQuestion(startRound([bank[0]!], 500), 'phishing', 200);
  assert.equal(getRoundResult(state).elapsedMs, 0);
  assert.throws(() => startRound(bank, Number.NaN), RangeError);
  assert.throws(() => answerQuestion(startRound(bank, 0), 'phishing', Infinity), RangeError);
  assert.equal(startRound([], 0).status, 'complete');
});

test('only completed rounds become leaderboard entries and names are normalized', () => {
  let state = startRound([bank[0]!], 100);
  assert.throws(() => createLeaderboardEntry('Test', getRoundResult(state)), RangeError);
  state = answerQuestion(state, 'phishing', 250);
  const record = createLeaderboardEntry('  A\u0000isha   Noor  ', getRoundResult(state), {
    id: 'round-1', completedAt: '2026-10-24T12:00:00.000Z', email: ' aisha@example.com ',
  });
  assert.equal(record.playerName, 'Aisha Noor');
  assert.equal(record.elapsedMs, 150);
  assert.equal(record.correct, 1);
  assert.equal(record.email, 'aisha@example.com');
  const storage = memoryStorage();
  saveLeaderboardEntry(storage, record);
  assert.equal(readLeaderboard(storage)[0]?.email, 'aisha@example.com');
  assert.equal(createLeaderboardEntry('  ', getRoundResult(state)).playerName, 'Guest');
});

test('correctness outranks speed, and faster answers break a correctness tie', () => {
  const entries = [entry('fast-wrong', 8, 100), entry('slow-correct', 10, 20000), entry('fast-correct', 10, 5000)];
  assert.deepEqual(entries.sort(compareLeaderboardEntries).map(row => row.id), ['fast-correct', 'slow-correct', 'fast-wrong']);
});

test('corrupt, unsupported, malformed, and inaccessible storage recovers safely', () => {
  assert.deepEqual(readLeaderboard(memoryStorage('not json')), []);
  assert.deepEqual(readLeaderboard(memoryStorage('{"version":2,"entries":[]}')), []);
  const malformed = { ...entry('negative', 8, 100), elapsedMs: -1 };
  const storage = memoryStorage(JSON.stringify({ version: 1, entries: [entry('ok', 9, 100), malformed, null, { id: 'bad' }] }));
  assert.deepEqual(readLeaderboard(storage).map(row => row.id), ['ok']);
  assert.deepEqual(readLeaderboard({ ...storage, getItem() { throw new Error('Blocked'); } }), []);
});

test('saved leaderboard persists, deduplicates attempts, ranks, and can be cleared', () => {
  const storage = memoryStorage();
  assert.equal(saveLeaderboardEntry(storage, entry('a', 8, 500)).persisted, true);
  saveLeaderboardEntry(storage, entry('b', 10, 1000));
  saveLeaderboardEntry(storage, entry('a', 9, 400));
  assert.deepEqual(readLeaderboard(storage).map(row => row.id), ['b', 'a']);
  assert.equal(readLeaderboard(storage)[1]?.correct, 9);
  assert.equal(clearLeaderboard(storage), true);
  assert.deepEqual(readLeaderboard(storage), []);
});

test('storage write failures are reported while preserving an in-memory ranking', () => {
  const storage: LeaderboardStorage = {
    getItem: () => null,
    setItem() { throw new Error('Quota exceeded'); },
    removeItem() { throw new Error('Blocked'); },
  };
  const result = saveLeaderboardEntry(storage, entry('a', 10, 500));
  assert.equal(result.persisted, false);
  assert.equal(result[0]?.id, 'a');
  assert.equal(clearLeaderboard(storage), false);
});

test('a full ten-question kiosk round saves once with precise response time and survives reload', () => {
  const questions = selectQuestions(bank, undefined, () => 0.37);
  assert.equal(questions.length, 10);
  let state = startRound(questions, 100);
  let now = 100;
  for (let index = 0; index < 10; index += 1) {
    assert.equal(state.index, index);
    assert.equal(state.completed, false);
    const question = state.questions[index]!;
    const answer = index < 7 ? question.answer : question.answer === 'phishing' ? 'legitimate' : 'phishing';
    now += 1000 + index;
    state = answerQuestion(state, answer, now);
    assert.equal(answerQuestion(state, answer, now + 1), state);
    now += 1500;
    state = nextQuestion(state, now);
  }
  assert.equal(state.completed, true);
  const result = getRoundResult(state);
  assert.equal(result.correct, 7);
  assert.equal(result.total, 10);
  assert.equal(result.elapsedMs, 10045);
  const score = createLeaderboardEntry('Agent Ten', result, { id: 'ten', email: 'agent@example.com' });
  const storage = memoryStorage();
  saveLeaderboardEntry(storage, score);
  saveLeaderboardEntry(storage, score);
  const reloaded = readLeaderboard(storage);
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0]?.elapsedMs, 10045);
  assert.equal(reloaded[0]?.email, 'agent@example.com');
});
