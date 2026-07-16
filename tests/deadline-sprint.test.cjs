"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildDeadlineSprintCandidates,
  getTaskDeadlineAt,
} = require("../daily-planner.js");

function at(day, hour, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0, 0).getTime();
}

function task(overrides = {}) {
  return {
    id: "task-1",
    title: "完成报告",
    done: false,
    startAt: at(20, 7),
    endAt: at(20, 22),
    ...overrides,
  };
}

function build(overrides = {}) {
  const now = overrides.now ?? at(20, 7);
  const target = overrides.task ?? task({ endAt: overrides.deadlineAt ?? at(20, 12) });
  return buildDeadlineSprintCandidates({ now, task: target, ...overrides });
}

function hasWarning(result, code) {
  return result.warnings.some((warning) => warning.code === code);
}

test("a task without a deadline returns NO_DEADLINE", () => {
  const result = build({ task: task({ endAt: undefined }) });
  assert.equal(result.candidateCount, 0);
  assert.equal(hasWarning(result, "NO_DEADLINE"), true);
  assert.equal(hasWarning(build({ task: task({ endAt: null, deadlineAt: null }) }), "NO_DEADLINE"), true);
});

test("a passed deadline returns DEADLINE_PASSED", () => {
  const result = build({ task: task({ endAt: at(20, 6, 59) }) });
  assert.equal(result.candidateCount, 0);
  assert.equal(hasWarning(result, "DEADLINE_PASSED"), true);
});

test("a fixed task needs an independent deadlineAt", () => {
  const fixed = task({ scheduleType: "fixed", startAt: at(20, 8), endAt: at(20, 10) });
  assert.equal(getTaskDeadlineAt(fixed, at(20, 7)), null);
  assert.equal(hasWarning(build({ task: fixed }), "NO_DEADLINE"), true);

  const withDeadline = { ...fixed, deadlineAt: at(20, 18) };
  assert.equal(getTaskDeadlineAt(withDeadline, at(20, 7)), at(20, 18));
});

test("legacy tasks fall back to endAt without mutating the task", () => {
  const legacy = task({ endAt: at(20, 16) });
  const snapshot = structuredClone(legacy);
  assert.equal(getTaskDeadlineAt(legacy, at(20, 7)), at(20, 16));
  assert.deepEqual(legacy, snapshot);
});

test("explicit deadlineAt has priority over legacy endAt", () => {
  const target = task({ endAt: at(20, 10), deadlineAt: at(20, 18) });
  assert.equal(getTaskDeadlineAt(target, at(20, 7)), at(20, 18));
});

test("completed and malformed tasks return INVALID_TASK", () => {
  assert.equal(getTaskDeadlineAt(task({ done: true }), at(20, 7)), null);
  assert.equal(hasWarning(build({ task: task({ done: true }) }), "INVALID_TASK"), true);
  assert.equal(hasWarning(build({ task: null }), "INVALID_TASK"), true);
});

test("normal availability produces stable 45-minute candidates", () => {
  const result = build({ task: task({ endAt: at(20, 10) }) });
  assert.deepEqual(result.candidates.map((candidate) => candidate.minutes), [45, 45, 45]);
  assert.deepEqual(result.candidates.map((candidate) => candidate.startAt), [at(20, 7), at(20, 7, 55), at(20, 8, 50)]);
});

test("adjacent candidates keep at least the configured ten-minute break", () => {
  const result = build({ task: task({ endAt: at(20, 14) }) });
  for (let index = 1; index < result.candidates.length; index += 1) {
    assert.ok(result.candidates[index].startAt - result.candidates[index - 1].endAt >= 10 * 60 * 1000);
  }
});

test("courses split free time and are never overlapped", () => {
  const course = { id: "course-1", title: "课程", startAt: at(20, 7, 30), endAt: at(20, 8, 30) };
  const result = build({ task: task({ endAt: at(20, 11) }), courses: [course] });
  assert.equal(result.candidates.some((candidate) => candidate.startAt < course.endAt && candidate.endAt > course.startAt), false);
  assert.equal(result.candidates[0].minutes, 30);
  assert.equal(result.candidates[1].startAt, at(20, 8, 30));
});

test("explicitly fixed tasks split free time", () => {
  const fixed = task({ id: "fixed-1", title: "会议", fixedTime: true, startAt: at(20, 8), endAt: at(20, 9) });
  const result = build({ task: task({ endAt: at(20, 11) }), fixedTasks: [fixed] });
  assert.equal(result.candidates.some((candidate) => candidate.startAt < fixed.endAt && candidate.endAt > fixed.startAt), false);
});

test("ordinary DDL tasks are not treated as hard occupancy", () => {
  const ddl = task({ id: "ddl-2", scheduleType: "ddl", startAt: at(20, 7), endAt: at(20, 11) });
  const result = build({ task: task({ endAt: at(20, 10) }), fixedTasks: [ddl] });
  assert.equal(result.candidates[0].startAt, at(20, 7));
  assert.equal(result.candidates[0].minutes, 45);
});

test("adopted planning blocks are hard occupancy", () => {
  const adopted = { id: "adopted-1", startAt: at(20, 7), endAt: at(20, 8) };
  const result = build({ task: task({ endAt: at(20, 10) }), adoptedBlocks: [adopted] });
  assert.equal(result.candidates[0].startAt, at(20, 8));
  assert.equal(result.candidates.some((candidate) => candidate.startAt < adopted.endAt && candidate.endAt > adopted.startAt), false);
});

test("a 20-to-44-minute tail becomes a shortened candidate", () => {
  const result = build({ now: at(20, 21, 30), task: task({ endAt: at(20, 22) }) });
  assert.equal(result.candidateCount, 1);
  assert.equal(result.candidates[0].minutes, 30);
});

