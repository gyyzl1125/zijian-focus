"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const ActivitySessions = require("../activity-sessions.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const sectionStart = appSource.indexOf("function getActivitySessionsForTimelineDay");
const sectionEnd = appSource.indexOf("function layoutOverlappingEvents", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "activity timeline helpers should exist");
const timelineSource = appSource.slice(sectionStart, sectionEnd);

const MONDAY = "2026-07-20";
const TUESDAY = "2026-07-21";

function at(dayKey, hour, minute = 0) {
  const value = new Date(`${dayKey}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value.getTime();
}

function task(id, title, overrides = {}) {
  return {
    id, title, color: "sage", done: false,
    startAt: at(MONDAY, 8), endAt: at(MONDAY, 18),
    ...overrides,
  };
}

function session(id, taskId, title, startAt, endAt, overrides = {}) {
  return {
    id, type: "task", taskId, title, color: "sage", startAt, endAt,
    minutes: endAt === null ? 0 : Math.max(1, Math.round((endAt - startAt) / 60000)),
    status: endAt === null ? "running" : "completed",
    endReason: endAt === null ? null : "manual",
    note: "", focusSessionId: null, createdAt: startAt,
    updatedAt: endAt === null ? startAt : endAt,
    ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    tasks: [], courses: [], activitySessions: [], activeActivitySessionId: null,
    focusSessions: [], focusByDate: {}, flames: 0, dailyPlans: {}, syncUpdatedAt: 10,
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function selectTask(harness, taskId) {
  harness.els.timelineTaskSelect.querySelectorAll("option").forEach((option) => option.removeAttribute("selected"));
  harness.els.timelineTaskSelect.querySelector(`option[value="${taskId}"]`).setAttribute("selected", "");
}

function createHarness({ state = baseState(), selectedDay = MONDAY, confirmations = [], ids = ["activity-new"] } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  const toasts = [];
  const confirmationCalls = [];
  const idQueue = ids.slice();
  const context = {
    document,
    state,
    selectedTimelineDate: selectedDay,
    Number, String, Object, Array, Set, Map, Math, Date, Error,
    structuredClone,
    ActivitySessions,
    crypto: { randomUUID: () => idQueue.shift() || `activity-${idQueue.length}` },
    console: { error() {} },
    confirm(message) {
      confirmationCalls.push(String(message));
      return confirmations.length ? confirmations.shift() : true;
    },
    els: {
      weekStrip: document.querySelector("#weekStrip"),
      timelineDateTitle: document.querySelector("#timelineDateTitle"),
      timelineStats: document.querySelector("#timelineStats"),
      timelineList: document.querySelector("#timelineList"),
      timelineTaskSelect: document.querySelector("#timelineTaskSelect"),
      timelineStartButton: document.querySelector("#timelineStartButton"),
      timelineTaskEmpty: document.querySelector("#timelineTaskEmpty"),
      timelineRunningCard: document.querySelector("#timelineRunningCard"),
      timelineRunningTitle: document.querySelector("#timelineRunningTitle"),
      timelineRunningStarted: document.querySelector("#timelineRunningStarted"),
      timelineRunningElapsed: document.querySelector("#timelineRunningElapsed"),
      timelineEndButton: document.querySelector("#timelineEndButton"),
      timelineActivityStatus: document.querySelector("#timelineActivityStatus"),
    },
    saveState() { saveCalls += 1; state.syncUpdatedAt += 1; },
    showReminderToast(title, body) { toasts.push({ title, body }); },
    dateKey(value = new Date()) {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    getWeekStart(value) {
      const start = new Date(value);
      const weekday = start.getDay() || 7;
      start.setDate(start.getDate() - weekday + 1);
      start.setHours(0, 0, 0, 0);
      return start;
    },
    getTaskColor() { return { bg: "#eee", border: "#aaa", ink: "#111" }; },
    formatClock(timestamp) {
      const value = new Date(timestamp);
      return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${timelineSource}; this.api = {
    getForDay: getActivitySessionsForTimelineDay,
    render: renderTimeline,
    renderRunning: renderRunningActivity,
    start: startSelectedTaskActivity,
    end: endCurrentTaskActivity,
    get selectedDay() { return selectedTimelineDate; }
  };`, context);
  return {
    context, state, document, els: context.els, api: context.api,
    toasts, confirmationCalls,
    get saveCalls() { return saveCalls; },
  };
}

