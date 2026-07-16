const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const helperStart = appSource.indexOf("function normalizeDeletionMap");
const helperEnd = appSource.indexOf("function normalizeState", helperStart);
const deletionStart = appSource.indexOf("function deleteMemoById");
const deletionEnd = appSource.indexOf("function showMemoEditor", deletionStart);
const editorStart = deletionEnd;
const editorEnd = appSource.indexOf("function toggleMemo", editorStart);
const exportStart = appSource.indexOf("function getMemoExportCandidates");
const exportEnd = appSource.indexOf("function renderMemoExportSheet", exportStart);
const feedStart = appSource.indexOf("function formatFeedItem");
const feedEnd = appSource.indexOf("async function exportBackup", feedStart);
const mergeStart = appSource.indexOf("function mergeById");
const mergeEnd = appSource.indexOf("function scheduleCloudSync", mergeStart);

for (const [start, end, label] of [
  [helperStart, helperEnd, "deletion registry helpers"],
  [deletionStart, deletionEnd, "memo deletion helper"],
  [editorStart, editorEnd, "memo editor helpers"],
  [exportStart, exportEnd, "memo export candidates"],
  [feedStart, feedEnd, "focus feed helpers"],
  [mergeStart, mergeEnd, "sync merge helpers"],
]) assert.ok(start >= 0 && end > start, `${label} should exist`);

const NOW = new Date(2026, 6, 17, 15, 0, 0, 0).getTime();

function memo(id, overrides = {}) {
  return {
    id,
    title: `备忘-${id}`,
    tag: "其他",
    body: `正文-${id}`,
    done: false,
    createdAt: NOW - 1000,
    ...overrides,
  };
}

function task(id) {
  return { id, title: `任务-${id}`, done: false, startAt: NOW, endAt: NOW + 1000 };
}

