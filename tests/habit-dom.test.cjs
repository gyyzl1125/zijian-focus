"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const Habits = require("../habits.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const habitStart = appSource.indexOf("function habitApi()");
const habitEnd = appSource.indexOf("function renderHeatmap()", habitStart);
assert.ok(habitStart >= 0 && habitEnd > habitStart);

const MONDAY = "2026-07-20";
const TUESDAY = "2026-07-21";
const NOW = new Date(`${MONDAY}T09:00:00`).getTime();

function habit(overrides = {}) {
  return {
    id: "habit-1", title: "阅读", color: "sage", metricType: "boolean",
    targetValue: 1, unit: "", daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    createdAt: NOW, updatedAt: NOW, archivedAt: null, ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    id: "habit-1::2026-07-20", habitId: "habit-1", dayKey: MONDAY,
    value: 1, createdAt: NOW, updatedAt: NOW, ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    habits: [], habitEntries: [], syncUpdatedAt: 0,
    tasks: [], activitySessions: [], focusSessions: [], focusByDate: {}, flames: 0, dailyPlans: {},
    ...overrides,
  };
}

function createHarness({ state = baseState(), saveFails = false, confirmResult = true } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  let idCounter = 0;
  const context = {
    document, state, Habits,
    selectedHabitDate: MONDAY,
    selectedHabitStatsFilter: "all",
    editingHabitId: null,
    Number, String, Object, Array, Set, Map, Math, Date,
    structuredClone,
    crypto: { randomUUID() { idCounter += 1; return `created-${idCounter}`; } },
    els: {
      habitPanel: document.querySelector("#habitPanel"),
      habitAddButton: document.querySelector("#habitAddButton"),
      habitOnboarding: document.querySelector("#habitOnboarding"),
      habitOnboardingButton: document.querySelector("#habitOnboardingButton"),
      habitContentSections: [...document.querySelectorAll("[data-habit-content]")],
      habitStatsFilter: document.querySelector("#habitStatsFilter"),
      habitTodayRate: document.querySelector("#habitTodayRate"),
      habitTodayDetail: document.querySelector("#habitTodayDetail"),
      habitTodayProgress: document.querySelector("#habitTodayProgress"),
      habitWeekStrip: document.querySelector("#habitWeekStrip"),
      habitWeekRate: document.querySelector("#habitWeekRate"),
      habitWeekDetail: document.querySelector("#habitWeekDetail"),
      habitWeekOverview: document.querySelector("#habitWeekOverview"),
      habitCurrentStreak: document.querySelector("#habitCurrentStreak"),
      habitLongestStreak: document.querySelector("#habitLongestStreak"),
      habitTrendChart: document.querySelector("#habitTrendChart"),
      habitHeatmapScroller: document.querySelector("#habitHeatmapScroller"),
      habitHeatmap: document.querySelector("#habitHeatmap"),
      habitHeatmapRange: document.querySelector("#habitHeatmapRange"),
      habitSelectedDate: document.querySelector("#habitSelectedDate"),
      habitCompletionText: document.querySelector("#habitCompletionText"),
      habitCompletionProgress: document.querySelector("#habitCompletionProgress"),
      habitList: document.querySelector("#habitList"),
      habitEmpty: document.querySelector("#habitEmpty"),
      habitStatus: document.querySelector("#habitStatus"),
      habitEditorSheet: document.querySelector("#habitEditorSheet"),
      habitEditorBackdrop: document.querySelector("#habitEditorBackdrop"),
      habitEditorClose: document.querySelector("#habitEditorClose"),
      habitEditorTitle: document.querySelector("#habitEditorTitle"),
      habitForm: document.querySelector("#habitForm"),
      habitTitle: document.querySelector("#habitTitle"),
      habitMetricType: document.querySelector("#habitMetricType"),
      habitColor: document.querySelector("#habitColor"),
      habitTargetField: document.querySelector("#habitTargetField"),
      habitTargetValue: document.querySelector("#habitTargetValue"),
      habitUnitField: document.querySelector("#habitUnitField"),
      habitUnit: document.querySelector("#habitUnit"),
      habitIncludeInPlanner: document.querySelector("#habitIncludeInPlanner"),
      habitDayInputs: [...document.querySelectorAll('input[name="habitDay"]')],
      habitSubmitButton: document.querySelector("#habitSubmitButton"),
      habitArchiveButton: document.querySelector("#habitArchiveButton"),
    },
    dateKey(value) {
      if (value === undefined) return MONDAY;
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
    getTaskColor() { return { bg: "#edf7e8", border: "#a7cf97", ink: "#254521" }; },
    saveState() {
      saveCalls += 1;
      if (saveFails) throw new Error("save failed");
      state.syncUpdatedAt = NOW + saveCalls;
    },
  };
  context.globalThis = context;
  context.window = context;
  context.confirm = () => confirmResult;
  vm.createContext(context);
  vm.runInContext(`
    ${appSource.slice(habitStart, habitEnd)}
    this.api = {
      renderHabits, openHabitEditor, closeHabitEditor, saveHabitFromForm,
      archiveEditingHabit, setHabitValue, updateHabitMetricFields,
      selectHabitStatsFilter,
      get selectedDate() { return selectedHabitDate; },
      get editingId() { return editingHabitId; }
    };
  `, context);
  return {
    state, document, els: context.els, api: context.api,
    get saveCalls() { return saveCalls; },
  };
}

function selectMetric(harness, metricType, targetValue, unit) {
  [...harness.els.habitMetricType.querySelectorAll("option")].forEach((option) => {
    if (option.value === metricType) option.setAttribute("selected", "");
    else option.removeAttribute("selected");
  });
  harness.els.habitTargetValue.value = String(targetValue);
  harness.els.habitUnit.value = unit;
  harness.api.updateHabitMetricFields();
}

test("habit page places the weekly date strip before the selected-day list", () => {
  const view = new DOMParser().parseFromString(indexSource, "text/html").querySelector("#habitView");
  const strip = view.querySelector("#habitWeekStrip");
  const list = view.querySelector("#habitList");
  assert.ok(strip && list);
  assert.equal(Boolean(strip.compareDocumentPosition(list) & 4), true);
  assert.match(indexSource, /data-view-target="habits"/);
});

test("render shows seven dates, selected day and a derived completion summary", () => {
  const harness = createHarness({ state: baseState({ habits: [habit()], habitEntries: [entry()] }) });
  harness.api.renderHabits();
  assert.equal(harness.els.habitWeekStrip.querySelectorAll("button").length, 7);
  assert.equal(harness.els.habitWeekStrip.querySelector(".is-selected strong").textContent, "20");
  assert.equal(harness.els.habitCompletionText.textContent, "1 / 1 完成");
  assert.equal(Number(harness.els.habitCompletionProgress.value), 100);
  assert.equal(Object.hasOwn(harness.state.habits[0], "completionRate"), false);
});

test("no active habits show only the compact creation guide", () => {
  const harness = createHarness();
  harness.api.renderHabits();
  assert.equal(harness.els.habitOnboarding.hidden, false);
  assert.equal(harness.els.habitPanel.classList.contains("is-empty-state"), true);
  assert.equal(harness.els.habitContentSections.every((section) => section.hidden), true);
  assert.match(harness.els.habitOnboarding.textContent, /创建第一个习惯/);
});

test("creating a boolean habit saves once and leaves unrelated state unchanged", () => {
  const state = baseState({ tasks: [{ id: "task" }], activitySessions: [{ id: "activity" }], focusSessions: [{ id: "focus" }], focusByDate: { [MONDAY]: 25 }, flames: 3, dailyPlans: { [MONDAY]: { marker: true } } });
  const protectedState = structuredClone({ tasks: state.tasks, activitySessions: state.activitySessions, focusSessions: state.focusSessions, focusByDate: state.focusByDate, flames: state.flames, dailyPlans: state.dailyPlans });
  const harness = createHarness({ state });
  harness.api.openHabitEditor();
  harness.els.habitTitle.value = "早起";
  assert.equal(harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 1), true);
  assert.equal(state.habits.length, 1);
  assert.equal(state.habits[0].metricType, "boolean");
  assert.equal(harness.saveCalls, 1);
  Object.entries(protectedState).forEach(([key, value]) => assert.deepEqual(state[key], value));
});