test("timeline has a highlighted weekly date strip and a task start control", () => {
  const harness = createHarness({ state: baseState({ tasks: [task("task-1", "写报告")] }) });
  harness.api.render(at(MONDAY, 9));
  assert.equal(harness.document.querySelectorAll("#weekStrip .week-day").length, 7);
  assert.equal(harness.document.querySelector("#weekStrip .is-selected strong").textContent, "20");
  assert.equal(harness.els.timelineTaskSelect.options.length, 2);
  assert.equal(harness.els.timelineStartButton.disabled, true);
  assert.match(indexSource, /timelineTaskSelect/);
});

test("only unfinished tasks are selectable and HTML-like titles stay plain text", () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const harness = createHarness({ state: baseState({ tasks: [
    task("open", unsafe), task("done", "已完成", { done: true }),
  ] }) });
  harness.api.render(at(MONDAY, 9));
  assert.equal(harness.els.timelineTaskSelect.options.length, 2);
  assert.equal(harness.els.timelineTaskSelect.options[1].textContent, unsafe);
  assert.equal(harness.els.timelineTaskSelect.querySelector("img"), null);
  assert.doesNotMatch(harness.els.timelineTaskSelect.textContent, /已完成/);
});

test("starting records one running session, saves once, and leaves task and statistics unchanged", () => {
  const state = baseState({
    tasks: [task("task-1", "写报告")], focusSessions: [{ id: "focus" }],
    focusByDate: { [MONDAY]: 25 }, flames: 7, dailyPlans: { [MONDAY]: { marker: true } },
  });
  const protectedBefore = plain({
    tasks: state.tasks, focusSessions: state.focusSessions, focusByDate: state.focusByDate,
    flames: state.flames, dailyPlans: state.dailyPlans,
  });
  const harness = createHarness({ state });
  harness.api.render(at(MONDAY, 9));
  selectTask(harness, "task-1");
  assert.equal(harness.api.start(at(MONDAY, 9)), true);
  assert.equal(harness.saveCalls, 1);
  assert.equal(state.activitySessions[0].status, "running");
  assert.equal(state.activeActivitySessionId, "activity-new");
  assert.equal(state.tasks[0].done, false);
  assert.deepEqual(plain({
    tasks: state.tasks, focusSessions: state.focusSessions, focusByDate: state.focusByDate,
    flames: state.flames, dailyPlans: state.dailyPlans,
  }), protectedBefore);
});

test("running state restores on render and elapsed time updates without saving", () => {
  const active = session("running", "task-1", "恢复中的任务", at(MONDAY, 9), null);
  const harness = createHarness({ state: baseState({ activitySessions: [active], activeActivitySessionId: "running" }) });
  harness.api.render(at(MONDAY, 9, 5));
  assert.equal(harness.els.timelineRunningCard.hidden, false);
  assert.equal(harness.els.timelineRunningTitle.textContent, "恢复中的任务");
  assert.match(harness.els.timelineRunningElapsed.textContent, /5分钟/);
  harness.api.renderRunning(at(MONDAY, 9, 6));
  assert.match(harness.els.timelineRunningElapsed.textContent, /6分钟/);
  assert.equal(harness.saveCalls, 0);
});

test("ending creates a completed actual record but never completes the task", () => {
  const active = session("running", "task-1", "写报告", at(MONDAY, 9), null);
  const state = baseState({ tasks: [task("task-1", "写报告")], activitySessions: [active], activeActivitySessionId: "running" });
  const harness = createHarness({ state });
  assert.equal(harness.api.end(at(MONDAY, 9, 25)), true);
  assert.equal(harness.saveCalls, 1);
  assert.equal(state.activeActivitySessionId, null);
  assert.equal(state.activitySessions[0].status, "completed");
  assert.equal(state.activitySessions[0].minutes, 25);
  assert.equal(state.tasks[0].done, false);
  assert.match(harness.els.timelineList.textContent, /09:00~09:25/);
  assert.match(harness.els.timelineList.textContent, /写报告/);
});

test("a short completion asks whether to keep it and cancelled short records stay off the timeline", () => {
  const active = session("short", "task-1", "误触任务", at(MONDAY, 9), null);
  const state = baseState({ activitySessions: [active], activeActivitySessionId: "short" });
  const harness = createHarness({ state, confirmations: [false] });
  assert.equal(harness.api.end(at(MONDAY, 9, 0) + 30_000), true);
  assert.equal(harness.confirmationCalls.length, 1);
  assert.match(harness.confirmationCalls[0], /不足 1 分钟/);
  assert.equal(state.activitySessions[0].status, "cancelled");
  assert.equal(state.activitySessions[0].minutes, 0);
  assert.equal(harness.saveCalls, 1);
  assert.match(harness.els.timelineList.textContent, /还没有实际活动记录/);
});

