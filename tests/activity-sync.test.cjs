"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const ActivitySessions = require("../activity-sessions.js");
const source = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const START = 1_800_000_000_000;

function running(id = "activity-1", overrides = {}) {
  return {
    id, type: "task", taskId: "task-1", title: "任务快照", color: "sage",
    startAt: START, endAt: null, minutes: 0, status: "running", endReason: null,
    note: "", focusSessionId: null, createdAt: START, updatedAt: START, ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    syncUpdatedAt: 0,
    tasks: [], courses: [], memos: [], memoTags: [],
    focusSessions: [], focusByDate: {}, flames: 0, flameLedger: [],
    transactions: [], dailyPlans: {}, quotes: [],
    ownedSkins: [], ownedFlowers: [], ownedThemes: [],
    deletions: { version: 1, tasks: {}, memos: {} },
    activitySessions: [], activeActivitySessionId: null,
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
  assert.ok(deletionStart >= 0 && deletionEnd > deletionStart);
  assert.ok(mergeStart >= 0 && mergeEnd > mergeStart);
  const context = {
    Number, String, Object, Array, Map, Set, Date,
    structuredClone, state, ActivitySessions,
  };
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
    ActivitySessions,
    state,
    DEFAULT_MEMO_TAGS: ["全部"],
    SKINS: [{ id: "classic" }],
    FLOWER_SKINS: [{ id: "coral" }],
    THEMES: [{ id: "paper" }],
    isSavingTransfer: () => false,
    guessFinanceCategory: () => "其他",
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(deletionStart, normalizeEnd)}; normalizeState();`, context);
  return context.state;
}

test("default state and browser load order include activity session support", () => {
  assert.match(source, /activitySessions:\s*\[\]/);
  assert.match(source, /activeActivitySessionId:\s*null/);
  const activityIndex = indexSource.indexOf("activity-sessions.js?v=57");
  const appIndex = indexSource.indexOf("app.js?v=57");
  assert.ok(activityIndex >= 0 && appIndex > activityIndex);
});

test("old local state normalizes to empty activity fields", () => {
  const state = baseState();
  delete state.activitySessions;
  delete state.activeActivitySessionId;
  state.financeRulesVersion = 4;
  const normalized = normalizeStateInHarness(state);
  assert.deepEqual(plain(normalized.activitySessions), []);
  assert.equal(normalized.activeActivitySessionId, null);
  assert.equal(normalized.profileName, "自见用户");
});

test("profile name follows whole-state recency and remains cloud safe", () => {
  const api = createSyncApi(baseState({ profileName: "本地名字" }));
  const merged = api.mergeSyncedStates(
    baseState({ profileName: "旧名字", syncUpdatedAt: 10 }),
    baseState({ profileName: "新名字", syncUpdatedAt: 20 })
  );
  assert.equal(merged.profileName, "新名字");
  assert.equal(api.cloudSafeState().profileName, "本地名字");
});

test("reload normalization preserves one running session and repairs its active id", () => {
  const state = baseState({
    activitySessions: [running()], activeActivitySessionId: "missing", financeRulesVersion: 4,
  });
  const normalized = normalizeStateInHarness(state);
  assert.equal(normalized.activitySessions[0].status, "running");
  assert.equal(normalized.activeActivitySessionId, "activity-1");
});

test("whole-state sync merges activity records by updatedAt and repairs active id", () => {
  const api = createSyncApi();
  const local = baseState({
    syncUpdatedAt: 100,
    activitySessions: [running("same", { title: "旧", updatedAt: START })],
    activeActivitySessionId: "same",
  });
  const remote = baseState({
    syncUpdatedAt: 50,
    activitySessions: [running("same", {
      title: "结束版", status: "completed", endAt: START + 60_000,
      minutes: 1, endReason: "manual", updatedAt: START + 60_000,
    })],
    activeActivitySessionId: "same",
  });
  const merged = api.mergeSyncedStates(local, remote);
  assert.equal(merged.activitySessions.length, 1);
  assert.equal(merged.activitySessions[0].status, "completed");
  assert.equal(merged.activeActivitySessionId, null);
});

test("equal revisions never let running overwrite a terminal activity", () => {
  const api = createSyncApi();
  const live = running("same", { updatedAt: START + 60_000 });
  const done = { ...live, status: "completed", endAt: START + 60_000, minutes: 1, endReason: "manual" };
  const merged = api.mergeSyncedStates(
    baseState({ activitySessions: [live], activeActivitySessionId: "same" }),
    baseState({ activitySessions: [done], activeActivitySessionId: null })
  );
  assert.equal(merged.activitySessions[0].status, "completed");
  assert.equal(merged.activeActivitySessionId, null);
});

test("a linked completed activity keeps its focus session when merged with stale running state", () => {
  const api = createSyncApi();
  const live = running("linked", { updatedAt: START });
  const done = {
    ...live,
    status: "completed",
    endAt: START + 25 * 60_000,
    minutes: 25,
    endReason: "manual",
    focusSessionId: "focus-linked",
    updatedAt: START + 25 * 60_000,
  };
  const merged = api.mergeSyncedStates(
    baseState({ activitySessions: [live], activeActivitySessionId: "linked" }),
    baseState({ activitySessions: [done], activeActivitySessionId: null })
  );
  assert.equal(merged.activitySessions[0].status, "completed");
  assert.equal(merged.activitySessions[0].focusSessionId, "focus-linked");
  assert.equal(merged.activeActivitySessionId, null);
});

test("cloudSafeState retains normalized activities and the repaired active id", () => {
  const state = baseState({
    activitySessions: [running()], activeActivitySessionId: "missing",
    heatmapImage: "large", isRunning: true, startedAt: 1, endsAt: 2,
  });
  const api = createSyncApi(state);
  const snapshot = api.cloudSafeState();
  assert.equal(snapshot.activitySessions.length, 1);
  assert.equal(snapshot.activitySessions[0].status, "running");
  assert.equal(snapshot.activeActivitySessionId, "activity-1");
  assert.equal(snapshot.isRunning, false, "focus timer cloud behavior remains unchanged");
});

test("syncing activities does not modify plans, focus history, statistics, flames, or tasks", () => {
  const api = createSyncApi();
  const protectedFields = {
    tasks: [{ id: "task-1", title: "任务", done: false }],
    focusSessions: [{ id: "focus-1", minutes: 25 }],
    focusByDate: { "2027-01-15": 25 },
    flames: 8,
    dailyPlans: { "2027-01-15": { adopted_at: 10, marker: "keep" } },
  };
  const local = baseState({ ...protectedFields, activitySessions: [running()] });
  const remote = baseState();
  const merged = api.mergeSyncedStates(local, remote);
  Object.entries(protectedFields).forEach(([key, value]) => assert.deepEqual(plain(merged[key]), value));
});

test("task deletion tombstones do not remove historical or running activities", () => {
  const api = createSyncApi();
  const local = baseState({
    activitySessions: [running("history", { taskId: "deleted", title: "删除前标题" })],
    activeActivitySessionId: "history",
    deletions: { version: 1, tasks: { deleted: { deletedAt: START + 1 } }, memos: {} },
  });
  const merged = api.mergeSyncedStates(local, baseState());
  assert.equal(merged.activitySessions.length, 1);
  assert.equal(merged.activitySessions[0].taskId, "deleted");
  assert.equal(merged.activitySessions[0].title, "删除前标题");
});

test("activity state survives JSON persistence and full-backup round trips", () => {
  const state = baseState({ activitySessions: [running()], activeActivitySessionId: "activity-1" });
  const persisted = JSON.parse(JSON.stringify(state));
  assert.deepEqual(persisted.activitySessions, state.activitySessions);
  assert.equal(persisted.activeActivitySessionId, "activity-1");
  const backup = JSON.parse(JSON.stringify({ app: "zijian", version: 1, state }));
  assert.deepEqual(backup.state.activitySessions, state.activitySessions);
  assert.match(source, /const backup = \{[\s\S]*?state,[\s\S]*?\};/);
  assert.match(source, /state = restoreTimerState\(\{ \.\.\.defaultState, \.\.\.nextState \}\);[\s\S]*?normalizeState\(\);/);
});

test("whole-state merge is stable and does not mutate either device state", () => {
  const api = createSyncApi();
  const local = baseState({ activitySessions: [running("local", { updatedAt: START + 1 })], activeActivitySessionId: "local" });
  const remote = baseState({ activitySessions: [running("remote", { taskId: "task-2", updatedAt: START + 2 })], activeActivitySessionId: "remote" });
  const beforeLocal = structuredClone(local);
  const beforeRemote = structuredClone(remote);
  const first = api.mergeSyncedStates(local, remote);
  const second = api.mergeSyncedStates(structuredClone(local), structuredClone(remote));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(local, beforeLocal);
  assert.deepEqual(remote, beforeRemote);
  assert.equal(first.activitySessions.filter((item) => item.status === "running").length, 1);
});

test("the activity data module remains independent from the timeline UI", () => {
  const moduleSource = fs.readFileSync("activity-sessions.js", "utf8");
  assert.doesNotMatch(moduleSource, /\bdocument\b|localStorage|saveState\s*\(/);
  assert.match(source, /ActivitySessions\.startTaskActivity|activityApi\.startTaskActivity/);
  assert.match(source, /ActivitySessions\.completeActivitySession|activityApi\.completeActivitySession/);
});