test("planner inclusion is optional and round-trips through the habit editor", () => {
  const harness = createHarness();
  harness.api.openHabitEditor();
  harness.els.habitTitle.value = "阅读";
  selectMetric(harness, "duration", 60, "分钟");
  harness.els.habitIncludeInPlanner.checked = true;
  harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 1);
  assert.equal(harness.state.habits[0].includeInPlanner, true);
  harness.api.openHabitEditor(harness.state.habits[0]);
  assert.equal(harness.els.habitIncludeInPlanner.checked, true);
});

test("count and duration forms preserve target and unit semantics", () => {
  const harness = createHarness();
  harness.api.openHabitEditor();
  harness.els.habitTitle.value = "喝水";
  selectMetric(harness, "count", 8, "杯");
  harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 1);
  harness.api.openHabitEditor();
  harness.els.habitTitle.value = "运动";
  selectMetric(harness, "duration", 30, "分钟");
  harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 2);
  assert.deepEqual(harness.state.habits.map(({ metricType, targetValue, unit }) => ({ metricType, targetValue, unit })), [
    { metricType: "count", targetValue: 8, unit: "杯" },
    { metricType: "duration", targetValue: 30, unit: "分钟" },
  ]);
});

test("editing loads the existing habit and saves a single updated record", () => {
  const harness = createHarness({ state: baseState({ habits: [habit()] }) });
  harness.api.openHabitEditor(harness.state.habits[0]);
  assert.equal(harness.api.editingId, "habit-1");
  assert.equal(harness.els.habitArchiveButton.hidden, false);
  harness.els.habitTitle.value = "深度阅读";
  harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 1);
  assert.equal(harness.state.habits.length, 1);
  assert.equal(harness.state.habits[0].title, "深度阅读");
  assert.equal(harness.saveCalls, 1);
});

