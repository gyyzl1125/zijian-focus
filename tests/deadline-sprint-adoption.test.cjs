"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const DailyPlanner = require("../daily-planner.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const sectionStart = appSource.indexOf("function cloneDailyPlanInputItem");
const sectionEnd = appSource.indexOf("function renderHome", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "planner helpers should exist");
const plannerSource = appSource.slice(sectionStart, sectionEnd);

function at(day, hour, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0, 0).getTime();
}

const NOW = at(16, 7, 0);
const TASK_ID = "deadline-task";
const DEADLINE = at(18, 18, 0);

function task(overrides = {}) {
  return {
    id: TASK_ID,
    title: "提交 Build Week 报告",
    done: false,
    createdAt: NOW - 1000,
    startAt: NOW,
    endAt: DEADLINE,
    deadlineAt: DEADLINE,
    ...overrides,
  };
}

function candidate(id, startAt, sequence, overrides = {}) {
  const minutes = overrides.minutes || 45;
  return {
    id,
    taskId: TASK_ID,
    title: "提交 Build Week 报告",
    startAt,
    endAt: startAt + minutes * 60000,
    minutes,
    planningMode: "deadline-sprint",
    sprintId: "sprint-stable",
    deadlineAt: DEADLINE,
    sequence,
    ...overrides,
  };
}

function preview(candidates, overrides = {}) {
  return {
    version: 1,
    mode: "deadline-sprint",
    generated_at: NOW,
    taskId: TASK_ID,
    title: "提交 Build Week 报告",
    deadlineAt: DEADLINE,
    sprintId: "sprint-stable",
    focusMinutes: 45,
    breakMinutes: 10,
    candidates,
    warnings: [{ code: "CANDIDATE_LIMIT_REACHED", severity: "info", message: "候选达到上限", sourceIds: [] }],
    ...overrides,
  };
}

function balancedPlan(dayKey, blocks = [], overrides = {}) {
  const day = Number(dayKey.slice(-2));
  return {
    version: 1,
    dayKey,
    generated_at: NOW - 10000,
    adopted_at: NOW - 5000,
    window: { startAt: at(day, 7), endAt: at(day, 22), planningStartAt: at(day, 7) },
    focusTargetMinutes: 25,
    priorities: [{ rank: 1, taskId: "balanced-task", title: "均衡任务", deadlineAt: at(day, 20), reasons: ["重要"] }],
    blocks,
    warnings: [],
    ...overrides,
  };
}

function balancedBlock(id, startAt, taskId = "balanced-task") {
  return { id, taskId, title: "均衡专注", startAt, endAt: startAt + 25 * 60000, minutes: 25 };
}

function baseState(overrides = {}) {
  return {
    dailyPlans: {},
    tasks: [task()],
    courses: [],
    focusSessions: [{ id: "history", startAt: NOW - 3600000, endAt: NOW - 1800000, minutes: 30 }],
    focusByDate: { "2026-07-15": 30 },
    flames: 9,
    syncUpdatedAt: 321,
    ...overrides,
  };
}

function plannerElements(document) {
  return {
    dailyPlanCard: document.querySelector("#dailyPlanCard"),
    dailyPlanStatus: document.querySelector("#dailyPlanStatus"),
    dailyPlanContent: document.querySelector("#dailyPlanContent"),
    dailyPlanGenerateButton: document.querySelector("#dailyPlanGenerateButton"),
    dailyPlanAdoptButton: document.querySelector("#dailyPlanAdoptButton"),
    dailyPlanNextStage: document.querySelector("#dailyPlanNextStage"),
    dailyPlanBalancedModeButton: document.querySelector("#dailyPlanBalancedModeButton"),
    dailyPlanSprintModeButton: document.querySelector("#dailyPlanSprintModeButton"),
    dailyPlanBalancedPanel: document.querySelector("#dailyPlanBalancedPanel"),
    deadlineSprintPanel: document.querySelector("#deadlineSprintPanel"),
    deadlineSprintTaskSelect: document.querySelector("#deadlineSprintTaskSelect"),
    deadlineSprintTaskMeta: document.querySelector("#deadlineSprintTaskMeta"),
    deadlineSprintGenerateButton: document.querySelector("#deadlineSprintGenerateButton"),
    deadlineSprintContent: document.querySelector("#deadlineSprintContent"),
    deadlineSprintSelection: document.querySelector("#deadlineSprintSelection"),
    deadlineSprintAdoptButton: document.querySelector("#deadlineSprintAdoptButton"),
    deadlineSprintAdoptionMessage: document.querySelector("#deadlineSprintAdoptionMessage"),
  };
}

