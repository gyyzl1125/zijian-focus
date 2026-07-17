"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const ActivitySessions = require("../activity-sessions.js");

const START = 1_800_000_000_000;

function task(id = "task-1", overrides = {}) {
  return { id, title: `任务 ${id}`, color: "sage", done: false, ...overrides };
}

function running(id = "activity-1", overrides = {}) {
  return {
    id,
    type: "task",
    taskId: "task-1",
    title: "任务快照",
    color: "sage",
    startAt: START,
    endAt: null,
    minutes: 0,
    status: "running",
    endReason: null,
    note: "",
    focusSessionId: null,
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("non-array and damaged session input normalizes safely", () => {
  assert.deepEqual(ActivitySessions.normalizeActivitySessions(null, START), []);
  assert.deepEqual(ActivitySessions.normalizeActivitySessions({}, START), []);
  assert.deepEqual(ActivitySessions.normalizeActivitySessions([
    null,
    { id: "", taskId: "task", startAt: START },
    { id: "bad-time", taskId: "task", startAt: "nope" },
    { id: "bad-type", taskId: "task", type: "habit", startAt: START },
  ], START), []);
});

test("starting a task creates one running snapshot without changing the task", () => {
  const sourceTask = task("task-a", { title: "写报告", color: "sky" });
  const before = structuredClone(sourceTask);
  const result = ActivitySessions.startTaskActivity({
    sessions: [],
    activeActivitySessionId: null,
    task: sourceTask,
    now: START,
    idFactory: () => "activity-a",
  });
  assert.equal(result.ok, true);
  assert.equal(result.activeActivitySessionId, "activity-a");
  assert.deepEqual(result.session, {
    id: "activity-a", type: "task", taskId: "task-a", title: "写报告", color: "sky",
    startAt: START, endAt: null, minutes: 0, status: "running", endReason: null,
    note: "", focusSessionId: null, createdAt: START, updatedAt: START,
  });
  assert.deepEqual(sourceTask, before);
  assert.equal(sourceTask.done, false);
});

test("a second start is rejected while one session is running", () => {
  const sessions = [running()];
  const result = ActivitySessions.startTaskActivity({
    sessions,
    activeActivitySessionId: "activity-1",
    task: task("task-2"),
    now: START + 60_000,
    idFactory: () => "activity-2",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "ALREADY_RUNNING");
  assert.equal(result.sessions.filter((item) => item.status === "running").length, 1);
});

test("completion uses deterministic nearest-minute rounding with a one-minute minimum", () => {
  const oneMinute = ActivitySessions.completeActivitySession({
    sessions: [running()], activeActivitySessionId: "activity-1", now: START + 29_000,
  });
  assert.equal(oneMinute.session.minutes, 1);
  assert.equal(oneMinute.shortSession, true);
  assert.equal(oneMinute.session.endReason, "manual");
  assert.equal(oneMinute.activeActivitySessionId, null);

  const rounded = ActivitySessions.completeActivitySession({
    sessions: [running()], activeActivitySessionId: "activity-1", now: START + 90_000,
  });
  assert.equal(rounded.session.minutes, 2);
  assert.equal(rounded.shortSession, false);
});

test("completion rejects an end before start and leaves the session running", () => {
  const result = ActivitySessions.completeActivitySession({
    sessions: [running()], activeActivitySessionId: "activity-1", now: START - 1,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "INVALID_END_TIME");
  assert.equal(result.sessions[0].status, "running");
});

test("cancelled sessions keep an optional end time but contribute zero minutes", () => {
  const result = ActivitySessions.cancelActivitySession({
    sessions: [running()], activeActivitySessionId: "activity-1", now: START + 30_000,
  });
  assert.equal(result.ok, true);
  assert.equal(result.session.status, "cancelled");
  assert.equal(result.session.endReason, "cancelled");
  assert.equal(result.session.minutes, 0);
  assert.equal(result.session.endAt, START + 30_000);
});

test("switching completes the current session and starts the next at the same timestamp", () => {
  const result = ActivitySessions.switchTaskActivity({
    sessions: [running()],
    activeActivitySessionId: "activity-1",
    task: task("task-2", { title: "新任务" }),
    now: START + 5 * 60_000,
    idFactory: () => "activity-2",
  });
  assert.equal(result.ok, true);
  assert.equal(result.switched, true);
  assert.equal(result.previousSession.status, "completed");
  assert.equal(result.previousSession.endReason, "switched");
  assert.equal(result.previousSession.endAt, START + 5 * 60_000);
  assert.equal(result.session.startAt, START + 5 * 60_000);
  assert.equal(result.session.status, "running");
  assert.equal(result.sessions.filter((item) => item.status === "running").length, 1);
});

test("a running session survives reload normalization and repairs a missing active id", () => {
  const sessions = ActivitySessions.normalizeActivitySessions([running()], START + 10_000);
  assert.equal(sessions[0].status, "running");
  assert.equal(ActivitySessions.repairActiveActivitySessionId(sessions, null), "activity-1");
  assert.equal(ActivitySessions.getRunningActivitySession(sessions, "missing").id, "activity-1");
});

test("an active id pointing to a completed session repairs to the actual running session", () => {
  const completed = {
    ...running("completed"), status: "completed", endAt: START + 60_000,
    minutes: 1, endReason: "manual", updatedAt: START + 60_000,
  };
  const sessions = ActivitySessions.normalizeActivitySessions([completed, running("live", { updatedAt: START + 2 })], START + 2);
  assert.equal(ActivitySessions.repairActiveActivitySessionId(sessions, "completed"), "live");
});

test("multiple running sessions keep the newest updated record and recover the rest as cancelled", () => {
  const sessions = ActivitySessions.normalizeActivitySessions([
    running("older", { updatedAt: START + 10 }),
    running("newer", { taskId: "task-2", updatedAt: START + 20 }),
  ], START + 30);
  assert.equal(sessions.find((item) => item.id === "newer").status, "running");
  const recovered = sessions.find((item) => item.id === "older");
  assert.equal(recovered.status, "cancelled");
  assert.equal(recovered.endReason, "recovered");
  assert.equal(recovered.endAt, null);
  assert.equal(recovered.minutes, 0);
});

test("a backward stored end time is recovered without inventing completed minutes", () => {
  const normalized = ActivitySessions.normalizeActivitySession({
    ...running(), status: "completed", endAt: START - 1, endReason: "manual",
  }, START);
  assert.equal(normalized.status, "cancelled");
  assert.equal(normalized.endReason, "recovered");
  assert.equal(normalized.endAt, null);
  assert.equal(normalized.minutes, 0);
});

test("duplicate ids keep the newer updatedAt version", () => {
  const sessions = ActivitySessions.normalizeActivitySessions([
    running("same", { title: "旧", updatedAt: START }),
    running("same", { title: "新", updatedAt: START + 1 }),
  ], START + 1);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].title, "新");
});

test("equal updatedAt terminal state wins over running during merge", () => {
  const live = running("same", { updatedAt: START + 60_000 });
  const completed = {
    ...live, status: "completed", endAt: START + 60_000,
    minutes: 1, endReason: "manual",
  };
  const merged = ActivitySessions.mergeActivitySessions([live], [completed]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, "completed");
});

test("merge order and serialization are deterministic", () => {
  const local = [running("b", { taskId: "b", startAt: START + 10, createdAt: START + 10, updatedAt: START + 20 })];
  const remote = [running("a", { taskId: "a", startAt: START, updatedAt: START + 30 })];
  const first = ActivitySessions.mergeActivitySessions(local, remote);
  const second = ActivitySessions.mergeActivitySessions(structuredClone(local), structuredClone(remote));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.map((item) => item.id), ["a", "b"]);
  assert.equal(first.filter((item) => item.status === "running").length, 1);
});

test("normalization and every operation leave their inputs unchanged", () => {
  const sessions = [running()];
  const sourceTask = task("task-2");
  const beforeSessions = structuredClone(sessions);
  const beforeTask = structuredClone(sourceTask);
  ActivitySessions.normalizeActivitySessions(sessions, START);
  ActivitySessions.completeActivitySession({ sessions, activeActivitySessionId: "activity-1", now: START + 60_000 });
  ActivitySessions.cancelActivitySession({ sessions, activeActivitySessionId: "activity-1", now: START + 60_000 });
  ActivitySessions.switchTaskActivity({ sessions, activeActivitySessionId: "activity-1", task: sourceTask, now: START + 60_000, idFactory: () => "new" });
  assert.deepEqual(sessions, beforeSessions);
  assert.deepEqual(sourceTask, beforeTask);
});

test("task deletion is irrelevant to stored title snapshots", () => {
  const session = ActivitySessions.normalizeActivitySession(running("history", {
    taskId: "deleted-task", title: "已删除任务的历史标题",
  }), START);
  assert.equal(session.taskId, "deleted-task");
  assert.equal(session.title, "已删除任务的历史标题");
});

test("the pure module has no UI, persistence, or global state side effects", () => {
  const source = require("node:fs").readFileSync(require.resolve("../activity-sessions.js"), "utf8");
  assert.doesNotMatch(source, /\bdocument\b|localStorage|saveState\s*\(/);
  const envelope = {
    tasks: [task()], focusSessions: [{ id: "focus" }], focusByDate: { day: 1 },
    flames: 3, dailyPlans: { day: { marker: true } },
  };
  const before = plain(envelope);
  ActivitySessions.startTaskActivity({
    sessions: [], activeActivitySessionId: null, task: envelope.tasks[0], now: START, idFactory: () => "activity",
  });
  assert.deepEqual(envelope, before);
});
