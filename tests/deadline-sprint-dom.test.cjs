"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const DailyPlanner = require("../daily-planner.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const sectionStart = appSource.indexOf("function cloneDailyPlanInputItem");
const sectionEnd = appSource.indexOf("function renderHome", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "planner preview helpers should exist");
const previewSource = appSource.slice(sectionStart, sectionEnd);

function localTime(day, hour, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0, 0).getTime();
}

const NOW = localTime(16, 7, 2);

function makeTask(id, title, endAt, extra = {}) {
  return { id, title, done: false, createdAt: NOW - 1000, startAt: NOW, endAt, ...extra };
}

function baseState(overrides = {}) {
  return {
    dailyPlans: {},
    tasks: [],
    courses: [],
    focusSessions: [],
    focusByDate: {},
    flames: 3,
    syncUpdatedAt: 99,
    ...overrides,
  };
}

function sprintElements(document) {
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
  };
}

function createHarness({ state = baseState(), planner = DailyPlanner } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const els = sprintElements(document);
  let saveCalls = 0;
  const storage = new Map([["zijian-focus-state-v6", JSON.stringify(state)]]);
  const context = {
    console: { error() {} },
    Date,
    Intl,
    Error,
    TypeError,
    Number,
    String,
    Promise,
    Set,
    Object,
    Array,
    JSON,
    structuredClone,
    document,
    state,
    els,
    DailyPlanner: planner,
    globalThis: null,
    saveState() { saveCalls += 1; },
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, String(value)); },
    },
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
    let dailyPlanMode = "balanced";
    let deadlineSprintPreview = null;
    let deadlineSprintSelectedIds = new Set();
    let deadlineSprintTaskId = null;
    let deadlineSprintGenerating = false;
    let deadlineSprintError = null;
    ${previewSource}
    this.sprintApi = {
      renderMode: renderDailyPlanMode,
      renderSprint: renderDeadlineSprintInterface,
      setMode: setDailyPlanMode,
      selectTask: selectDeadlineSprintTask,
      generate: generateDeadlineSprintPreview,
      toggle: toggleDeadlineSprintCandidate,
      getInput: getDeadlineSprintCandidateInput,
      getStats: deadlineSprintSelectionStats,
      getEligible: getDeadlineSprintEligibleTasks,
      get mode() { return dailyPlanMode; },
      get preview() { return deadlineSprintPreview; },
      get selectedIds() { return [...deadlineSprintSelectedIds]; },
      get taskId() { return deadlineSprintTaskId; },
      get generating() { return deadlineSprintGenerating; },
      get error() { return deadlineSprintError; }
    };
  `, context);
  return {
    api: context.sprintApi,
    document,
    els,
    state,
    storage,
    get saveCalls() { return saveCalls; },
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("default mode is balanced and switching modes never saves", () => {
  const harness = createHarness();
  harness.api.renderMode(NOW);
  assert.equal(harness.api.mode, "balanced");
  assert.equal(harness.els.dailyPlanBalancedPanel.hidden, false);
  assert.equal(harness.els.deadlineSprintPanel.hidden, true);
  harness.api.setMode("deadline-sprint", NOW);
  assert.equal(harness.els.deadlineSprintPanel.hidden, false);
  assert.equal(harness.saveCalls, 0);
});

test("eligible task options include only unfinished future deadlines", () => {
  const harness = createHarness({
    state: baseState({
      tasks: [
        makeTask("valid", "有效任务", localTime(16, 18)),
        makeTask("done", "已完成", localTime(16, 18), { done: true }),
        makeTask("past", "已过期", NOW - 1000),
        makeTask("missing", "无截止", undefined),
        makeTask("fixed", "固定会议", localTime(16, 10), { scheduleType: "fixed" }),
        makeTask("fixed-deadline", "会后报告", localTime(16, 10), { scheduleType: "fixed", deadlineAt: localTime(17, 18) }),
      ],
    }),
  });
  harness.api.setMode("deadline-sprint", NOW);
  const options = [...harness.els.deadlineSprintTaskSelect.querySelectorAll("option")];
  assert.deepEqual(options.slice(1).map((option) => option.value), ["valid", "fixed-deadline"]);
  assert.match(options[1].textContent, /有效任务/);
  assert.match(options[1].textContent, /剩余/);
});

test("no eligible tasks renders a safe empty state", () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("done", "完成", localTime(16, 12), { done: true })] }) });
  harness.api.setMode("deadline-sprint", NOW);
  assert.equal(harness.els.deadlineSprintTaskSelect.disabled, true);
  assert.match(harness.els.deadlineSprintTaskMeta.textContent, /没有未完成且具有未来截止时间/);
  assert.equal(harness.els.deadlineSprintGenerateButton.disabled, true);
});

test("selecting a task does not auto-generate or auto-select candidates", () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  assert.equal(harness.api.taskId, "task");
  assert.equal(harness.api.preview, null);
  assert.equal(harness.api.selectedIds.length, 0);
  assert.equal(harness.els.deadlineSprintGenerateButton.disabled, false);
});

test("candidate generation renders rounds, times and shortened flexible slots", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 8, 30))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  assert.equal(await harness.api.generate(NOW), true);
  assert.equal(harness.document.querySelectorAll(".deadline-sprint-candidate").length, 2);
  assert.match(harness.els.deadlineSprintContent.textContent, /第 1 轮/);
  assert.match(harness.els.deadlineSprintContent.textContent, /灵活时段/);
  assert.equal(harness.api.selectedIds.length, 0);
});

test("multi-day candidates display their local dates", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "跨日任务", localTime(18, 9))] }) });
  harness.api.setMode("deadline-sprint", localTime(16, 21, 30));
  harness.api.selectTask("task", localTime(16, 21, 30));
  await harness.api.generate(localTime(16, 21, 30));
  assert.match(harness.els.deadlineSprintContent.textContent, /7\/16/);
  assert.match(harness.els.deadlineSprintContent.textContent, /7\/17/);
});

test("individual candidates toggle and update count, minutes and day totals", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  const [first, second] = harness.api.preview.candidates;
  assert.equal(harness.api.toggle(first.id, true), true);
  assert.deepEqual(plain(harness.api.getStats()), { count: 1, minutes: first.minutes, days: 1, intensityLevel: "low" });
  assert.match(harness.els.deadlineSprintSelection.textContent, /已选择 1 轮/);
  harness.api.toggle(second.id, true);
  assert.match(harness.els.deadlineSprintSelection.textContent, /已选择 2 轮，共 90 分钟/);
  harness.api.toggle(first.id, false);
  assert.equal(harness.api.getStats().count, 1);
});

test("adopt remains disabled with or without a selection", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  assert.equal(harness.els.deadlineSprintAdoptButton.disabled, true);
  harness.api.toggle(harness.api.preview.candidates[0].id, true);
  assert.equal(harness.els.deadlineSprintAdoptButton.disabled, true);
  assert.match(harness.document.querySelector(".deadline-sprint-next-stage").textContent, /下一阶段开放/);
});

test("regeneration clears the old selection and replaces candidates", async () => {
  const state = baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] });
  const harness = createHarness({ state });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  harness.api.toggle(harness.api.preview.candidates[0].id, true);
  state.courses = [{ id: "course", startAt: localTime(16, 7), endAt: localTime(16, 9) }];
  await harness.api.generate(NOW + 5 * 60 * 1000);
  assert.equal(harness.api.selectedIds.length, 0);
  assert.ok(harness.api.preview.candidates[0].startAt >= localTime(16, 9));
});

test("switching back to balanced clears sprint task, preview and selection", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  harness.api.toggle(harness.api.preview.candidates[0].id, true);
  harness.api.setMode("balanced", NOW);
  assert.equal(harness.api.preview, null);
  assert.equal(harness.api.taskId, null);
  assert.equal(harness.api.selectedIds.length, 0);
  assert.equal(harness.els.dailyPlanBalancedPanel.hidden, false);
});

test("generation is memory-only and leaves state and localStorage untouched", async () => {
  const state = baseState({
    dailyPlans: { keep: { adopted_at: 1 } },
    tasks: [makeTask("task", "报告", localTime(16, 12))],
    courses: [{ id: "course", startAt: localTime(16, 9), endAt: localTime(16, 10) }],
  });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  const storageBefore = [...harness.storage.entries()];
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state, before);
  assert.deepEqual([...harness.storage.entries()], storageBefore);
  assert.equal(Object.hasOwn(state, "deadlineSprintPreview"), false);
});

test("input mapping includes intersecting courses, fixed tasks and adopted blocks only", () => {
  const saved = {
    version: 1,
    dayKey: "2026-07-16",
    generated_at: NOW - 1000,
    adopted_at: NOW - 500,
    window: { startAt: localTime(16, 7), endAt: localTime(16, 22), planningStartAt: localTime(16, 7) },
    focusTargetMinutes: 25,
    priorities: [],
    blocks: [{ id: "adopted", taskId: "other", title: "已采用", startAt: localTime(16, 10), endAt: localTime(16, 10, 30), minutes: 30 }],
    warnings: [],
  };
  const state = baseState({
    dailyPlans: { "2026-07-16": saved },
    tasks: [
      makeTask("task", "报告", localTime(16, 18)),
      makeTask("fixed", "会议", localTime(16, 12), { fixedTime: true, startAt: localTime(16, 11) }),
      makeTask("ddl", "普通 DDL", localTime(16, 15), { scheduleType: "ddl" }),
    ],
    courses: [
      { id: "course", startAt: localTime(16, 9), endAt: localTime(16, 10) },
      { id: "late", startAt: localTime(17, 9), endAt: localTime(17, 10) },
    ],
  });
  const harness = createHarness({ state });
  const input = harness.api.getInput(NOW, "task");
  assert.equal(input.courses.map((item) => item.id).join(","), "course");
  assert.equal(input.fixedTasks.map((item) => item.id).join(","), "fixed");
  assert.equal(input.adoptedBlocks.map((item) => item.id).join(","), "adopted");
  assert.equal(Object.hasOwn(input, "dailyPlanPreview"), false);
});

test("rapid repeated generation invokes the engine once", async () => {
  let calls = 0;
  const planner = {
    ...DailyPlanner,
    buildDeadlineSprintCandidates(input) {
      calls += 1;
      return DailyPlanner.buildDeadlineSprintCandidates(input);
    },
  };
  const harness = createHarness({ planner, state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  const first = harness.api.generate(NOW);
  const second = harness.api.generate(NOW);
  assert.equal(await second, false);
  assert.equal(await first, true);
  assert.equal(calls, 1);
});

test("deleted or completed selected tasks invalidate safely", async () => {
  const state = baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] });
  const harness = createHarness({ state });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  state.tasks = [];
  assert.equal(await harness.api.generate(NOW), false);
  assert.equal(harness.api.taskId, null);
  assert.match(harness.els.deadlineSprintContent.textContent, /已被删除或完成|已不可用/);
});

test("structured no-slot warnings render without internal details", async () => {
  const state = baseState({
    tasks: [makeTask("task", "报告", localTime(16, 10))],
    courses: [{ id: "full", title: "全部占用", startAt: localTime(16, 7), endAt: localTime(16, 10) }],
  });
  const harness = createHarness({ state });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  const warning = harness.document.querySelector('[data-warning-code="NO_AVAILABLE_SLOT"]');
  assert.ok(warning);
  assert.match(warning.textContent, /没有至少 20 分钟/);
});

test("algorithm errors show a friendly message and preserve the page", async () => {
  const planner = { ...DailyPlanner, buildDeadlineSprintCandidates() { throw new Error("private stack detail"); } };
  const harness = createHarness({ planner, state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  assert.equal(await harness.api.generate(NOW), false);
  assert.match(harness.els.deadlineSprintContent.textContent, /生成冲刺时段失败/);
  assert.doesNotMatch(harness.els.deadlineSprintContent.textContent, /private stack detail/);
  assert.equal(harness.els.deadlineSprintGenerateButton.disabled, false);
});

test("high selected intensity displays a gentle reminder", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", "报告", localTime(16, 22))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  harness.api.preview.candidates.slice(0, 5).forEach((candidate) => harness.api.toggle(candidate.id, true));
  assert.equal(harness.api.getStats().intensityLevel, "high");
  assert.match(harness.els.deadlineSprintSelection.textContent, /冲刺强度较高/);
});

test("HTML-like titles render only as text", async () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const harness = createHarness({ state: baseState({ tasks: [makeTask("task", unsafe, localTime(16, 12))] }) });
  harness.api.setMode("deadline-sprint", NOW);
  assert.equal(harness.els.deadlineSprintTaskSelect.querySelector("img"), null);
  harness.api.selectTask("task", NOW);
  await harness.api.generate(NOW);
  assert.equal(harness.els.deadlineSprintPanel.querySelector("img"), null);
  assert.match(harness.els.deadlineSprintPanel.textContent, /<img src=x onerror="alert\(1\)">/);
});

test("mobile layout has explicit min-width and overflow safeguards", () => {
  assert.match(stylesSource, /\.deadline-sprint-panel \{[^}]*min-width:\s*0/);
  assert.match(stylesSource, /\.deadline-sprint-task-field select \{[^}]*width:\s*100%[^}]*min-width:\s*0/);
  assert.match(stylesSource, /\.deadline-sprint-candidate \{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\)/);
  assert.match(stylesSource, /overflow-wrap:\s*anywhere/);
});

test("sprint source contains no persistence calls or preview input dependency", () => {
  const sprintStart = previewSource.indexOf("function getDeadlineSprintEligibleTasks");
  const sprintEnd = previewSource.indexOf("function dailyPlanClock", sprintStart);
  const sprintSource = previewSource.slice(sprintStart, sprintEnd);
  assert.doesNotMatch(sprintSource, /saveState\s*\(|localStorage|state\.dailyPlans\s*=(?!=)|\bdailyPlanPreview\b/);
  assert.match(indexSource, /均衡编排/);
  assert.match(indexSource, /截止前冲刺/);
});
