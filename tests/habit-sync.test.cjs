"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Habits = require("../habits.js");
const ActivitySessions = require("../activity-sessions.js");

const source = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const NOW = 1_800_000_000_000;

function habit(overrides = {}) {
  return {
    id: "habit-1", title: "阅读", color: "sage", metricType: "boolean",
    targetValue: 1, unit: "", daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    createdAt: NOW, updatedAt: NOW, archivedAt: null, ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    id: "habit-1::2027-01-15", habitId: "habit-1", dayKey: "2027-01-15",
    value: 1, createdAt: NOW, updatedAt: NOW, ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    syncUpdatedAt: 0,
    tasks: [], courses: [], memos: [], memoTags: [],
    focusSessions: [], focusByDate: {}, flames: 0, flameLedger: [],
    activitySessions: [], activeActivitySessionId: null,
    habits: [], habitEntries: [],
    transactions: [], dailyPlans: {}, quotes: [],
    ownedSkins: [], ownedFlowers: [], ownedThemes: [],
    deletions: { version: 1, tasks: {}, memos: {} },
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSyncApi(state = baseState()) {
  const deletionStart = source.indexOf("function normalizeDeletionMap");
  const deletionEnd = source.indexOf("function normalizeState", deletionStart);
  const mergeStart = source.indexOf("function mergeById");
  const mergeEnd = source.indexOf("function scheduleCloudSync", mergeStart);
  const context = { Number, String, Object, Array, Map, Set, Date, structuredClone, state, Habits, ActivitySessions };
  vm.createContext(context);
  vm.runInContext(`
    ${source.slice(deletionStart, deletionEnd)}
    ${source.slice(mergeStart, mergeEnd)}
    this.api = { mergeSyncedStates, cloudSafeState };
  `, context);
  return context.api;
}

function normalizeStateInHarness(state) {
  const deletionStart = source.indexOf("function normalizeDeletionMap");
  const normalizeEnd = source.indexOf("function restoreTimerState", deletionStart);
  const context = {
    Number, String, Object, Array, Map, Set, Date,
    ActivitySessions, Habits, state,
    DEFAULT_MEMO_TAGS: ["全部"], SKINS: [{ id: "classic" }],
    FLOWER_SKINS: [{ id: "coral" }], THEMES: [{ id: "paper" }],
    isSavingTransfer: () => false, guessFinanceCategory: () => "其他",
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(deletionStart, normalizeEnd)}; normalizeState();`, context);
  return context.state;
}

test("default state and browser load order include habit support", () => {
  assert.match(source, /habits:\s*\[\]/);
  assert.match(source, /habitEntries:\s*\[\]/);
  const habitsIndex = indexSource.indexOf("habits.js?v=1");
  const appIndex = indexSource.indexOf("app.js?v=53");
  assert.ok(habitsIndex >= 0 && appIndex > habitsIndex);
});

test("old states normalize to empty habit collections", () => {
  const state = baseState();
  delete state.habits;
  delete state.habitEntries;
  state.financeRulesVersion = 4;
  const normalized = normalizeStateInHarness(state);
  assert.deepEqual(plain(normalized.habits), []);
  assert.deepEqual(plain(normalized.habitEntries), []);
});

test("state normalization repairs damaged and duplicate habit data", () => {
  const state = baseState({
    financeRulesVersion: 4,
    habits: [habit({ title: "旧", updatedAt: NOW }), habit({ title: "新", updatedAt: NOW + 1 }), null],
    habitEntries: [entry({ value: 1 }), entry({ value: 0, updatedAt: NOW + 1 }), { bad: true }],
  });
  const normalized = normalizeStateInHarness(state);
  assert.equal(normalized.habits.length, 1);
  assert.equal(normalized.habits[0].title, "新");
  assert.equal(normalized.habitEntries.length, 1);
  assert.equal(normalized.habitEntries[0].value, 0);
});

test("whole-state sync merges habits and entries by updatedAt", () => {
  const api = createSyncApi();
  const local = baseState({ habits: [habit({ title: "本地旧值" })], habitEntries: [entry({ value: 1 })] });
  const remote = baseState({
    habits: [habit({ title: "远端新值", updatedAt: NOW + 2 })],
    habitEntries: [entry({ value: 0, updatedAt: NOW + 3 })],
  });
  const merged = api.mergeSyncedStates(local, remote);
  assert.equal(merged.habits[0].title, "远端新值");
  assert.equal(merged.habitEntries[0].value, 0);
});

test("a newer archive is not revived by an older active copy", () => {
  const api = createSyncApi();
  const merged = api.mergeSyncedStates(
    baseState({ habits: [habit()] }),
    baseState({ habits: [habit({ archivedAt: NOW + 5, updatedAt: NOW + 5 })] })
  );
  assert.equal(merged.habits[0].archivedAt, NOW + 5);
});

test("a newer zero-value cancellation is not revived by an old completed entry", () => {
  const api = createSyncApi();
  const merged = api.mergeSyncedStates(
    baseState({ habitEntries: [entry({ value: 1 })] }),
    baseState({ habitEntries: [entry({ value: 0, updatedAt: NOW + 1 })] })
  );
  assert.equal(merged.habitEntries.length, 1);
  assert.equal(merged.habitEntries[0].value, 0);
});

test("cloudSafeState preserves normalized habits and unique entries", () => {
  const api = createSyncApi(baseState({ habits: [habit()], habitEntries: [entry(), entry({ value: 2, updatedAt: NOW + 1 })] }));
  const snapshot = api.cloudSafeState();
  assert.equal(snapshot.habits.length, 1);
  assert.equal(snapshot.habitEntries.length, 1);
  assert.equal(snapshot.habitEntries[0].value, 2);
});

test("habit sync does not modify task, activity, focus, flame or plan data", () => {
  const protectedFields = {
    tasks: [{ id: "task" }],
    activitySessions: [{
      id: "activity", type: "task", taskId: "task", title: "任务", color: "sage",
      status: "completed", startAt: NOW, endAt: NOW + 60000, minutes: 1,
      endReason: "manual", note: "", focusSessionId: null, createdAt: NOW, updatedAt: NOW + 60000,
    }],
    focusSessions: [{ id: "focus", minutes: 25 }],
    focusByDate: { "2027-01-15": 25 }, flames: 8,
    dailyPlans: { "2027-01-15": { adopted_at: 5 } },
  };
  const merged = createSyncApi().mergeSyncedStates(baseState({ ...protectedFields, habits: [habit()] }), baseState());
  Object.entries(protectedFields).forEach(([key, value]) => assert.deepEqual(plain(merged[key]), value));
});

test("habit state survives local JSON and full backup round trips", () => {
  const state = baseState({ habits: [habit()], habitEntries: [entry()] });
  const persisted = JSON.parse(JSON.stringify(state));
  assert.deepEqual(persisted.habits, state.habits);
  assert.deepEqual(persisted.habitEntries, state.habitEntries);
  const backup = JSON.parse(JSON.stringify({ app: "zijian", version: 1, state }));
  assert.deepEqual(backup.state.habits, state.habits);
  assert.match(source, /const backup = \{[\s\S]*?state,[\s\S]*?\};/);
  assert.match(source, /state = restoreTimerState\(\{ \.\.\.defaultState, \.\.\.nextState \}\);[\s\S]*?normalizeState\(\);/);
});

test("whole-state habit merges are stable and leave device inputs unchanged", () => {
  const local = baseState({ habits: [habit({ id: "a" })], habitEntries: [entry()] });
  const remote = baseState({ habits: [habit({ id: "b", updatedAt: NOW + 1 })] });
  const beforeLocal = structuredClone(local);
  const beforeRemote = structuredClone(remote);
  const api = createSyncApi();
  assert.equal(JSON.stringify(api.mergeSyncedStates(local, remote)), JSON.stringify(api.mergeSyncedStates(structuredClone(local), structuredClone(remote))));
  assert.deepEqual(local, beforeLocal);
  assert.deepEqual(remote, beforeRemote);
});

test("habits remain a pure module while app owns persistence", () => {
  const moduleSource = fs.readFileSync("habits.js", "utf8");
  assert.doesNotMatch(moduleSource, /document\.|localStorage|saveState\s*\(/);
  assert.match(source, /habitApi\(\)\?\.setHabitEntry/);
  assert.match(source, /persistHabitCollections/);
});
