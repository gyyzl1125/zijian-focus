const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const helperStart = appSource.indexOf("function normalizeDeletionMap");
const helperEnd = appSource.indexOf("function normalizeState", helperStart);
const deletionStart = appSource.indexOf("function dailyPlanReferencesAnyTask");
const deletionEnd = appSource.indexOf("function setDefaultTaskTimes", deletionStart);
const mergeStart = appSource.indexOf("function mergeById");
const mergeEnd = appSource.indexOf("function scheduleCloudSync", mergeStart);
const taskRenderStart = appSource.indexOf("function renderTasks");
const taskRenderEnd = appSource.indexOf("function renderTimeline", taskRenderStart);
const detailStart = appSource.indexOf("function showEventDetail");
const detailEnd = appSource.indexOf("function showCompletionSheet", detailStart);
const ddlStart = appSource.indexOf("function renderDdl");
const ddlEnd = appSource.indexOf("function addMemo", ddlStart);

for (const [start, end, label] of [
  [helperStart, helperEnd, "deletion registry helpers"],
  [deletionStart, deletionEnd, "task deletion helpers"],
  [mergeStart, mergeEnd, "sync merge helpers"],
  [taskRenderStart, taskRenderEnd, "task renderer"],
  [detailStart, detailEnd, "event detail helpers"],
  [ddlStart, ddlEnd, "DDL renderer"],
]) assert.ok(start >= 0 && end > start, `${label} should exist`);

const NOW = new Date(2026, 6, 17, 12, 0, 0, 0).getTime();
const TODAY = "2026-07-17";
const TOMORROW = "2026-07-18";
const YESTERDAY = "2026-07-16";

function task(id, overrides = {}) {
  return {
    id,
    title: `任务-${id}`,
    done: false,
    startAt: NOW - 60_000,
    endAt: NOW + 3_600_000,
    reminderMode: "relative",
    remindBeforeMinutes: 15,
    color: "sage",
    ...overrides,
  };
}