function baseState(overrides = {}) {
  return {
    syncUpdatedAt: 0,
    tasks: [],
    courses: [],
    memos: [],
    memoTags: ["其他", "灵感"],
    selectedMemoTag: "全部",
    feedSources: { memos: true, tasks: false, quotes: false },
    quotes: [],
    dailyPlans: {},
    focusSessions: [],
    focusByDate: {},
    flames: 0,
    flameLedger: [],
    transactions: [],
    deletions: { version: 1, tasks: {}, memos: {} },
    ownedSkins: [], ownedFlowers: [], ownedThemes: [],
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDataHarness(state, { saveMode = "success", selectedIds = [], selectedTags = ["其他", "灵感"], exportOpen = false } = {}) {
  let saveCalls = 0;
  let memoRenderCalls = 0;
  let exportRenderCalls = 0;
  const focusFeed = { textContent: "" };
  const context = {
    state,
    console: { error() {} },
    Number, String, Object, Array, Set, Map, Math, structuredClone,
    els: { memoExportSheet: { hidden: !exportOpen }, focusFeed },
    saveState() {
      saveCalls += 1;
      if (saveMode === "throw") throw new Error("storage failed");
      return saveMode !== "false";
    },
    renderMemos() { memoRenderCalls += 1; },
    renderMemoExportSheet() { exportRenderCalls += 1; },
    getTodayOpenTasks() { return []; },
  };
  vm.createContext(context);
  vm.runInContext(`
    let memoExportIds = new Set(${JSON.stringify(selectedIds)});
    let memoExportTags = new Set(${JSON.stringify(selectedTags)});
    let feedIndex = 0;
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(deletionStart, deletionEnd)}
    ${appSource.slice(exportStart, exportEnd)}
    ${appSource.slice(feedStart, feedEnd)}
    this.api = {
      deleteMemoById,
      getMemoExportCandidates,
      renderFocusFeed,
      get selectedIds() { return [...memoExportIds]; }
    };
  `, context);
  return {
    state,
    api: context.api,
    focusFeed,
    get saveCalls() { return saveCalls; },
    get memoRenderCalls() { return memoRenderCalls; },
    get exportRenderCalls() { return exportRenderCalls; },
  };
}

test("single memo deletion writes a tombstone, removes only the target and saves once", () => {
  const keep = memo("keep", { done: true, updatedAt: 123 });
  const remove = memo("remove");
  const state = baseState({ memos: [keep, remove] });
  const keepBefore = structuredClone(keep);
  const harness = createDataHarness(state, { selectedIds: ["keep", "remove"] });
  const result = harness.api.deleteMemoById("remove", NOW);
  assert.deepEqual(plain(result), { ok: true, reason: null, deletedId: "remove" });
  assert.deepEqual(state.memos, [keepBefore]);
  assert.deepEqual(plain(state.deletions.memos.remove), { deletedAt: NOW });
  assert.equal(harness.saveCalls, 1);
  assert.equal(harness.memoRenderCalls, 1);
  assert.deepEqual(plain(harness.api.selectedIds), ["keep"]);
});

test("invalid ids, invalid time, missing ids and repeated deletion are safe no-ops", () => {
  const state = baseState({ memos: [memo("keep")] });
  const before = structuredClone(state);
  const harness = createDataHarness(state);
  assert.equal(harness.api.deleteMemoById("", NOW).reason, "invalid-memo-id");
  assert.equal(harness.api.deleteMemoById("constructor", NOW).reason, "invalid-memo-id");
  assert.equal(harness.api.deleteMemoById("keep", NaN).reason, "invalid-deleted-at");
  assert.equal(harness.api.deleteMemoById("missing", NOW).reason, "memo-not-found");
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(state, before);
  assert.equal(harness.api.deleteMemoById("keep", NOW).ok, true);
  assert.equal(harness.api.deleteMemoById("keep", NOW + 1).reason, "memo-not-found");
  assert.equal(harness.saveCalls, 1);
});

test("old states without deletions can delete and newer tombstones never move backward", () => {
  const state = baseState({ memos: [memo("old")] });
  delete state.deletions;
  const harness = createDataHarness(state);
  assert.equal(harness.api.deleteMemoById("old", NOW).ok, true);
  assert.equal(state.deletions.memos.old.deletedAt, NOW);

  const staleState = baseState({
    memos: [memo("stale")],
    deletions: { version: 1, tasks: {}, memos: { stale: { deletedAt: NOW + 5000 } } },
  });
  createDataHarness(staleState).api.deleteMemoById("stale", NOW);
  assert.equal(staleState.deletions.memos.stale.deletedAt, NOW + 5000);
});

test("memo deletion leaves tasks, plans, courses, focus history and statistics unchanged", () => {
  const sharedTask = task("shared");
  const courses = [{ id: "course", title: "课程" }];
  const dailyPlans = { "2026-07-17": { marker: "keep" } };
  const focusSessions = [{ id: "focus", minutes: 25 }];
  const focusByDate = { "2026-07-17": 25 };
  const ledger = [{ id: "flame", amount: 1 }];
  const state = baseState({
    tasks: [sharedTask], courses, dailyPlans, focusSessions, focusByDate, flames: 8,
    flameLedger: ledger, memos: [memo("shared"), memo("other", { done: true, updatedAt: 77 })],
  });
  const snapshots = plain({ tasks: state.tasks, courses, dailyPlans, focusSessions, focusByDate, flames: state.flames, ledger, other: state.memos[1] });
  createDataHarness(state).api.deleteMemoById("shared", NOW);
  assert.deepEqual(plain({
    tasks: state.tasks, courses: state.courses, dailyPlans: state.dailyPlans,
    focusSessions: state.focusSessions, focusByDate: state.focusByDate,
    flames: state.flames, ledger: state.flameLedger, other: state.memos[0],
  }), snapshots);
});

test("save failures roll back memo, tombstone and sync state", () => {
  const state = baseState({ syncUpdatedAt: 42, memos: [memo("retry")] });
  const before = structuredClone(state);
  const harness = createDataHarness(state, { saveMode: "throw" });
  const result = harness.api.deleteMemoById("retry", NOW);
  assert.equal(result.reason, "save-failed");
  assert.equal(harness.saveCalls, 1);
  assert.deepEqual(state, before);
});

test("deleted memos disappear from focus feed and TXT/JSON export candidates", () => {
  const state = baseState({ memos: [memo("gone", { body: "不应出现" }), memo("keep", { body: "保留内容" })] });
  const harness = createDataHarness(state, { selectedIds: ["gone", "keep"] });
  harness.api.deleteMemoById("gone", NOW);
  assert.deepEqual(plain(harness.api.getMemoExportCandidates()).map((item) => item.id), ["keep"]);
  harness.api.renderFocusFeed();
  assert.equal(harness.focusFeed.textContent, "保留内容");
  assert.doesNotMatch(harness.focusFeed.textContent, /不应出现/);
  assert.match(appSource, /exportSelectedMemos[\s\S]*?getMemoExportCandidates\(\)/);
  assert.match(appSource, /exportSelectedMemosJson[\s\S]*?getMemoExportCandidates\(\)/);
});

test("an open export sheet is refreshed after deletion", () => {
  const state = baseState({ memos: [memo("gone")] });
  const harness = createDataHarness(state, { exportOpen: true });
  harness.api.deleteMemoById("gone", NOW);
  assert.equal(harness.exportRenderCalls, 1);
});

test("local memo deletion and remote memo tombstones both prevent resurrection", () => {
  const local = baseState({ memos: [memo("gone")] });
  createDataHarness(local).api.deleteMemoById("gone", NOW);
  const context = { Number, String, Object, Array, Map, Set, structuredClone, state: local };
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(helperStart, helperEnd)}\n${appSource.slice(mergeStart, mergeEnd)}\nthis.merge = mergeSyncedStates; this.cloud = cloudSafeState;`, context);
  const mergedLocalDelete = context.merge(local, baseState({ syncUpdatedAt: 1, memos: [memo("gone")] }));
  assert.deepEqual(plain(mergedLocalDelete.memos), []);

  const remoteDelete = baseState({
    syncUpdatedAt: 2,
    deletions: { version: 1, tasks: {}, memos: { remoteGone: { deletedAt: NOW + 1 } } },
  });
  const mergedRemoteDelete = context.merge(baseState({ memos: [memo("remoteGone")] }), remoteDelete);
  assert.deepEqual(plain(mergedRemoteDelete.memos), []);
  const cloud = context.cloud();
  assert.equal(cloud.deletions.memos.gone.deletedAt, NOW);
});

test("backup export and import paths continue to preserve normalized memo tombstones", () => {
  assert.match(appSource, /const backup = \{[\s\S]*?state,[\s\S]*?\};/);
  assert.match(appSource, /state = restoreTimerState\(\{ \.\.\.defaultState, \.\.\.nextState \}\);[\s\S]*?normalizeState\(\);/);
  assert.match(appSource, /snapshot\.deletions = normalizeDeletionRegistry\(snapshot\.deletions\)/);
});

function createEditorHarness({ confirmResult = true, saveMode = "success", title = "待删除备忘" } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const state = baseState({ memos: [memo("edit", { title, tag: "灵感", body: "旧正文" })] });
  let saveCalls = 0;
  let confirmText = null;
  const toasts = [];
  const context = {
    document, state,
    console: { error() {} },
    Date, Number, String, Object, Array, Set, Math,
    window: { confirm(text) { confirmText = text; return confirmResult; } },
    requestAnimationFrame(callback) { callback(); },
    els: {
      memoEditorSheet: document.querySelector("#memoEditorSheet"),
      memoEditorTitle: document.querySelector("#memoEditorTitle"),
      memoTitle: document.querySelector("#memoTitle"),
      memoTag: { value: "" },
      memoCustomTag: document.querySelector("#memoCustomTag"),
      memoBody: document.querySelector("#memoBody"),
      memoSubmitButton: document.querySelector("#memoSubmitButton"),
      memoCancelEditButton: document.querySelector("#memoCancelEditButton"),
      memoDeleteButton: document.querySelector("#memoDeleteButton"),
      memoExportSheet: document.querySelector("#memoExportSheet"),
    },
    saveState() { saveCalls += 1; return saveMode !== "false"; },
    renderMemos() {}, renderFocusFeed() {}, renderMemoExportSheet() {},
    showReminderToast(titleText, bodyText) { toasts.push([titleText, bodyText]); },
  };
  vm.createContext(context);
  vm.runInContext(`
    let editingMemoId = null;
    let memoExportIds = new Set();
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(deletionStart, deletionEnd)}
    ${appSource.slice(editorStart, editorEnd)}
    this.api = {
      openNewMemoEditor,
      startEditMemo,
      cancelEditMemo,
      confirmDeleteEditingMemo,
      get editingId() { return editingMemoId; }
    };
  `, context);
  return {
    state, document, els: context.els, api: context.api, toasts,
    get saveCalls() { return saveCalls; },
    get confirmText() { return confirmText; },
  };
}

test("new memo mode hides deletion while existing memo edit mode shows it", () => {
  const harness = createEditorHarness();
  harness.api.openNewMemoEditor();
  assert.equal(harness.els.memoDeleteButton.hidden, true);
  assert.equal(harness.api.editingId, null);
  harness.api.startEditMemo(harness.state.memos[0]);
  assert.equal(harness.els.memoDeleteButton.hidden, false);
  assert.equal(harness.api.editingId, "edit");
});

test("cancelling confirmation preserves memo, editor state and form values", () => {
  const harness = createEditorHarness({ confirmResult: false });
  harness.api.startEditMemo(harness.state.memos[0]);
  const before = structuredClone(harness.state);
  assert.equal(harness.api.confirmDeleteEditingMemo(), false);
  assert.deepEqual(harness.state, before);
  assert.equal(harness.api.editingId, "edit");
  assert.equal(harness.els.memoEditorSheet.hidden, false);
  assert.equal(harness.els.memoTitle.value, "待删除备忘");
  assert.equal(harness.saveCalls, 0);
});

test("successful deletion closes the sheet, clears editing state and resets the form", () => {
  const harness = createEditorHarness();
  harness.api.startEditMemo(harness.state.memos[0]);
  assert.equal(harness.api.confirmDeleteEditingMemo(), true);
  assert.equal(harness.state.memos.length, 0);
  assert.equal(harness.api.editingId, null);
  assert.equal(harness.els.memoEditorSheet.hidden, true);
  assert.equal(harness.els.memoTitle.value, "");
  assert.equal(harness.els.memoTag.value, "其他");
  assert.equal(harness.els.memoCustomTag.value, "");
  assert.equal(harness.els.memoBody.value, "");
  assert.equal(harness.els.memoDeleteButton.hidden, true);
  assert.equal(harness.toasts.at(-1)[0], "备忘已删除");
  assert.equal(harness.saveCalls, 1);
  harness.api.openNewMemoEditor();
  assert.equal(harness.els.memoTitle.value, "");
  assert.equal(harness.els.memoBody.value, "");
});

test("failed deletion keeps the editor open for retry and does not create a memo", () => {
  const harness = createEditorHarness({ saveMode: "false" });
  harness.api.startEditMemo(harness.state.memos[0]);
  assert.equal(harness.api.confirmDeleteEditingMemo(), false);
  assert.equal(harness.state.memos.length, 1);
  assert.equal(harness.api.editingId, "edit");
  assert.equal(harness.els.memoEditorSheet.hidden, false);
  assert.equal(harness.els.memoTitle.value, "待删除备忘");
  assert.equal(harness.toasts.at(-1)[0], "删除失败");
  assert.equal(harness.saveCalls, 1);
});

test("HTML-like titles remain plain confirmation text", () => {
  const title = '<img src=x onerror="alert(1)">';
  const harness = createEditorHarness({ confirmResult: false, title });
  harness.api.startEditMemo(harness.state.memos[0]);
  harness.api.confirmDeleteEditingMemo();
  assert.equal(harness.confirmText, `确定删除备忘“${title}”吗？删除后将不再出现在备忘和专注轮播中。`);
  assert.equal(harness.document.querySelector("#memoEditorSheet img"), null);
});

test("rapid repeated confirmed deletion saves only once", () => {
  const harness = createEditorHarness();
  harness.api.startEditMemo(harness.state.memos[0]);
  assert.equal(harness.api.confirmDeleteEditingMemo(), true);
  assert.equal(harness.api.confirmDeleteEditingMemo(), false);
  assert.equal(harness.saveCalls, 1);
});

test("memo deletion UI is confined to the editor sheet", () => {
  assert.match(indexSource, /id="memoDeleteButton"[^>]*hidden>删除备忘<\/button>/);
  assert.doesNotMatch(indexSource, /memo-item[\s\S]*删除备忘/);
  assert.match(appSource, /memoDeleteButton\.addEventListener\("click", confirmDeleteEditingMemo\)/);
});
