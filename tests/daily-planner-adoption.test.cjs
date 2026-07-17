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
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "daily plan persistence helpers should exist");
const persistenceSource = appSource.slice(sectionStart, sectionEnd);

function localTime(year, month, day, hour, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

const NOW = localTime(2026, 7, 16, 7, 2);
const DAY_KEY = "2026-07-16";

function makeTask(id, title, endAt, extra = {}) {
  return { id, title, done: false, createdAt: NOW - 1000, startAt: NOW, endAt, ...extra };
}

function baseState(overrides = {}) {
  return {
    dailyPlans: {},
    tasks: [],
    courses: [],
    focusSessions: [],
    focusByDate: { "2026-07-15": 25 },
    flames: 7,
    syncUpdatedAt: 1234,
    ...overrides,
  };
}

function createHarness({ state = baseState(), saveMode = "success", planner = DailyPlanner } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  const storage = new Map();
  const context = {
    console: { error() {} },
    Date,
    Error,
    TypeError,
    Number,
    String,
    Promise,
    JSON,
    structuredClone,
    globalThis: null,
    document,
    state,
    DailyPlanner: planner,
    saveState() {
      saveCalls += 1;
      if (saveMode === "throw") throw new Error("storage detail");
      if (saveMode === "false") return false;
      storage.set("zijian-focus-state-v6", JSON.stringify(state));
      return undefined;
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
    let dailyPlanPreviewNeedsRegeneration = false;
    let dailyPlanSelectedBlockIds = new Set();
    ${persistenceSource}
    this.adoptionApi = {
      render: renderDailyPlanPreview,
      generate: generateDailyPlanPreview,
      adopt: adoptDailyPlanPreview,
      normalize: normalizeDailyPlanForDisplay,
      get preview() { return dailyPlanPreview; },
      get selectedBlockIds() { return [...dailyPlanSelectedBlockIds]; },
      get adopting() { return dailyPlanAdopting; },
      get adoptionError() { return dailyPlanAdoptionError; }
    };
  `, context);
  return {
    api: context.adoptionApi,
    document,
    els: context.els,
    state,
    storage,
    get saveCalls() { return saveCalls; },
  };
}

function buildSavedPlan(tasks, generatedAt = NOW, adoptedAt = NOW + 1000) {
  return {
    ...DailyPlanner.buildDailyPlan({ now: generatedAt, tasks, courses: [], focusSessions: [] }),
    adopted_at: adoptedAt,
  };
}

test("adopt button is available only for a valid non-empty preview", async () => {
  const harness = createHarness();
  harness.api.render(NOW);
  assert.equal(harness.els.dailyPlanAdoptButton.hidden, true);
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, true);
  await harness.api.generate(NOW);
  assert.equal(harness.els.dailyPlanAdoptButton.hidden, true);
  harness.state.tasks = [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))];
  await harness.api.generate(NOW + 5 * 60 * 1000);
  assert.equal(harness.els.dailyPlanAdoptButton.hidden, false);
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, false);
  assert.equal(harness.els.dailyPlanAdoptButton.textContent, "采用到日程");
});

test("adoption saves one complete deep-cloned plan and calls saveState once", async () => {
  const state = baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  const previewReference = harness.api.preview;
  assert.equal(await harness.api.adopt(NOW + 2000), true);
  assert.equal(harness.saveCalls, 1);
  assert.equal(harness.api.preview, null);
  const saved = state.dailyPlans[DAY_KEY];
  assert.deepEqual(Object.keys(saved).sort(), [
    "adopted_at", "blocks", "dayKey", "focusTargetMinutes", "generated_at", "priorities", "version", "warnings", "window",
  ].sort());
  assert.equal(saved.generated_at, NOW);
  assert.equal(saved.adopted_at, NOW + 2000);
  assert.equal(saved.blocks[0].id, previewReference.blocks[0].id);
  previewReference.priorities[0].title = "修改预览引用";
  assert.equal(saved.priorities[0].title, "任务 A");
  assert.equal(harness.els.dailyPlanStatus.textContent, "已采用");
  assert.match(harness.els.dailyPlanNextStage.textContent, /今日编排已保存/);
});

test("a new balanced preview selects every suggested block by default", async () => {
  const state = baseState({
    tasks: [
      makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0)),
      makeTask("b", "任务 B", localTime(2026, 7, 16, 19, 0)),
      makeTask("c", "任务 C", localTime(2026, 7, 16, 20, 0)),
    ],
  });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  const checkboxes = [...harness.els.dailyPlanContent.querySelectorAll('.daily-plan-block input[type="checkbox"]')];
  assert.equal(checkboxes.length, harness.api.preview.blocks.length);
  assert.ok(checkboxes.length > 0);
  assert.ok(checkboxes.every((checkbox) => checkbox.checked));
  assert.deepEqual(new Set(harness.api.selectedBlockIds), new Set(harness.api.preview.blocks.map((block) => block.id)));
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, false);
  assert.equal(harness.els.dailyPlanContent.querySelector(".daily-plan-priority input"), null);
});

test("balanced adoption persists only checked blocks and never persists selection state", async () => {
  const state = baseState({
    tasks: [
      makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0)),
      makeTask("b", "任务 B", localTime(2026, 7, 16, 19, 0)),
      makeTask("c", "任务 C", localTime(2026, 7, 16, 20, 0)),
    ],
  });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  const previewIds = harness.api.preview.blocks.map((block) => block.id);
  const checkboxes = [...harness.els.dailyPlanContent.querySelectorAll('.daily-plan-block input[type="checkbox"]')];
  assert.ok(checkboxes.length >= 2);
  checkboxes[1].checked = false;
  checkboxes[1].dispatchEvent(new harness.document.defaultView.Event("change"));
  assert.equal(await harness.api.adopt(NOW + 1000), true);
  const saved = state.dailyPlans[DAY_KEY];
  assert.deepEqual(saved.blocks.map((block) => block.id), previewIds.filter((_, index) => index !== 1));
  assert.equal(saved.priorities.length, 3);
  assert.doesNotMatch(JSON.stringify(saved), /selected|checked|loading/);
  assert.equal(Object.hasOwn(state, "dailyPlanSelectedBlockIds"), false);
});

test("balanced adoption is disabled and does not save when every block is unchecked", async () => {
  const state = baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  const checkboxes = [...harness.els.dailyPlanContent.querySelectorAll('.daily-plan-block input[type="checkbox"]')];
  assert.ok(checkboxes.length > 0);
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.dispatchEvent(new harness.document.defaultView.Event("change"));
  });
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, true);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state.dailyPlans, {});
});

test("adoption changes no task, course, focus history, statistics or flame data", async () => {
  const state = baseState({
    tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))],
    courses: [{ id: "c", title: "课程", startAt: localTime(2026, 7, 16, 9), endAt: localTime(2026, 7, 16, 10) }],
    focusSessions: [{ id: "f", title: "专注", startAt: NOW - 2000000, endAt: NOW - 500000, minutes: 25 }],
  });
  const before = structuredClone({
    tasks: state.tasks,
    courses: state.courses,
    focusSessions: state.focusSessions,
    focusByDate: state.focusByDate,
    flames: state.flames,
  });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  await harness.api.adopt(NOW + 1000);
  assert.deepEqual({
    tasks: state.tasks,
    courses: state.courses,
    focusSessions: state.focusSessions,
    focusByDate: state.focusByDate,
    flames: state.flames,
  }, before);
  assert.equal(state.tasks[0].startAt, NOW);
  assert.equal(state.tasks[0].endAt, localTime(2026, 7, 16, 18, 0));
  assert.equal(state.tasks[0].done, false);
});

test("re-adopting the same generated plan replaces the day and never appends duplicate blocks", async () => {
  const state = baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  await harness.api.adopt(NOW + 1000);
  const firstIds = state.dailyPlans[DAY_KEY].blocks.map((block) => block.id);
  await harness.api.generate(NOW);
  await harness.api.adopt(NOW + 2000);
  const secondIds = state.dailyPlans[DAY_KEY].blocks.map((block) => block.id);
  assert.deepEqual(secondIds, firstIds);
  assert.equal(new Set(secondIds).size, secondIds.length);
  assert.equal(state.dailyPlans[DAY_KEY].adopted_at, NOW + 2000);
  assert.equal(Object.keys(state.dailyPlans).filter((key) => key === DAY_KEY).length, 1);
});

test("a new preview leaves the saved plan untouched until adoption then replaces it as a whole", async () => {
  const state = baseState({ tasks: [makeTask("old", "旧任务", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  await harness.api.adopt(NOW + 1000);
  const oldSaved = structuredClone(state.dailyPlans[DAY_KEY]);
  state.tasks = [makeTask("new", "新任务", localTime(2026, 7, 16, 19, 0))];
  await harness.api.generate(NOW + 5 * 60 * 1000);
  assert.deepEqual(state.dailyPlans[DAY_KEY], oldSaved);
  assert.match(harness.els.dailyPlanNextStage.textContent, /采用后将替换今天已保存的编排/);
  assert.match(harness.els.dailyPlanContent.textContent, /新任务/);
  await harness.api.adopt(NOW + 6 * 60 * 1000);
  assert.equal(state.dailyPlans[DAY_KEY].priorities[0].taskId, "new");
  assert.doesNotMatch(JSON.stringify(state.dailyPlans[DAY_KEY]), /旧任务/);
});

test("a saved plan renders after a fresh harness without automatic regeneration", () => {
  let buildCalls = 0;
  const planner = { ...DailyPlanner, buildDailyPlan(input) { buildCalls += 1; return DailyPlanner.buildDailyPlan(input); } };
  const saved = buildSavedPlan([makeTask("saved", "已保存任务", localTime(2026, 7, 16, 18, 0))]);
  const harness = createHarness({ state: baseState({ dailyPlans: { [DAY_KEY]: saved } }), planner });
  harness.api.render(NOW);
  assert.equal(buildCalls, 0);
  assert.equal(harness.els.dailyPlanStatus.textContent, "已采用");
  assert.equal(harness.els.dailyPlanGenerateButton.textContent, "重新编排");
  assert.match(harness.els.dailyPlanContent.textContent, /已保存任务/);
  assert.equal(harness.els.dailyPlanAdoptButton.hidden, true);
});

test("damaged and legacy dailyPlans data never crashes the home card", () => {
  const brokenValues = [null, "bad", [], { dayKey: DAY_KEY }, { dayKey: DAY_KEY, generated_at: NOW, window: {}, focusTargetMinutes: 25, priorities: "bad", blocks: null, warnings: {} }];
  for (const value of brokenValues) {
    const harness = createHarness({ state: baseState({ dailyPlans: { [DAY_KEY]: value } }) });
    assert.doesNotThrow(() => harness.api.render(NOW));
    assert.equal(harness.els.dailyPlanStatus.textContent, "尚未生成");
  }
});

test("HTML-like content loaded from a saved plan remains plain text", () => {
  const unsafe = "<img src=x onerror=alert(1)>危险任务";
  const saved = buildSavedPlan([makeTask("unsafe", unsafe, localTime(2026, 7, 16, 18, 0))]);
  const harness = createHarness({ state: baseState({ dailyPlans: { [DAY_KEY]: saved } }) });
  harness.api.render(NOW);
  assert.equal(harness.els.dailyPlanContent.querySelector("img"), null);
  assert.match(harness.els.dailyPlanContent.textContent, /<img src=x onerror=alert\(1\)>危险任务/);
});

test("rapid repeated adoption saves exactly once", async () => {
  const harness = createHarness({ state: baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] }) });
  await harness.api.generate(NOW);
  const first = harness.api.adopt(NOW + 1000);
  const second = harness.api.adopt(NOW + 2000);
  assert.equal(harness.api.adopting, true);
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, true);
  assert.equal(harness.els.dailyPlanCard.getAttribute("aria-busy"), "true");
  assert.equal(await second, false);
  assert.equal(await first, true);
  assert.equal(harness.saveCalls, 1);
});

test("saveState exceptions show a friendly error and restore the previous saved plan", async () => {
  const previous = buildSavedPlan([makeTask("old", "旧计划", localTime(2026, 7, 16, 18, 0))], NOW - 10000, NOW - 9000);
  const state = baseState({
    dailyPlans: { [DAY_KEY]: previous },
    tasks: [makeTask("new", "新计划", localTime(2026, 7, 16, 19, 0))],
  });
  const harness = createHarness({ state, saveMode: "throw" });
  await harness.api.generate(NOW);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 1);
  assert.equal(harness.api.adoptionError, "保存失败，请稍后重试");
  assert.equal(harness.els.dailyPlanStatus.textContent, "保存失败");
  assert.match(harness.els.dailyPlanContent.textContent, /保存失败，请稍后重试/);
  assert.deepEqual(state.dailyPlans[DAY_KEY], previous);
  assert.notEqual(harness.api.preview, null);
  assert.equal(harness.els.dailyPlanAdoptButton.disabled, false);
});

test("saveState false results are handled as failures without a second save", async () => {
  const state = baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state, saveMode: "false" });
  await harness.api.generate(NOW);
  assert.equal(await harness.api.adopt(NOW + 1000), false);
  assert.equal(harness.saveCalls, 1);
  assert.equal(state.dailyPlans[DAY_KEY], undefined);
  assert.match(harness.els.dailyPlanContent.textContent, /保存失败，请稍后重试/);
});

test("persisted JSON contains no preview, loading, DOM or error fields", async () => {
  const state = baseState({ tasks: [makeTask("a", "任务 A", localTime(2026, 7, 16, 18, 0))] });
  const harness = createHarness({ state });
  await harness.api.generate(NOW);
  await harness.api.adopt(NOW + 1000);
  const persisted = harness.storage.get("zijian-focus-state-v6");
  assert.ok(persisted);
  assert.doesNotMatch(persisted, /dailyPlanPreview|dailyPlanGenerating|dailyPlanAdopting|dailyPlanAdoptionError|HTMLElement/);
  assert.equal(Object.hasOwn(state, "dailyPlanPreview"), false);
  assert.equal(Object.hasOwn(state.dailyPlans[DAY_KEY], "loading"), false);
});

test("dailyPlans sync recency uses adopted_at before generated_at", () => {
  const deletionStart = appSource.indexOf("function normalizeDeletionMap");
  const deletionEnd = appSource.indexOf("function normalizeState", deletionStart);
  const mergeStart = appSource.indexOf("function mergeById");
  const mergeEnd = appSource.indexOf("function cloudSafeState", mergeStart);
  assert.ok(deletionStart >= 0 && deletionEnd > deletionStart);
  const context = { Number, Map, Set };
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(deletionStart, deletionEnd)}\n${appSource.slice(mergeStart, mergeEnd)}\nthis.merge = mergeSyncedStates;`, context);
  const localPlan = { generated_at: 100, adopted_at: 150, marker: "local-old" };
  const remotePlan = { generated_at: 100, adopted_at: 200, marker: "remote-new" };
  const base = { dailyPlans: {}, focusByDate: {}, memoTags: [], ownedSkins: [], ownedFlowers: [], ownedThemes: [], quotes: [] };
  const merged = context.merge(
    { ...base, syncUpdatedAt: 10, dailyPlans: { [DAY_KEY]: localPlan } },
    { ...base, syncUpdatedAt: 20, dailyPlans: { [DAY_KEY]: remotePlan } }
  );
  assert.equal(merged.dailyPlans[DAY_KEY].marker, "remote-new");
});