function plan(dayKey, taskIds, overrides = {}) {
  return {
    version: 1,
    dayKey,
    generated_at: NOW - 5000,
    adopted_at: NOW - 4000,
    window: { startAt: NOW, endAt: NOW + 1000, planningStartAt: NOW },
    focusTargetMinutes: 25,
    priorities: taskIds.map((taskId, index) => ({ rank: index + 1, taskId, title: `重点-${taskId}`, reasons: [] })),
    blocks: taskIds.map((taskId, index) => ({ id: `block-${taskId}`, taskId, title: `专注-${taskId}`, startAt: NOW + index * 1000, endAt: NOW + index * 1000 + 500, minutes: 25 })),
    warnings: [],
    ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    syncUpdatedAt: 0,
    tasks: [],
    courses: [],
    memos: [],
    focusSessions: [],
    focusByDate: {},
    flames: 0,
    flameLedger: [],
    transactions: [],
    dailyPlans: {},
    deletions: { version: 1, tasks: {}, memos: {} },
    memoTags: [], ownedSkins: [], ownedFlowers: [], ownedThemes: [], quotes: [],
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDeletionHarness(initialState, preview = null) {
  const state = initialState;
  let saveCalls = 0;
  const cancellations = [];
  const renders = [];
  class FixedDate extends Date {
    static now() { return NOW; }
  }
  const context = {
    state,
    console: { error() {} },
    Date: FixedDate,
    Number, String, Object, Array, Set, Map, Math, structuredClone,
    saveState() { saveCalls += 1; },
    cancelTaskNotification(item) { cancellations.push(item.id); return Promise.resolve(); },
  };
  for (const name of ["renderTasks", "renderTimeline", "renderWeekSchedule", "renderDdl", "renderWidgets", "renderFocusFeed", "renderHome", "renderNotificationButton", "updatePageBadge", "checkReminders"]) {
    context[name] = () => renders.push(name);
  }
  vm.createContext(context);
  vm.runInContext(`
    let dailyPlanPreview = ${JSON.stringify(preview)};
    let dailyPlanPreviewError = null;
    let dailyPlanAdoptionError = null;
    let dailyPlanPreviewNeedsRegeneration = false;
    function dailyPlanDayKey(timestamp) {
      const value = new Date(timestamp);
      return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
    }
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(deletionStart, deletionEnd)}
    this.api = {
      deleteTaskById,
      deleteTasksByIds,
      clearDoneTasks,
      removeDeletedTaskReferencesFromPlans,
      get preview() { return dailyPlanPreview; },
      get needsRegeneration() { return dailyPlanPreviewNeedsRegeneration; }
    };
  `, context);
  return {
    state,
    api: context.api,
    cancellations,
    renders,
    get saveCalls() { return saveCalls; },
  };
}

test("single deletion writes a tombstone, removes only that task and saves once", () => {
  const keep = task("keep");
  const remove = task("remove");
  const state = baseState({ tasks: [keep, remove] });
  const beforeKeep = structuredClone(keep);
  const harness = createDeletionHarness(state);
  const result = harness.api.deleteTaskById("remove", NOW);
  assert.deepEqual(plain(result), { ok: true, reason: null, deletedIds: ["remove"] });
  assert.deepEqual(state.tasks, [beforeKeep]);
  assert.deepEqual(plain(state.deletions.tasks.remove), { deletedAt: NOW });
  assert.equal(harness.saveCalls, 1);
  assert.deepEqual(harness.cancellations, ["remove"]);
  for (const render of ["renderTasks", "renderTimeline", "renderWeekSchedule", "renderDdl", "renderWidgets", "renderHome", "renderNotificationButton", "updatePageBadge"]) {
    assert.ok(harness.renders.includes(render));
  }
});

test("invalid, missing and repeatedly deleted ids are safe no-ops", () => {
  const state = baseState({ tasks: [task("keep")] });
  const before = structuredClone(state);
  const harness = createDeletionHarness(state);
  assert.equal(harness.api.deleteTaskById("", NOW).reason, "invalid-task-id");
  assert.equal(harness.api.deleteTaskById("missing", NOW).reason, "task-not-found");
  assert.equal(harness.api.deleteTaskById("keep", NaN).reason, "invalid-deleted-at");
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state, before);
  assert.equal(harness.api.deleteTaskById("keep", NOW).ok, true);
  assert.equal(harness.api.deleteTaskById("keep", NOW + 1).reason, "task-not-found");
  assert.equal(harness.saveCalls, 1);
});

test("an older deletion time never replaces a newer tombstone", () => {
  const state = baseState({
    tasks: [task("stale")],
    dailyPlans: { [TODAY]: plan(TODAY, ["stale"]) },
    deletions: { version: 1, tasks: { stale: { deletedAt: NOW + 5000 } }, memos: {} },
  });
  const harness = createDeletionHarness(state);
  harness.api.deleteTaskById("stale", NOW);
  assert.equal(state.deletions.tasks.stale.deletedAt, NOW + 5000);
  assert.deepEqual(state.dailyPlans[TODAY].priorities, []);
  assert.equal(state.dailyPlans[TODAY].adopted_at, NOW + 5000);
});

test("deleted tasks cannot revive when merged with an older remote copy", () => {
  const state = baseState({ tasks: [task("gone")] });
  createDeletionHarness(state).api.deleteTaskById("gone", NOW);
  const context = { Number, String, Object, Array, Map, Set, structuredClone, state };
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(helperStart, helperEnd)}\n${appSource.slice(mergeStart, mergeEnd)}\nthis.merge = mergeSyncedStates;`, context);
  const remote = baseState({ syncUpdatedAt: 1, tasks: [task("gone")] });
  const merged = context.merge(state, remote);
  assert.deepEqual(plain(merged.tasks), []);
  assert.equal(merged.deletions.tasks.gone.deletedAt, NOW);
});

test("task tombstones do not affect a memo with the same id or unrelated statistics", () => {
  const focusSessions = [{ id: "focus", minutes: 25, startAt: 1, endAt: 2 }];
  const focusByDate = { [TODAY]: 25 };
  const memo = { id: "shared", title: "同 ID 备忘" };
  const state = baseState({ tasks: [task("shared"), task("other")], memos: [memo], focusSessions, focusByDate, flames: 7 });
  const harness = createDeletionHarness(state);
  harness.api.deleteTaskById("shared", NOW);
  assert.deepEqual(state.memos, [memo]);
  assert.deepEqual(state.focusSessions, focusSessions);
  assert.deepEqual(state.focusByDate, focusByDate);
  assert.equal(state.flames, 7);
  assert.equal(state.tasks[0].id, "other");
});

test("today and future plan references are removed while past plans remain snapshots", () => {
  const past = plan(YESTERDAY, ["gone"]);
  const today = plan(TODAY, ["gone", "keep"]);
  const future = plan(TOMORROW, ["gone"]);
  const state = baseState({ tasks: [task("gone")], dailyPlans: { [YESTERDAY]: past, [TODAY]: today, [TOMORROW]: future } });
  const harness = createDeletionHarness(state);
  harness.api.deleteTaskById("gone", NOW);
  assert.deepEqual(state.dailyPlans[YESTERDAY], past);
  assert.deepEqual(state.dailyPlans[TODAY].priorities.map((item) => item.taskId), ["keep"]);
  assert.deepEqual(state.dailyPlans[TODAY].blocks.map((item) => item.taskId), ["keep"]);
  assert.deepEqual(state.dailyPlans[TOMORROW].priorities, []);
  assert.deepEqual(state.dailyPlans[TOMORROW].blocks, []);
  assert.equal(state.dailyPlans[TODAY].adopted_at, NOW);
  assert.equal(state.dailyPlans[TOMORROW].adopted_at, NOW);
});

test("TASK_DELETED warnings are retained on empty plans and never duplicated", () => {
  const warning = { code: "TASK_DELETED", severity: "warning", message: "原重点任务已删除，相关专注时段已移除", sourceIds: ["gone"] };
  const state = baseState({
    tasks: [task("gone")],
    dailyPlans: { [TODAY]: plan(TODAY, ["gone"], { warnings: [warning] }) },
  });
  createDeletionHarness(state).api.deleteTaskById("gone", NOW);
  assert.deepEqual(state.dailyPlans[TODAY].priorities, []);
  assert.deepEqual(state.dailyPlans[TODAY].blocks, []);
  assert.equal(state.dailyPlans[TODAY].warnings.filter((item) => item.code === "TASK_DELETED").length, 1);
  assert.deepEqual(state.dailyPlans[TODAY].warnings[0], warning);
});

test("a current preview referencing the deleted task is cleared and marked for regeneration", () => {
  const state = baseState({ tasks: [task("gone")] });
  const harness = createDeletionHarness(state, plan(TODAY, ["gone"]));
  harness.api.deleteTaskById("gone", NOW);
  assert.equal(harness.api.preview, null);
  assert.equal(harness.api.needsRegeneration, true);
  assert.equal(Object.hasOwn(state, "dailyPlanPreview"), false);
});

test("clear completed writes every tombstone and performs one batch save", () => {
  const state = baseState({ tasks: [task("a", { done: true }), task("b", { done: true }), task("keep")] });
  const harness = createDeletionHarness(state);
  const result = harness.api.clearDoneTasks();
  assert.equal(result.ok, true);
  assert.deepEqual(new Set(result.deletedIds), new Set(["a", "b"]));
  assert.deepEqual(state.tasks.map((item) => item.id), ["keep"]);
  assert.equal(state.deletions.tasks.a.deletedAt, NOW);
  assert.equal(state.deletions.tasks.b.deletedAt, NOW);
  assert.equal(harness.saveCalls, 1);
  assert.deepEqual(new Set(harness.cancellations), new Set(["a", "b"]));
});

test("clear completed does not save when there are no completed tasks", () => {
  const state = baseState({ tasks: [task("keep")] });
  const harness = createDeletionHarness(state);
  assert.equal(harness.api.clearDoneTasks().reason, "no-completed-tasks");
  assert.equal(harness.saveCalls, 0);
});

function createDetailHarness(confirmResult = false) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const state = baseState({ tasks: [task("task", { title: '<img src=x onerror="alert(1)">' })] });
  let confirmText = null;
  let deleteCalls = 0;
  let toastTitle = null;
  const context = {
    document, state, Date, String,
    eventDetailTaskId: null,
    window: { confirm(text) { confirmText = text; return confirmResult; } },
    els: {
      eventSheet: document.querySelector("#eventSheet"),
      eventSheetType: document.querySelector("#eventSheetType"),
      eventSheetTitle: document.querySelector("#eventSheetTitle"),
      eventSheetMeta: document.querySelector("#eventSheetMeta"),
      eventSheetDescription: document.querySelector("#eventSheetDescription"),
      eventSheetDeleteButton: document.querySelector("#eventSheetDeleteButton"),
    },
    formatDateTime(value) { return String(value); },
    formatDuration() { return "1 小时"; },
    deleteTaskById() { deleteCalls += 1; return { ok: true }; },
    showReminderToast(title) { toastTitle = title; },
  };
  context.document.body.classList.remove("has-event-sheet");
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(detailStart, detailEnd)}\nthis.api = { showEventDetail, hideEventDetail, confirmDeleteEventTask };`, context);
  return {
    state, document, api: context.api, els: context.els,
    get confirmText() { return confirmText; },
    get deleteCalls() { return deleteCalls; },
    get toastTitle() { return toastTitle; },
  };
}

