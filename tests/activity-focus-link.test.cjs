"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ActivitySessions = require("../activity-sessions.js");
const Habits = require("../habits.js");

const source = fs.readFileSync("app.js", "utf8");
const restoreStart = source.indexOf("function completeActivityForFocusState");
const restoreEnd = source.indexOf("function migrateTasks", restoreStart);
const timerStart = source.indexOf("function getCurrentFocusActivity");
const timerEnd = source.indexOf("function addTask", timerStart);
const contextStart = source.indexOf("function renderFocusContext");
const contextEnd = source.indexOf("function renderTasks", contextStart);
assert.ok(restoreStart >= 0 && restoreEnd > restoreStart);
assert.ok(timerStart >= 0 && timerEnd > timerStart);
assert.ok(contextStart >= 0 && contextEnd > contextStart);

const DAY = "2026-07-20";
function at(hour, minute = 0) {
  const date = new Date(`${DAY}T00:00:00`);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function runningTask(overrides = {}) {
  return {
    id: "activity-1", type: "task", taskId: "task-1", title: "写报告", color: "sage",
    startAt: at(9), endAt: null, minutes: 0, status: "running", endReason: null,
    note: "", focusSessionId: null, createdAt: at(9), updatedAt: at(9), ...overrides,
  };
}

function durationHabit() {
  return {
    id: "read", title: "阅读", color: "sage", metricType: "duration", targetValue: 60,
    unit: "分钟", daysOfWeek: [1], includeInPlanner: true,
    createdAt: at(0), updatedAt: at(0), archivedAt: null,
  };
}

function baseState(overrides = {}) {
  return {
    selectedMinutes: 25, timerSecondsLeft: 25 * 60, timerTotalSeconds: 25 * 60,
    isRunning: true, startedAt: at(9), endsAt: at(9, 25),
    tasks: [{ id: "task-1", title: "写报告", done: false }],
    activitySessions: [runningTask()], activeActivitySessionId: "activity-1",
    habits: [], habitEntries: [], focusSessions: [], focusByDate: {}, flames: 0, flameLedger: [],
    ...overrides,
  };
}

function createHarness(initialState = baseState(), ids = ["focus-1", "free-activity"]) {
  const state = initialState;
  const toasts = [];
  let saveCalls = 0;
  let completionSheets = 0;
  const idQueue = ids.slice();
  const els = {
    timerNote: { textContent: "" },
    focusContext: { hidden: true },
    focusContextTitle: { textContent: "" },
    focusContextProgress: { textContent: "" },
    finishFocusButton: { hidden: true },
  };
  const context = {
    state, els, ActivitySessions, Habits,
    globalThis: null, Number, String, Object, Array, Math, Date, Error,
    MINUTE: 60, MAX_MINUTES: 180, FAST_FINISH_COST: 5,
    tickHandle: null,
    crypto: { randomUUID: () => idQueue.shift() || `id-${idQueue.length}` },
    window: { setInterval: () => 1, clearInterval() {} },
    dateKey(value = new Date(`${DAY}T12:00:00`)) {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    getFlameReward: () => 2,
    addFlameLedger(type, amount, reason, when) {
      state.flames += amount;
      state.flameLedger.push({ type, amount, reason, at: when });
    },
    saveState() { saveCalls += 1; },
    render() {},
    renderTimer() {},
    showCompletionSheet() { completionSheets += 1; },
    showReminderToast(title, body) { toasts.push({ title, body }); },
    console: { error() {} },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    ${source.slice(restoreStart, restoreEnd)}
    ${source.slice(timerStart, timerEnd)}
    ${source.slice(contextStart, contextEnd)}
    this.api = { startTimer, completeFocusSession, finishFocusEarly, restoreTimerState, renderFocusContext };
  `, context);
  return {
    state, els, toasts, api: context.api,
    get saveCalls() { return saveCalls; },
    get completionSheets() { return completionSheets; },
  };
}

test("focus completion links one focus session to one task activity without completing the task", () => {
  const harness = createHarness();
  assert.equal(harness.api.completeFocusSession({ finishedAt: at(9, 25) }), true);
  assert.equal(harness.state.activitySessions[0].status, "completed");
  assert.equal(harness.state.activitySessions[0].focusSessionId, "focus-1");
  assert.equal(harness.state.focusSessions.length, 1);
  assert.equal(harness.state.focusSessions[0].activitySessionId, "activity-1");
  assert.equal(harness.state.focusSessions[0].minutes, 25);
  assert.equal(harness.state.focusByDate[DAY], 25);
  assert.equal(harness.state.tasks[0].done, false);
  assert.equal(harness.state.flames, 2);
  assert.equal(harness.saveCalls, 1);
  assert.equal(harness.api.completeFocusSession({ finishedAt: at(9, 25) }), false);
  assert.equal(harness.state.focusSessions.length, 1);
  assert.equal(harness.state.flames, 2);
});

test("an early duration-habit finish uses actual minutes, reaches the target, and can restart", () => {
  const habit = durationHabit();
  const running = {
    id: "habit-run", type: "habit", taskId: null, habitId: "read", habitMetricType: "duration",
    habitValue: 0, title: "阅读", color: "sage", startAt: at(9), endAt: null, minutes: 0,
    status: "running", endReason: null, note: "", focusSessionId: null, createdAt: at(9), updatedAt: at(9),
  };
  const harness = createHarness(baseState({
    tasks: [], habits: [habit],
    habitEntries: [{ id: `read::${DAY}`, habitId: "read", dayKey: DAY, value: 35, manualValue: 35, createdAt: at(0), updatedAt: at(8) }],
    activitySessions: [running], activeActivitySessionId: "habit-run",
    selectedMinutes: 60, timerSecondsLeft: 35 * 60, timerTotalSeconds: 60 * 60, endsAt: at(10),
  }));
  assert.equal(harness.api.finishFocusEarly(at(9, 25)), true);
  assert.equal(harness.state.activitySessions[0].minutes, 25);
  assert.equal(harness.state.focusSessions[0].minutes, 25);
  assert.equal(harness.state.habitEntries[0].value, 60);
  assert.equal(harness.toasts.at(-1).title, "习惯达标");
  const restarted = ActivitySessions.startHabitActivity({
    sessions: harness.state.activitySessions,
    activeActivitySessionId: null,
    habit,
    now: at(10),
    idFactory: () => "habit-run-2",
  });
  assert.equal(restarted.ok, true);
});

test("ordinary early finish has distinct encouragement and records actual time once", () => {
  const harness = createHarness(baseState({
    timerTotalSeconds: 60 * 60,
    timerSecondsLeft: 50 * 60,
    endsAt: at(10),
  }));
  assert.equal(harness.api.finishFocusEarly(at(9, 10)), true);
  assert.equal(harness.state.focusSessions[0].minutes, 10);
  assert.equal(harness.toasts.at(-1).title, "已提前结束");
});

test("free focus creates a running activity and later one linked timeline record", () => {
  const harness = createHarness(baseState({
    isRunning: false, startedAt: null, endsAt: null,
    activitySessions: [], activeActivitySessionId: null,
    selectedMinutes: 15, timerSecondsLeft: 15 * 60, timerTotalSeconds: 15 * 60,
  }), ["free-activity", "focus-free"]);
  assert.equal(harness.api.startTimer(at(9)), true);
  assert.equal(harness.state.activitySessions.length, 1);
  assert.equal(harness.state.activitySessions[0].type, "focus");
  assert.equal(harness.state.activitySessions[0].title, "自由专注");
  assert.equal(harness.api.completeFocusSession({ finishedAt: at(9, 15) }), true);
  assert.equal(harness.state.activitySessions.length, 1);
  assert.equal(harness.state.activitySessions[0].focusSessionId, "focus-free");
  assert.equal(harness.state.focusSessions[0].activitySessionId, "free-activity");
});

test("focus context restores the linked name and today's habit target progress", () => {
  const habit = durationHabit();
  const running = {
    id: "habit-run", type: "habit", taskId: null, habitId: "read", habitMetricType: "duration",
    habitValue: 0, title: "阅读", color: "sage", startAt: at(9), endAt: null, minutes: 0,
    status: "running", endReason: null, note: "", focusSessionId: null, createdAt: at(9), updatedAt: at(9),
  };
  const harness = createHarness(baseState({
    habits: [habit], habitEntries: [{ id: `read::${DAY}`, habitId: "read", dayKey: DAY, value: 25, manualValue: 25, createdAt: at(0), updatedAt: at(8) }],
    activitySessions: [running], activeActivitySessionId: "habit-run",
  }));
  harness.api.renderFocusContext();
  assert.equal(harness.els.focusContext.hidden, false);
  assert.equal(harness.els.focusContextTitle.textContent, "阅读");
  assert.match(harness.els.focusContextProgress.textContent, /25\/60/);
});

test("reload preserves a live linked timer and finalizes an expired one exactly once", () => {
  const now = Date.now();
  const live = runningTask({ startAt: now - 5 * 60_000, createdAt: now - 5 * 60_000, updatedAt: now - 5 * 60_000 });
  const harness = createHarness(baseState());
  const restoredLive = harness.api.restoreTimerState(baseState({
    activitySessions: [live], activeActivitySessionId: live.id,
    isRunning: true, startedAt: live.startAt, endsAt: now + 20 * 60_000,
  }));
  assert.equal(restoredLive.isRunning, true);
  assert.equal(restoredLive.activeActivitySessionId, live.id);
  assert.equal(restoredLive.activitySessions[0].status, "running");

  const expiredStart = now - 25 * 60_000;
  const expired = runningTask({ startAt: expiredStart, createdAt: expiredStart, updatedAt: expiredStart });
  const restoredExpired = harness.api.restoreTimerState(baseState({
    activitySessions: [expired], activeActivitySessionId: expired.id,
    isRunning: true, startedAt: expiredStart, endsAt: now - 1000,
    timerTotalSeconds: 25 * 60, timerSecondsLeft: 1,
  }));
  assert.equal(restoredExpired.isRunning, false);
  assert.equal(restoredExpired.activitySessions[0].status, "completed");
  assert.equal(restoredExpired.focusSessions.length, 1);
  assert.equal(restoredExpired.activitySessions[0].focusSessionId, restoredExpired.focusSessions[0].id);
});

test("app initialization restarts the tick loop only for a live restored timer", () => {
  assert.match(source, /if \(state\.isRunning && Number\(state\.endsAt\) > Date\.now\(\)\) \{\s*tickHandle = window\.setInterval\(tick, 1000\);/);
});