test("archive confirmation can cancel or archive while retaining entries", () => {
  const cancelled = createHarness({ state: baseState({ habits: [habit()], habitEntries: [entry()] }), confirmResult: false });
  cancelled.api.openHabitEditor(cancelled.state.habits[0]);
  assert.equal(cancelled.api.archiveEditingHabit(NOW + 1), false);
  assert.equal(cancelled.saveCalls, 0);
  const confirmed = createHarness({ state: baseState({ habits: [habit()], habitEntries: [entry()] }), confirmResult: true });
  confirmed.api.openHabitEditor(confirmed.state.habits[0]);
  assert.equal(confirmed.api.archiveEditingHabit(NOW + 1), true);
  assert.equal(confirmed.state.habits[0].archivedAt, NOW + 1);
  assert.equal(confirmed.state.habitEntries.length, 1);
  assert.equal(confirmed.saveCalls, 1);
});

test("boolean check-in and cancellation update one entry", () => {
  const harness = createHarness({ state: baseState({ habits: [habit()] }) });
  harness.api.renderHabits();
  harness.els.habitList.querySelector(".habit-check-button").click();
  assert.equal(harness.state.habitEntries.length, 1);
  assert.equal(harness.state.habitEntries[0].value, 1);
  harness.els.habitList.querySelector(".habit-check-button").click();
  assert.equal(harness.state.habitEntries.length, 1);
  assert.equal(harness.state.habitEntries[0].value, 0);
  assert.equal(harness.saveCalls, 2);
});

test("count and duration controls can change numeric values", () => {
  const count = habit({ metricType: "count", targetValue: 3, unit: "杯" });
  const harness = createHarness({ state: baseState({ habits: [count] }) });
  harness.api.renderHabits();
  const increase = [...harness.els.habitList.querySelectorAll(".habit-value-control button")].find((button) => button.textContent === "+");
  increase.click();
  assert.equal(harness.state.habitEntries[0].value, 1);
  const input = harness.els.habitList.querySelector(".habit-value-control input");
  input.value = "5";
  input.dispatchEvent(new harness.document.defaultView.Event("change"));
  assert.equal(harness.state.habitEntries[0].value, 5);
});

test("date selection filters scheduled habits without saving state", () => {
  const state = baseState({ habits: [habit({ id: "monday", title: "周一", daysOfWeek: [1] }), habit({ id: "tuesday", title: "周二", daysOfWeek: [2] })] });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.renderHabits();
  assert.match(harness.els.habitList.textContent, /周一/);
  harness.els.habitWeekStrip.querySelectorAll("button")[1].click();
  assert.equal(harness.api.selectedDate, TUESDAY);
  assert.match(harness.els.habitList.textContent, /周二/);
  assert.doesNotMatch(harness.els.habitList.textContent, /周一/);
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
});

test("HTML-like habit titles are rendered only as text", () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const harness = createHarness({ state: baseState({ habits: [habit({ title: unsafe })] }) });
  harness.api.renderHabits();
  assert.match(harness.els.habitList.textContent, /<img src=x/);
  assert.equal(harness.els.habitList.querySelector("img"), null);
});

test("save failures roll back habit collections and keep the editor available", () => {
  const state = baseState({ habits: [habit()] });
  const before = structuredClone(state);
  const harness = createHarness({ state, saveFails: true });
  harness.api.openHabitEditor(state.habits[0]);
  harness.els.habitTitle.value = "不会保存";
  assert.equal(harness.api.saveHabitFromForm({ preventDefault() {} }, NOW + 1), false);
  assert.deepEqual(state, before);
  assert.equal(harness.els.habitEditorSheet.hidden, false);
  assert.match(harness.els.habitStatus.textContent, /保存失败/);
});

test("habit mobile layout keeps the week strip readable and list vertically scrollable", () => {
  assert.match(stylesSource, /\.habit-week-strip \{[\s\S]*?repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(stylesSource, /@media \(max-width: 560px\)[\s\S]*?\.habit-panel \{[\s\S]*?overflow: hidden auto;/);
  assert.match(stylesSource, /\.habit-list \{[\s\S]*?overflow: visible;/);
});

test("numeric habits show partial progress and an explicit target state", () => {
  const countHabit = habit({ metricType: "count", targetValue: 5, unit: "次" });
  const partial = createHarness({ state: baseState({ habits: [countHabit], habitEntries: [entry({ value: 2 })] }) });
  partial.api.renderHabits();
  assert.match(partial.els.habitList.textContent, /已完成 2\/5 次/);
  const complete = createHarness({ state: baseState({ habits: [countHabit], habitEntries: [entry({ value: 5 })] }) });
  complete.api.renderHabits();
  assert.match(complete.els.habitList.textContent, /已达标/);
});