test("task detail uses a safe confirmation string and cancellation changes nothing", () => {
  const harness = createDetailHarness(false);
  const before = structuredClone(harness.state);
  harness.api.showEventDetail({ ...harness.state.tasks[0], type: "task" });
  assert.equal(harness.els.eventSheetDeleteButton.hidden, false);
  assert.equal(harness.els.eventSheetTitle.querySelector("img"), null);
  assert.equal(harness.api.confirmDeleteEventTask(), false);
  assert.match(harness.confirmText, /^确定删除任务“<img src=x onerror="alert\(1\)">”吗？/);
  assert.equal(harness.deleteCalls, 0);
  assert.deepEqual(harness.state, before);
});

test("confirmed task deletion closes the detail sheet and shows success feedback", () => {
  const harness = createDetailHarness(true);
  harness.api.showEventDetail({ ...harness.state.tasks[0], type: "task" });
  assert.equal(harness.api.confirmDeleteEventTask(), true);
  assert.equal(harness.deleteCalls, 1);
  assert.equal(harness.els.eventSheet.hidden, true);
  assert.equal(harness.toastTitle, "任务已删除");
});

test("course details never expose the task deletion button", () => {
  const harness = createDetailHarness();
  harness.api.showEventDetail({ id: "course", type: "course", title: "课程", startAt: NOW, endAt: NOW + 1, location: "教室" });
  assert.equal(harness.els.eventSheetDeleteButton.hidden, true);
  assert.equal(harness.api.confirmDeleteEventTask(), false);
  assert.equal(harness.deleteCalls, 0);
});

