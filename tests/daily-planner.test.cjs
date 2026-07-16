const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDailyPlan,
  focusTargetMinutes,
  isFixedTimeTask,
  mergeIntervals,
} = require("../daily-planner.js");

function localTime(year, month, day, hour, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

const NOW = localTime(2026, 7, 16, 7, 2);

function task(id, title, startAt, endAt, extra = {}) {
  return { id, title, done: false, createdAt: NOW - 1000, startAt, endAt, ...extra };
}

test("empty input returns a stable empty plan with the default target", () => {
  const plan = buildDailyPlan({ now: NOW });
  assert.equal(plan.dayKey, "2026-07-16");
  assert.equal(plan.window.planningStartAt, localTime(2026, 7, 16, 7, 5));
  assert.equal(plan.focusTargetMinutes, 25);
  assert.deepEqual(plan.priorities, []);
  assert.deepEqual(plan.blocks, []);
});

test("DDL-only tasks do not occupy their whole startAt/endAt range", () => {
  const ddl = task(
    "ddl",
    "提交报告",
    localTime(2026, 7, 16, 7, 0),
    localTime(2026, 7, 16, 22, 0)
  );
  assert.equal(isFixedTimeTask(ddl), false);
  const plan = buildDailyPlan({ now: NOW, tasks: [ddl] });
  assert.equal(plan.blocks.length, 1);
  assert.equal(plan.blocks[0].startAt, localTime(2026, 7, 16, 7, 5));
  assert.equal(plan.blocks[0].minutes, 25);
});

test("only explicitly fixed tasks or fixedTaskIds become hard occupancy", () => {
  const fixed = task("fixed", "晨会", localTime(2026, 7, 16, 7, 0), localTime(2026, 7, 16, 8, 0), { fixedTime: true });
  const explicit = task("explicit", "答疑", localTime(2026, 7, 16, 8, 0), localTime(2026, 7, 16, 9, 0));
  const deadline = task("deadline", "DDL", localTime(2026, 7, 16, 7, 0), localTime(2026, 7, 16, 22, 0), { scheduleType: "deadline" });
  assert.equal(isFixedTimeTask(fixed), true);
  assert.equal(isFixedTimeTask(explicit, new Set(["explicit"])), true);
  assert.equal(isFixedTimeTask(deadline, new Set(["deadline"])), false);
  const plan = buildDailyPlan({ now: NOW, tasks: [fixed, explicit, deadline], fixedTaskIds: ["explicit"] });
  assert.equal(plan.blocks[0].startAt, localTime(2026, 7, 16, 9, 0));
});

test("cross-midnight hard intervals are clipped to today", () => {
  const course = {
    id: "overnight",
    title: "跨夜课程",
    startAt: localTime(2026, 7, 15, 23, 30),
    endAt: localTime(2026, 7, 16, 7, 40),
  };
  const ddl = task("work", "写作", NOW, localTime(2026, 7, 16, 18, 0));
  const plan = buildDailyPlan({ now: NOW, tasks: [ddl], courses: [course] });
  assert.equal(plan.blocks[0].startAt, localTime(2026, 7, 16, 7, 40));
});

test("overlapping and touching hard intervals merge", () => {
  const merged = mergeIntervals([
    { startAt: 100, endAt: 200 },
    { startAt: 100, endAt: 200 },
    { startAt: 150, endAt: 250 },
    { startAt: 250, endAt: 300 },
    { startAt: 400, endAt: 500 },
  ]);
  assert.deepEqual(merged, [
    { startAt: 100, endAt: 300 },
    { startAt: 400, endAt: 500 },
  ]);
});

test("an invalid DDL-only task reports a warning without becoming hard occupancy", () => {
  const invalid = task("invalid", "时间错误", localTime(2026, 7, 16, 10, 0), localTime(2026, 7, 16, 9, 0));
  const plan = buildDailyPlan({ now: NOW, tasks: [invalid] });
  assert.equal(isFixedTimeTask(invalid), false);
  assert.ok(plan.warnings.some((warning) => warning.code === "INVALID_INTERVAL"));
  assert.equal(plan.blocks.length, 1);
});

test("recent seven-day focus median is rounded and clamped", () => {
  const sessions = [20, 28, 47, 90].map((minutes, index) => ({
    id: String(index),
    minutes,
    startAt: NOW - (index + 1) * 60 * 60 * 1000,
    endAt: NOW - index * 60 * 60 * 1000,
  }));
  assert.equal(focusTargetMinutes(sessions, NOW), 40);
  assert.equal(focusTargetMinutes([{ minutes: 10, endAt: NOW - 1000 }], NOW), 25);
  assert.equal(focusTargetMinutes([{ minutes: 120, endAt: NOW - 1000 }], NOW), 50);
  assert.equal(focusTargetMinutes([{ minutes: 45, endAt: NOW - 8 * 24 * 60 * 60 * 1000 }], NOW), 25);
});

test("priority order is deterministic and output is limited to three priorities and blocks", () => {
  const tasks = [
    task("later", "未来任务", NOW, localTime(2026, 7, 20, 12, 0)),
    task("today-b", "今日 B", NOW, localTime(2026, 7, 16, 18, 0)),
    task("overdue", "逾期", NOW - 100000, NOW - 50000),
    task("today-a", "今日 A", NOW, localTime(2026, 7, 16, 12, 0)),
    task("soon", "近期", NOW, localTime(2026, 7, 17, 12, 0)),
  ];
  const plan = buildDailyPlan({ now: NOW, tasks });
  assert.deepEqual(plan.priorities.map((item) => item.taskId), ["overdue", "today-a", "today-b"]);
  assert.equal(plan.priorities.length, 3);
  assert.equal(plan.blocks.length, 3);
});

test("focus blocks keep at least ten minutes between one another", () => {
  const tasks = [
    task("a", "A", NOW, localTime(2026, 7, 16, 18, 0)),
    task("b", "B", NOW, localTime(2026, 7, 16, 19, 0)),
    task("c", "C", NOW, localTime(2026, 7, 16, 20, 0)),
  ];
  const plan = buildDailyPlan({ now: NOW, tasks });
  assert.equal(plan.blocks.length, 3);
  for (let index = 1; index < plan.blocks.length; index += 1) {
    assert.ok(plan.blocks[index].startAt - plan.blocks[index - 1].endAt >= 10 * 60 * 1000);
  }
});

test("a free interval shorter than twenty minutes is not forced into the plan", () => {
  const courses = [
    { id: "busy", title: "忙碌", startAt: localTime(2026, 7, 16, 7, 24), endAt: localTime(2026, 7, 16, 22, 0) },
  ];
  const tasks = [task("a", "任务 A", NOW, localTime(2026, 7, 16, 18, 0))];
  const plan = buildDailyPlan({ now: NOW, tasks, courses });
  assert.equal(plan.blocks.length, 0);
  assert.ok(plan.warnings.some((warning) => warning.code === "NO_FOCUS_SLOT"));
});

test("a focus block is not scheduled after a non-overdue task deadline", () => {
  const courses = [
    { id: "busy", title: "课程", startAt: localTime(2026, 7, 16, 7, 0), endAt: localTime(2026, 7, 16, 9, 0) },
  ];
  const tasks = [task("deadline", "早截止", NOW, localTime(2026, 7, 16, 8, 0))];
  const plan = buildDailyPlan({ now: NOW, tasks, courses });
  assert.equal(plan.blocks.length, 0);
  assert.ok(plan.warnings.some((warning) => warning.code === "NO_FOCUS_SLOT"));
});

test("warnings are structured for overdue tasks and fixed-time conflicts", () => {
  const tasks = [
    task("late", "迟交任务", NOW - 100000, NOW - 50000),
    task("meeting", "会议", localTime(2026, 7, 16, 9, 0), localTime(2026, 7, 16, 10, 0), { fixedTime: true }),
  ];
  const courses = [
    { id: "course", title: "课程", startAt: localTime(2026, 7, 16, 9, 30), endAt: localTime(2026, 7, 16, 10, 30) },
  ];
  const plan = buildDailyPlan({ now: NOW, tasks, courses });
  const codes = plan.warnings.map((warning) => warning.code);
  assert.ok(codes.includes("OVERDUE_TASK"));
  assert.ok(codes.includes("TASK_COURSE_CONFLICT"));
  for (const warning of plan.warnings) {
    assert.equal(typeof warning.code, "string");
    assert.equal(typeof warning.severity, "string");
    assert.equal(typeof warning.message, "string");
    assert.ok(Array.isArray(warning.sourceIds));
  }
});

test("the planner does not mutate any input arrays or objects", () => {
  const input = {
    now: NOW,
    tasks: [task("a", "A", NOW, localTime(2026, 7, 16, 18, 0))],
    courses: [{ id: "c", title: "C", startAt: localTime(2026, 7, 16, 9, 0), endAt: localTime(2026, 7, 16, 10, 0) }],
    focusSessions: [{ id: "f", minutes: 30, startAt: NOW - 4000000, endAt: NOW - 2000000 }],
    adoptedBlocks: [{ id: "p", title: "P", startAt: localTime(2026, 7, 16, 11, 0), endAt: localTime(2026, 7, 16, 11, 30) }],
    fixedTaskIds: ["a"],
  };
  const before = structuredClone(input);
  buildDailyPlan(input);
  assert.deepEqual(input, before);
});

test("the plan output never creates focus history or mutates task fields", () => {
  const original = task("a", "A", NOW, localTime(2026, 7, 16, 18, 0));
  const plan = buildDailyPlan({ now: NOW, tasks: [original] });
  assert.equal(Object.hasOwn(plan, "focusSessions"), false);
  assert.equal(Object.hasOwn(plan, "focusByDate"), false);
  assert.equal(original.done, false);
  assert.equal(original.startAt, NOW);
  assert.equal(original.endAt, localTime(2026, 7, 16, 18, 0));
});

test("fixed input produces a byte-for-byte stable business result", () => {
  const input = {
    now: NOW,
    tasks: [
      task("b", "B", NOW, localTime(2026, 7, 16, 19, 0)),
      task("a", "A", NOW, localTime(2026, 7, 16, 18, 0)),
    ],
    courses: [{ id: "c", title: "课程", startAt: localTime(2026, 7, 16, 9, 0), endAt: localTime(2026, 7, 16, 10, 0) }],
    focusSessions: [{ id: "f", minutes: 30, startAt: NOW - 4000000, endAt: NOW - 2000000 }],
  };
  const first = JSON.stringify(buildDailyPlan(input));
  const second = JSON.stringify(buildDailyPlan(structuredClone(input)));
  assert.equal(first, second);
});

test("titles and reasons are plain strings", () => {
  const unsafeTitle = "<img src=x onerror=alert(1)> **任务**";
  const plan = buildDailyPlan({
    now: NOW,
    tasks: [task("unsafe", unsafeTitle, NOW, localTime(2026, 7, 16, 18, 0))],
  });
  assert.equal(plan.priorities[0].title, unsafeTitle);
  assert.equal(plan.blocks[0].title, `专注 · ${unsafeTitle}`);
  assert.ok(plan.priorities[0].reasons.every((reason) => typeof reason === "string"));
});