test("custom focus duration never falls below minimumBlockMinutes", () => {
  const result = build({
    task: task({ endAt: at(20, 8) }),
    focusMinutes: 10,
    minimumBlockMinutes: 20,
  });
  assert.equal(result.focusMinutes, 20);
  assert.equal(result.candidates.every((candidate) => candidate.minutes >= 20), true);
});

test("less than twenty minutes returns INSUFFICIENT_TIME", () => {
  const result = build({ now: at(20, 21, 45), task: task({ endAt: at(20, 22) }) });
  assert.equal(result.candidateCount, 0);
  assert.equal(hasWarning(result, "INSUFFICIENT_TIME"), true);
});

test("fully occupied time returns NO_AVAILABLE_SLOT", () => {
  const result = build({
    task: task({ endAt: at(20, 10) }),
    courses: [{ id: "all-day", startAt: at(20, 7), endAt: at(20, 10) }],
  });
  assert.equal(result.candidateCount, 0);
  assert.equal(hasWarning(result, "NO_AVAILABLE_SLOT"), true);
});

test("candidate generation is capped at eight and reports the limit", () => {
  const result = build({ task: task({ endAt: at(20, 22) }) });
  assert.equal(result.candidateCount, 8);
  assert.equal(hasWarning(result, "CANDIDATE_LIMIT_REACHED"), true);
});

test("cross-midnight and multi-day searches use each local daily window", () => {
  const result = build({
    now: at(20, 21, 30),
    task: task({ endAt: at(22, 9) }),
    maxCandidates: 8,
  });
  const days = new Set(result.candidates.map((candidate) => new Date(candidate.startAt).getDate()));
  assert.deepEqual([...days], [20, 21]);
  result.candidates.forEach((candidate) => {
    const start = new Date(candidate.startAt);
    const end = new Date(candidate.endAt);
    assert.ok(start.getHours() >= 7 && start.getHours() < 22);
    assert.ok(end.getHours() <= 22);
  });
});

test("the daily window excludes overnight hours", () => {
  const result = build({ now: at(20, 23), task: task({ endAt: at(21, 8) }) });
  assert.equal(result.candidateCount, 1);
  assert.equal(result.candidates[0].startAt, at(21, 7));
  assert.equal(result.candidates[0].endAt, at(21, 7, 45));
});

test("candidate ids, sprint ids and one-based sequence are deterministic", () => {
  const input = { now: at(20, 7, 2), task: task({ endAt: at(20, 11) }) };
  const first = buildDeadlineSprintCandidates(input);
  const second = buildDeadlineSprintCandidates(structuredClone(input));
  assert.deepEqual(first.candidates.map((item) => item.sequence), [1, 2, 3, 4]);
  assert.equal(new Set(first.candidates.map((item) => item.sprintId)).size, 1);
  assert.deepEqual(first.candidates.map((item) => item.id), second.candidates.map((item) => item.id));
});

test("regeneration inside the same five-minute bucket keeps identical slot ids", () => {
  const first = build({ now: at(20, 7, 1), task: task({ endAt: at(20, 10) }) });
  const second = build({ now: at(20, 7, 4), task: task({ endAt: at(20, 10) }) });
  assert.notEqual(first.generated_at, second.generated_at);
  assert.deepEqual(first.candidates.map((item) => item.id), second.candidates.map((item) => item.id));
  assert.equal(first.candidates[0].sprintId, second.candidates[0].sprintId);
});

test("the engine never mutates input arrays or objects", () => {
  const input = {
    now: at(20, 7),
    task: task({ endAt: at(21, 12) }),
    courses: [{ id: "course", startAt: at(20, 9), endAt: at(20, 10) }],
    fixedTasks: [task({ id: "fixed", fixedTime: true, startAt: at(20, 11), endAt: at(20, 12) })],
    adoptedBlocks: [{ id: "block", startAt: at(21, 8), endAt: at(21, 9) }],
  };
  const snapshot = structuredClone(input);
  buildDeadlineSprintCandidates(input);
  assert.deepEqual(input, snapshot);
});

test("fixed input has a byte-for-byte stable serialized result", () => {
  const input = { now: at(20, 7, 1), task: task({ endAt: at(21, 12) }), maxCandidates: 6 };
  assert.equal(
    JSON.stringify(buildDeadlineSprintCandidates(input)),
    JSON.stringify(buildDeadlineSprintCandidates(structuredClone(input)))
  );
});

test("intensity levels follow total candidate minutes", () => {
  const low = build({ task: task({ endAt: at(20, 8, 30) }) });
  const moderate = build({ task: task({ endAt: at(20, 10) }) });
  const high = build({ task: task({ endAt: at(20, 22) }) });
  assert.deepEqual(
    [low.totalCandidateMinutes, low.intensityLevel, moderate.totalCandidateMinutes, moderate.intensityLevel, high.intensityLevel],
    [80, "low", 135, "moderate", "high"]
  );
});

test("invalid occupied intervals produce structured warnings", () => {
  const result = build({
    courses: [{ id: "bad-course", title: "坏课程", startAt: at(20, 9), endAt: at(20, 8) }],
  });
  const warning = result.warnings.find((item) => item.code === "INVALID_INTERVAL");
  assert.deepEqual(warning.sourceIds, ["bad-course"]);
  assert.equal(typeof warning.message, "string");
});

test("HTML-like titles remain plain strings and candidates have no selected field", () => {
  const title = '<img src=x onerror="alert(1)">';
  const result = build({ task: task({ title, endAt: at(20, 9) }) });
  assert.equal(result.title, title);
  assert.equal(result.candidates[0].title, `截止前冲刺 · ${title}`);
  assert.equal(Object.hasOwn(result.candidates[0], "selected"), false);
});
