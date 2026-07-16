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
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "daily plan preview helpers should exist");
const previewSource = appSource.slice(sectionStart, sectionEnd);

function localTime(year, month, day, hour, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

const NOW = localTime(2026, 7, 16, 7, 2);

function makeTask(id, title, endAt, extra = {}) {
  return { id, title, done: false, createdAt: NOW - 1000, startAt: NOW, endAt, ...extra };
}

function createHarness({ state, planner = DailyPlanner } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const persistentState = state || {
    dailyPlans: { untouched: true },
    tasks: [],
    courses: [],
    focusSessions: [],
    focusByDate: { "2026-07-15": 30 },
    flames: 9,
    syncUpdatedAt: 12345,
  };
  let saveCalls = 0;
  const storage = new Map([["zijian-focus-state-v6", JSON.stringify(persistentState)]]);
  const context = {
    console: { error() {} },
    Date,
    Error,
    TypeError,
    Number,
    String,
    Promise,
    structuredClone,
    globalThis: null,
    document,
    state: persistentState,
    DailyPlanner: planner,
    saveState() { saveCalls += 1; },
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, String(value)); },
    },
    els: {
      dailyPlanCard: document.querySelector("#dailyPlanCard"),
      dailyPlanStatus: document.querySelector("#dailyPlanStatus"),
      dailyPlanContent: document.querySelector("#dailyPlanContent"),
      dailyPlanGenerateButton: document.querySelector("#dailyPlanGenerateButton"),
      dailyPlanAdoptButton: document.querySelector("#dailyPlanAdoptButton"),
      dailyPlanNextStage: document.querySelector("#dailyPlanNextStage"),
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
    ${previewSource}
    this.previewApi = {
      getInput: getDailyPlanPreviewInput,
      render: renderDailyPlanPreview,
      generate: generateDailyPlanPreview,
      adopt: adoptDailyPlanPreview,
      get preview() { return dailyPlanPreview; },
      get generating() { return dailyPlanGenerating; },
      get error() { return dailyPlanPreviewError; }
    };
  `, context);
  return {
    ...context,
    api: context.previewApi,
    get saveCalls() { return saveCalls; },
    storage,
  };
}

test("index loads daily-planner.js before app.js", () => {
  const plannerIndex = indexSource.indexOf("daily-planner.js?v=53");
  const appIndex = indexSource.indexOf("app.js?v=53");
  assert.ok(plannerIndex >= 0 && appIndex > plannerIndex);
  assert.match(indexSource, /本地智能编排/);
  assert.match(appSource, /dailyPlanGenerateButton\.addEventListener\("click", \(\) => generateDailyPlanPreview\(Date\.now\(\)\)\)/);
  const generationSource = previewSource.slice(
    previewSource.indexOf("async function generateDailyPlanPreview"),
    previewSource.indexOf("async function adoptDailyPlanPreview")
  );
  assert.doesNotMatch(generationSource, /saveState\s*\(|localStorage|state\.dailyPlans\s*=/);
});

test("empty state renders the initial interface and an empty generated preview", async () => {
  const harness = createHarness();
  harness.api.render();
  assert.equal(harness.els.dailyPlanStatus.textContent, "尚未生成");
  assert.equal(harness.els.dailyPlanGenerateButton.textContent, "为我编排今天");
  assert.equal(await harness.api.generate(NOW), true);
  assert.equal(harness.els.dailyPlanStatus.textContent, "预览已生成");
  assert.match(harness.els.dailyPlanContent.textContent, /今天还没有待编排任务/);
  assert.match(harness.els.dailyPlanContent.textContent, /建议单次专注 25 分钟/);
});

test("normal generation renders priorities, focus blocks, target and generated time", async () => {
  const harness = createHarness({
    state: {
      dailyPlans: {},
      tasks: [makeTask("a", "完成报告", localTime(2026, 7, 16, 18, 0))],
      courses: [],
      focusSessions: [{ id: "focus", minutes: 30, startAt: NOW - 4000000, endAt: NOW - 2000000 }],
      focusByDate: {}, flames: 0, syncUpdatedAt: 8,
    },
  });
  await harness.api.generate(NOW);
  assert.equal(harness.document.querySelectorAll(".daily-plan-priority").length, 1);
  assert.equal(harness.document.querySelectorAll(".daily-plan-block").length, 1);
  assert.match(harness.els.dailyPlanContent.textContent, /完成报告/);
  assert.match(harness.els.dailyPlanContent.textContent, /建议单次专注 30 分钟/);
  assert.match(harness.els.dailyPlanContent.textContent, /生成于/);
  assert.equal(harness.els.dailyPlanGenerateButton.textContent, "重新编排");
  assert.equal(harness.els.dailyPlanNextStage.hidden, true);
  assert.equal(harness.els.dailyPlanAdoptButton.hidden, false);
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, false);
});

test("preview UI never renders more than three priorities or three blocks", async () => {
  const tasks = Array.from({ length: 6 }, (_, index) => makeTask(
    String(index),
    `任务 ${index}`,
    localTime(2026, 7, 16, 12 + index, 0)
  ));
  const harness = createHarness({ state: { dailyPlans: {}, tasks, courses: [], focusSessions: [], focusByDate: {}, flames: 0, syncUpdatedAt: 1 } });
  await harness.api.generate(NOW);
  assert.equal(harness.document.querySelectorAll(".daily-plan-priority").length, 3);
  assert.equal(harness.document.querySelectorAll(".daily-plan-block").length, 3);
});

test("structured warnings are displayed as text", async () => {
  const harness = createHarness({
    state: {
      dailyPlans: {},
      tasks: [makeTask("late", "逾期任务", NOW - 1000, { startAt: NOW - 5000 })],
      courses: [], focusSessions: [], focusByDate: {}, flames: 0, syncUpdatedAt: 1,
    },
  });
  await harness.api.generate(NOW);
  assert.ok(harness.document.querySelectorAll(".daily-plan-warning").length >= 1);
  assert.match(harness.els.dailyPlanContent.textContent, /逾期任务 已逾期/);
});

test("a plan with priorities but no usable slot shows the no-availability state", async () => {
  const harness = createHarness({
    state: {
      dailyPlans: {},
      tasks: [makeTask("blocked", "被占用的任务", localTime(2026, 7, 16, 18, 0))],
      courses: [{ id: "full-day", title: "全天固定安排", startAt: localTime(2026, 7, 16, 7, 0), endAt: localTime(2026, 7, 16, 22, 0) }],
      focusSessions: [], focusByDate: {}, flames: 0, syncUpdatedAt: 1,
    },
  });
  await harness.api.generate(NOW);
  assert.equal(harness.document.querySelectorAll(".daily-plan-priority").length, 1);
  assert.equal(harness.document.querySelectorAll(".daily-plan-block").length, 0);
  assert.match(harness.els.dailyPlanContent.textContent, /暂时没有可用时段/);
});

test("regeneration replaces the previous in-memory preview", async () => {
  const state = {
    dailyPlans: {},
    tasks: [makeTask("old", "旧任务", localTime(2026, 7, 16, 18, 0))],
    courses: [], focusSessions: [], focusByDate: {}, flames: 0, syncUpdatedAt: 1,
  };
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  state.tasks = [makeTask("new", "新任务", localTime(2026, 7, 16, 19, 0))];
  await harness.api.generate(NOW + 5 * 60 * 1000);
  assert.doesNotMatch(harness.els.dailyPlanContent.textContent, /旧任务/);
  assert.match(harness.els.dailyPlanContent.textContent, /新任务/);
  assert.equal(harness.api.preview.priorities[0].taskId, "new");
});

test("generation neither calls saveState nor changes persistent state or localStorage", async () => {
  const state = {
    dailyPlans: { keep: { generated_at: 1 } },
    tasks: [makeTask("a", "任务", localTime(2026, 7, 16, 18, 0))],
    courses: [{ id: "c", title: "课程", startAt: localTime(2026, 7, 16, 9, 0), endAt: localTime(2026, 7, 16, 10, 0) }],
    focusSessions: [{ id: "f", minutes: 25, startAt: NOW - 4000000, endAt: NOW - 2000000 }],
    focusByDate: { "2026-07-15": 25 },
    flames: 12,
    syncUpdatedAt: 9876,
  };
  const beforeState = structuredClone(state);
  const harness = createHarness({ state });
  const beforeStorage = [...harness.storage.entries()];
  await harness.api.generate(NOW);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state, beforeState);
  assert.deepEqual([...harness.storage.entries()], beforeStorage);
});

test("input mapping includes unfinished tasks, overlapping courses and recent real sessions only", () => {
  const oldSessionEnd = NOW - 8 * 24 * 60 * 60 * 1000;
  const harness = createHarness({
    state: {
      dailyPlans: {},
      tasks: [
        makeTask("open", "未完成", localTime(2026, 7, 16, 18, 0), { fixedTime: true }),
        makeTask("done", "已完成", localTime(2026, 7, 16, 18, 0), { done: true }),
      ],
      courses: [
        { id: "overnight", startAt: localTime(2026, 7, 15, 23, 0), endAt: localTime(2026, 7, 16, 8, 0) },
        { id: "tomorrow", startAt: localTime(2026, 7, 17, 9, 0), endAt: localTime(2026, 7, 17, 10, 0) },
      ],
      focusSessions: [
        { id: "recent", minutes: 25, startAt: NOW - 5000, endAt: NOW - 1000 },
        { id: "old", minutes: 25, startAt: oldSessionEnd - 1000, endAt: oldSessionEnd },
      ],
      focusByDate: {}, flames: 0, syncUpdatedAt: 1,
    },
  });
  const input = harness.api.getInput(NOW);
  assert.deepEqual(input.tasks.map((item) => item.id), ["open"]);
  assert.deepEqual(input.courses.map((item) => item.id), ["overnight"]);
  assert.deepEqual(input.focusSessions.map((item) => item.id), ["recent"]);
  assert.deepEqual(input.fixedTaskIds, ["open"]);
});

test("task titles are rendered with textContent and cannot inject HTML", async () => {
  const unsafe = "<img src=x onerror=alert(1)>危险任务";
  const harness = createHarness({ state: { dailyPlans: {}, tasks: [makeTask("x", unsafe, localTime(2026, 7, 16, 18, 0))], courses: [], focusSessions: [], focusByDate: {}, flames: 0, syncUpdatedAt: 1 } });
  await harness.api.generate(NOW);
  assert.equal(harness.els.dailyPlanContent.querySelector("img"), null);
  assert.match(harness.els.dailyPlanContent.textContent, /<img src=x onerror=alert\(1\)>危险任务/);
});

test("algorithm errors show a friendly state without breaking the card", async () => {
  const brokenPlanner = { ...DailyPlanner, buildDailyPlan() { throw new Error("internal detail"); } };
  const harness = createHarness({ planner: brokenPlanner });
  assert.equal(await harness.api.generate(NOW), false);
  assert.equal(harness.els.dailyPlanStatus.textContent, "生成失败");
  assert.match(harness.els.dailyPlanContent.textContent, /暂时无法完成编排/);
  assert.doesNotMatch(harness.els.dailyPlanContent.textContent, /internal detail/);
  assert.equal(harness.els.dailyPlanGenerateButton.disabled, false);
  assert.equal(harness.els.dailyPlanNextStage.hidden, true);
});

test("rapid repeated generation is locked while the first request is running", async () => {
  let calls = 0;
  const countingPlanner = { ...DailyPlanner, buildDailyPlan(input) { calls += 1; return DailyPlanner.buildDailyPlan(input); } };
  const harness = createHarness({ planner: countingPlanner });
  const first = harness.api.generate(NOW);
  const second = harness.api.generate(NOW + 1000);
  assert.equal(harness.api.generating, true);
  assert.equal(harness.els.dailyPlanGenerateButton.disabled, true);
  assert.equal(harness.els.dailyPlanCard.getAttribute("aria-busy"), "true");
  assert.equal(await second, false);
  assert.equal(await first, true);
  assert.equal(calls, 1);
  assert.equal(harness.els.dailyPlanCard.getAttribute("aria-busy"), "false");
});