test("keeping a short completion stores it as a one-minute actual record", () => {
  const active = session("short", "task-1", "短任务", at(MONDAY, 9), null);
  const state = baseState({ activitySessions: [active], activeActivitySessionId: "short" });
  const harness = createHarness({ state, confirmations: [true] });
  harness.api.end(at(MONDAY, 9, 0) + 30_000);
  assert.equal(state.activitySessions[0].status, "completed");
  assert.equal(state.activitySessions[0].minutes, 1);
  assert.match(harness.els.timelineList.textContent, /短任务/);
});

test("switching requires confirmation, ends the old activity, starts the new one, and saves once", () => {
  const active = session("old", "task-1", "旧任务", at(MONDAY, 9), null);
  const state = baseState({
    tasks: [task("task-1", "旧任务"), task("task-2", "新任务")],
    activitySessions: [active], activeActivitySessionId: "old",
  });
  const cancelledHarness = createHarness({ state: structuredClone(state), confirmations: [false], ids: ["new"] });
  cancelledHarness.api.render(at(MONDAY, 9, 10));
  selectTask(cancelledHarness, "task-2");
  assert.equal(cancelledHarness.api.start(at(MONDAY, 9, 10)), false);
  assert.equal(cancelledHarness.saveCalls, 0);

  const harness = createHarness({ state, confirmations: [true], ids: ["new"] });
  harness.api.render(at(MONDAY, 9, 10));
  selectTask(harness, "task-2");
  assert.equal(harness.api.start(at(MONDAY, 9, 10)), true);
  assert.equal(harness.saveCalls, 1);
  assert.equal(state.activitySessions.find((item) => item.id === "old").endReason, "switched");
  assert.equal(state.activitySessions.find((item) => item.id === "new").status, "running");
  assert.equal(state.activeActivitySessionId, "new");
});

test("date selection filters actual sessions without writing persistent state", () => {
  const state = baseState({ activitySessions: [
    session("mon", "task-1", "周一记录", at(MONDAY, 9), at(MONDAY, 10)),
    session("tue", "task-2", "周二记录", at(TUESDAY, 11), at(TUESDAY, 12)),
  ] });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.render(at(MONDAY, 13));
  assert.match(harness.els.timelineList.textContent, /周一记录/);
  const tuesdayButton = [...harness.els.weekStrip.querySelectorAll("button")].find((button) => button.querySelector("strong").textContent === "21");
  tuesdayButton.click();
  assert.match(harness.els.timelineList.textContent, /周二记录/);
  assert.doesNotMatch(harness.els.timelineList.textContent, /周一记录/);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state, before);
});

test("deleted tasks retain their historical title snapshot", () => {
  const state = baseState({ activitySessions: [
    session("history", "deleted-task", "删除前的标题", at(MONDAY, 9), at(MONDAY, 10)),
  ] });
  const harness = createHarness({ state });
  harness.api.render(at(MONDAY, 12));
  assert.match(harness.els.timelineList.textContent, /删除前的标题/);
  assert.match(harness.els.timelineList.textContent, /原任务已删除/);
});

test("tasks, courses, focus sessions and plans never appear as actual records", () => {
  const state = baseState({
    tasks: [task("task", "计划任务")],
    courses: [{ id: "course", title: "课程", startAt: at(MONDAY, 9), endAt: at(MONDAY, 10) }],
    focusSessions: [{ id: "focus", title: "专注", startAt: at(MONDAY, 10), endAt: at(MONDAY, 11), minutes: 60 }],
    dailyPlans: { [MONDAY]: { adopted_at: at(MONDAY, 7), blocks: [{ id: "plan", title: "计划专注" }] } },
  });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.render(at(MONDAY, 12));
  assert.match(harness.els.timelineList.textContent, /还没有实际活动记录/);
  assert.doesNotMatch(harness.els.timelineList.textContent, /计划任务|课程|专注/);
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
});

test("mobile activity controls avoid horizontal overflow", () => {
  assert.match(stylesSource, /\.timeline-start-row \{[\s\S]*?grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.match(stylesSource, /@media[\s\S]*?\.timeline-start-row \{[\s\S]*?grid-template-columns: 1fr auto;/);
  assert.match(stylesSource, /\.timeline-running-card \{[\s\S]*?min-width: 0;/);
});