test("task and DDL text open details while checkbox changes do not", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let detailCalls = 0;
  let toggleCalls = 0;
  const context = {
    document,
    state: baseState({ tasks: [task("one")] }),
    els: {
      taskList: document.querySelector("#taskList"),
      emptyTasks: document.querySelector("#emptyTasks"),
      ddlList: document.querySelector("#ddlList"),
    },
    sortTasks() {},
    getTaskStatus() { return "waiting"; },
    getTaskColor() { return { bg: "#fff", border: "#000", ink: "#000", badge: "#eee" }; },
    formatDateTime(value) { return String(value); },
    formatDuration() { return "1 小时"; },
    showEventDetail() { detailCalls += 1; },
    toggleTask() { toggleCalls += 1; },
    Date,
  };
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(taskRenderStart, taskRenderEnd)}\n${appSource.slice(ddlStart, ddlEnd)}\nrenderTasks(); renderDdl();`, context);
  const taskCheckbox = context.els.taskList.querySelector('input[type="checkbox"]');
  taskCheckbox.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  assert.equal(toggleCalls, 1);
  assert.equal(detailCalls, 0);
  context.els.taskList.querySelector(".task-main").click();
  assert.equal(detailCalls, 1);
  const ddlCheckbox = context.els.ddlList.querySelector('input[type="checkbox"]');
  ddlCheckbox.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  assert.equal(toggleCalls, 2);
  assert.equal(detailCalls, 1);
  context.els.ddlList.querySelector('[role="button"]').click();
  assert.equal(detailCalls, 2);
});

test("task deletion UI is isolated from memo deletion and uses the existing event sheet", () => {
  assert.match(indexSource, /id="eventSheetDeleteButton"[^>]*hidden>删除任务<\/button>/);
  assert.doesNotMatch(appSource, /function deleteMemoById|eventSheetDeleteMemo/);
  assert.match(appSource, /els\.eventSheetDeleteButton\.addEventListener\("click", confirmDeleteEventTask\)/);
});