function createHarness({ state = baseState(), saveMode = "success" } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const els = plannerElements(document);
  let saveCalls = 0;
  let timelineRenders = 0;
  let weekRenders = 0;
  const context = {
    console: { error() {} },
    Date,
    Intl,
    Error,
    TypeError,
    Number,
    String,
    Boolean,
    Promise,
    Map,
    Set,
    Object,
    Array,
    JSON,
    Math,
    structuredClone,
    document,
    state,
    els,
    DailyPlanner,
    globalThis: null,
    saveState() {
      saveCalls += 1;
      state.syncUpdatedAt = 999999;
      if (saveMode === "throw") throw new Error("private storage detail");
      if (saveMode === "false") return false;
      return undefined;
    },
    renderTimeline() { timelineRenders += 1; },
    renderWeekSchedule() { weekRenders += 1; },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    let dailyPlanPreview = null;
    let dailyPlanPreviewError = null;
    let dailyPlanGenerating = false;
    let dailyPlanAdopting = false;
    let dailyPlanAdoptionError = null;
    let dailyPlanPreviewNeedsRegeneration = false;
    let dailyPlanMode = "deadline-sprint";
    let deadlineSprintPreview = null;
    let deadlineSprintSelectedIds = new Set();
    let deadlineSprintTaskId = null;
    let deadlineSprintGenerating = false;
    let deadlineSprintError = null;
    let deadlineSprintAdopting = false;
    let deadlineSprintAdoptionError = null;
    let deadlineSprintAdoptionNotice = null;
    let deadlineSprintConflictIds = new Set();
    ${plannerSource}
    this.adoptionApi = {
      adopt: adoptDeadlineSprintSelection,
      validate: validateDeadlineSprintSelection,
      normalize: normalizeDailyPlanForDisplay,
      getAdopted: getAdoptedDailyPlan,
      render: renderDeadlineSprintInterface,
      setPreview(value, taskId = value && value.taskId) {
        deadlineSprintPreview = value;
        deadlineSprintTaskId = taskId == null ? null : String(taskId);
        deadlineSprintSelectedIds = new Set();
        deadlineSprintAdoptionError = null;
        deadlineSprintAdoptionNotice = null;
        deadlineSprintConflictIds = new Set();
      },
      select(ids) { deadlineSprintSelectedIds = new Set(ids.map(String)); },
      get preview() { return deadlineSprintPreview; },
      get selectedIds() { return [...deadlineSprintSelectedIds]; },
      get taskId() { return deadlineSprintTaskId; },
      get adopting() { return deadlineSprintAdopting; },
      get error() { return deadlineSprintAdoptionError; },
      get notice() { return deadlineSprintAdoptionNotice; },
      get conflicts() { return [...deadlineSprintConflictIds]; }
    };
  `, context);
  return {
    api: context.adoptionApi,
    state,
    document,
    els,
    get saveCalls() { return saveCalls; },
    get timelineRenders() { return timelineRenders; },
    get weekRenders() { return weekRenders; },
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function prepare(harness, candidates, selectedIds = candidates.map((item) => item.id), overrides = {}) {
  harness.api.setPreview(preview(candidates, overrides));
  harness.api.select(selectedIds);
  harness.api.render(NOW);
}

test("adoption is disabled without a selection and persists only selected candidates", async () => {
  const first = candidate("one", at(16, 8), 1);
  const second = candidate("two", at(16, 9), 2);
  const harness = createHarness();
  prepare(harness, [first, second], []);
  assert.equal(harness.els.deadlineSprintAdoptButton.disabled, true);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 0);
  prepare(harness, [first, second], [second.id]);
  assert.equal(harness.els.deadlineSprintAdoptButton.disabled, false);
  assert.equal(await harness.api.adopt(NOW + 1000), true);
  assert.deepEqual(plain(harness.state.dailyPlans["2026-07-16"].blocks.map((item) => item.id)), ["two"]);
});

test("multi-day adoption groups complete plans and calls saveState once", async () => {
  const first = candidate("day-one", at(16, 8), 1);
  const second = candidate("day-two", at(17, 8), 2);
  const harness = createHarness();
  prepare(harness, [first, second]);
  assert.equal(await harness.api.adopt(NOW + 1000), true);
  assert.equal(harness.saveCalls, 1);
  assert.deepEqual(Object.keys(harness.state.dailyPlans).sort(), ["2026-07-16", "2026-07-17"]);
  assert.deepEqual(plain(harness.state.dailyPlans["2026-07-16"].blocks.map((item) => item.id)), ["day-one"]);
  assert.deepEqual(plain(harness.state.dailyPlans["2026-07-17"].blocks.map((item) => item.id)), ["day-two"]);
});

test("a new sprint plan uses version 2 deadline-sprint semantics", async () => {
  const block = candidate("new", at(16, 8), 1);
  const harness = createHarness();
  prepare(harness, [block]);
  await harness.api.adopt(NOW + 2000);
  const saved = harness.state.dailyPlans["2026-07-16"];
  assert.equal(saved.version, 2);
  assert.equal(saved.mode, "deadline-sprint");
  assert.equal(saved.generated_at, NOW);
  assert.equal(saved.adopted_at, NOW + 2000);
  assert.equal(saved.focusTargetMinutes, 45);
  assert.equal(new Date(saved.window.startAt).getHours(), 7);
  assert.equal(new Date(saved.window.endAt).getHours(), 22);
  assert.deepEqual(plain(saved.priorities[0].reasons), ["截止前冲刺"]);
  assert.equal(saved.priorities[0].planningMode, "deadline-sprint");
});

test("version 1 balanced plans upgrade to version 2 mixed without losing content", async () => {
  const oldBlock = balancedBlock("balanced", at(16, 10));
  const old = balancedPlan("2026-07-16", [oldBlock]);
  const harness = createHarness({ state: baseState({ dailyPlans: { "2026-07-16": old } }) });
  prepare(harness, [candidate("sprint", at(16, 8), 1)]);
  await harness.api.adopt(NOW + 2000);
  const saved = harness.state.dailyPlans["2026-07-16"];
  assert.equal(saved.version, 2);
  assert.equal(saved.mode, "mixed");
  assert.deepEqual(plain(saved.blocks.map((item) => item.id)), ["sprint", "balanced"]);
  assert.equal(saved.priorities[0].taskId, "balanced-task");
  assert.equal(saved.focusTargetMinutes, 25);
  assert.deepEqual(plain(saved.window), old.window);
});

test("version 2 plans retain every block and merge safely", async () => {
  const oldBlocks = Array.from({ length: 5 }, (_, index) => ({
    ...candidate(`old-${index}`, at(16, 10 + index), index + 1),
    sprintId: "old-sprint",
  }));
  const old = { ...balancedPlan("2026-07-16", oldBlocks), version: 2, mode: "deadline-sprint" };
  const harness = createHarness({ state: baseState({ dailyPlans: { "2026-07-16": old } }) });
  const normalized = harness.api.getAdopted("2026-07-16");
  assert.equal(normalized.blocks.length, 5);
  prepare(harness, [candidate("new-sixth", at(16, 8), 6)]);
  await harness.api.adopt(NOW + 2000);
  assert.equal(harness.state.dailyPlans["2026-07-16"].blocks.length, 6);
});

test("duplicate blocks and priorities are never appended twice", async () => {
  const block = candidate("stable", at(16, 8), 1);
  const harness = createHarness();
  prepare(harness, [block]);
  await harness.api.adopt(NOW + 1000);
  const first = plain(harness.state.dailyPlans["2026-07-16"]);
  prepare(harness, [block]);
  assert.equal(await harness.api.adopt(NOW + 2000), true);
  assert.equal(harness.saveCalls, 1);
  assert.deepEqual(plain(harness.state.dailyPlans["2026-07-16"]), first);
  assert.equal(first.blocks.filter((item) => item.id === block.id).length, 1);
  assert.equal(first.priorities.filter((item) => item.taskId === TASK_ID).length, 1);
});

test("priority merge is stable, deduplicated and capped at five", async () => {
  const priorities = Array.from({ length: 6 }, (_, index) => ({
    rank: index + 1,
    taskId: index < 2 ? "duplicate" : `old-${index}`,
    title: `旧重点 ${index}`,
    reasons: ["旧重点"],
  }));
  const old = { ...balancedPlan("2026-07-16", [balancedBlock("old", at(16, 10))]), version: 2, mode: "balanced", priorities };
  const harness = createHarness({ state: baseState({ dailyPlans: { "2026-07-16": old } }) });
  prepare(harness, [candidate("sprint", at(16, 8), 1)]);
  await harness.api.adopt(NOW + 1000);
  const saved = harness.state.dailyPlans["2026-07-16"];
  assert.equal(saved.priorities.length, 5);
  assert.equal(saved.priorities.filter((item) => item.taskId === "duplicate").length, 1);
  assert.deepEqual(plain(saved.priorities.slice(0, 4).map((item) => item.taskId)), ["duplicate", "old-2", "old-3", "old-4"]);
  assert.equal(saved.priorities[4].taskId, TASK_ID);
});

test("task deletion, completion and deadline changes invalidate every selected item", async () => {
  for (const mutation of [
    (state) => { state.tasks = []; },
    (state) => { state.tasks[0].done = true; },
    (state) => { state.tasks[0].deadlineAt += 60000; },
  ]) {
    const block = candidate("invalid-task", at(16, 8), 1);
    const harness = createHarness();
    prepare(harness, [block]);
    mutation(harness.state);
    assert.equal(await harness.api.adopt(NOW + 1000), false);
    assert.equal(harness.saveCalls, 0);
    assert.deepEqual(plain(harness.api.selectedIds), []);
    assert.match(harness.api.error, /部分时段已发生变化/);
  }
});

test("started or internally damaged candidates fail before persistence", async () => {
  const started = candidate("started", NOW, 1);
  const damaged = candidate("damaged", at(16, 9), 2, { minutes: 44, endAt: at(16, 9, 45) });
  const harness = createHarness();
  prepare(harness, [started, damaged]);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(new Set(harness.api.conflicts), new Set(["started", "damaged"]));
});

test("new course, fixed task and adopted block conflicts abort the whole adoption", async () => {
  const cases = [
    { courses: [{ id: "course", startAt: at(16, 8, 15), endAt: at(16, 8, 30) }] },
    { tasks: [task(), { id: "fixed", title: "会议", done: false, startAt: at(16, 8, 15), endAt: at(16, 8, 30), scheduleType: "fixed" }] },
    { dailyPlans: { "2026-07-16": balancedPlan("2026-07-16", [balancedBlock("occupied", at(16, 8, 15))]) } },
    { dailyPlans: { "2026-07-16": { ...balancedPlan("2026-07-16", [candidate("same-sprint", at(16, 7, 10), 9)]), version: 2, mode: "deadline-sprint" } } },
  ];
  for (const overrides of cases) {
    const harness = createHarness({ state: baseState(overrides) });
    prepare(harness, [candidate("conflict", at(16, 8), 1)]);
    assert.equal(await harness.api.adopt(NOW + 1000), false);
    assert.equal(harness.saveCalls, 0);
    assert.deepEqual(plain(harness.api.selectedIds), []);
  }
});

test("selected candidates must not overlap and must keep the sprint break", async () => {
  const first = candidate("first", at(16, 8), 1);
  const overlapping = candidate("overlap", at(16, 8, 30), 2);
  const shortBreak = candidate("short-break", at(16, 8, 50), 3);
  for (const candidates of [[first, overlapping], [first, shortBreak]]) {
    const harness = createHarness();
    prepare(harness, candidates);
    assert.equal(await harness.api.adopt(NOW + 1000), false);
    assert.equal(harness.saveCalls, 0);
    assert.equal(harness.api.selectedIds.length, 0);
  }
});

test("one conflict cancels only conflicting ids but never partially saves", async () => {
  const valid = candidate("valid", at(16, 10), 1);
  const conflict = candidate("conflict", at(16, 8), 2);
  const state = baseState({ courses: [{ id: "course", startAt: at(16, 8), endAt: at(16, 9) }] });
  const harness = createHarness({ state });
  prepare(harness, [valid, conflict]);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(plain(harness.api.selectedIds), ["valid"]);
  assert.deepEqual(plain(harness.api.conflicts), ["conflict"]);
  assert.equal(harness.state.dailyPlans["2026-07-16"], undefined);
});

test("save failures restore all dates and syncUpdatedAt while retaining selection", async () => {
  for (const saveMode of ["throw", "false"]) {
    const existing = balancedPlan("2026-07-16", [balancedBlock("keep", at(16, 10))]);
    const state = baseState({ dailyPlans: { "2026-07-16": existing }, syncUpdatedAt: 77 });
    const before = plain(state);
    const first = candidate("one", at(16, 8), 1);
    const second = candidate("two", at(17, 8), 2);
    const harness = createHarness({ state, saveMode });
    prepare(harness, [first, second]);
    assert.equal(await harness.api.adopt(NOW + 1000), false);
    assert.equal(harness.saveCalls, 1);
    assert.deepEqual(plain(harness.state), before);
    assert.deepEqual(new Set(harness.api.selectedIds), new Set(["one", "two"]));
    assert.ok(harness.api.preview);
    assert.match(harness.api.error, /保存失败/);
    assert.doesNotMatch(harness.els.deadlineSprintContent.textContent, /private storage detail/);
  }
});

test("successful adoption changes no source entities or focus statistics", async () => {
  const harness = createHarness();
  const before = plain({
    tasks: harness.state.tasks,
    courses: harness.state.courses,
    focusSessions: harness.state.focusSessions,
    focusByDate: harness.state.focusByDate,
    flames: harness.state.flames,
  });
  prepare(harness, [candidate("safe", at(16, 8), 1)]);
  await harness.api.adopt(NOW + 1000);
  assert.deepEqual(plain({
    tasks: harness.state.tasks,
    courses: harness.state.courses,
    focusSessions: harness.state.focusSessions,
    focusByDate: harness.state.focusByDate,
    flames: harness.state.flames,
  }), before);
  assert.equal(harness.timelineRenders, 1);
  assert.equal(harness.weekRenders, 1);
});

test("persisted plans contain no selection, loading, DOM or preview-only warnings", async () => {
  const harness = createHarness();
  prepare(harness, [candidate("clean", at(16, 8), 1)]);
  await harness.api.adopt(NOW + 1000);
  const serialized = JSON.stringify(harness.state.dailyPlans);
  assert.doesNotMatch(serialized, /selected|loading|adopting|HTMLElement|CANDIDATE_LIMIT_REACHED/);
});

test("success clears sprint memory and renders a safe success message", async () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const unsafeTask = task({ title: unsafe });
  const unsafeCandidate = candidate("html", at(16, 8), 1, { title: unsafe });
  const harness = createHarness({ state: baseState({ tasks: [unsafeTask] }) });
  prepare(harness, [unsafeCandidate], [unsafeCandidate.id], { title: unsafe });
  await harness.api.adopt(NOW + 1000);
  assert.equal(harness.api.preview, null);
  assert.equal(harness.api.taskId, null);
  assert.deepEqual(plain(harness.api.selectedIds), []);
  assert.equal(harness.api.notice, "冲刺时段已加入日程");
  assert.equal(harness.document.querySelector("#deadlineSprintPanel img"), null);
  assert.equal(harness.state.dailyPlans["2026-07-16"].blocks[0].title, unsafe);
});

test("rapid repeated adoption saves exactly once", async () => {
  const harness = createHarness();
  prepare(harness, [candidate("rapid", at(16, 8), 1)]);
  const first = harness.api.adopt(NOW + 1000);
  const second = harness.api.adopt(NOW + 1000);
  assert.equal(await second, false);
  assert.equal(await first, true);
  assert.equal(harness.saveCalls, 1);
});

test("legacy version 1 and missing-version plans remain balanced and displayable", () => {
  const legacy = balancedPlan("2026-07-16", [balancedBlock("legacy", at(16, 8))]);
  delete legacy.version;
  const harness = createHarness({ state: baseState({ dailyPlans: { "2026-07-16": legacy } }) });
  const normalized = harness.api.getAdopted("2026-07-16");
  assert.equal(normalized.version, 1);
  assert.equal(normalized.mode, "balanced");
  assert.equal(normalized.blocks[0].planningMode, "balanced");
});

test("deadline sprint source is text-safe and uses a single persistence call", () => {
  const start = plannerSource.indexOf("async function adoptDeadlineSprintSelection");
  const end = plannerSource.indexOf("function dailyPlanClock", start);
  const source = plannerSource.slice(start, end);
  assert.equal((source.match(/saveState\s*\(/g) || []).length, 1);
  assert.doesNotMatch(source, /innerHTML|focusSessions\s*=|focusByDate\s*=|flames\s*=/);
  assert.match(indexSource, /id="deadlineSprintAdoptionMessage"/);
});
