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
const start = appSource.indexOf("function habitApi()");
const end = appSource.indexOf("function renderHeatmap()", start);
const TODAY = "2026-07-20";
const NOW = new Date(`${TODAY}T09:00:00`).getTime();

function habit(overrides = {}) {
  return {
    id: "reading", title: "阅读", color: "sage", metricType: "boolean", targetValue: 1,
    unit: "", daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    createdAt: new Date("2026-04-01T09:00:00").getTime(), updatedAt: NOW, archivedAt: null,
    ...overrides,
  };
}

function entry(habitId, dayKey, value = 1) {
  return { id: `${habitId}::${dayKey}`, habitId, dayKey, value, createdAt: NOW, updatedAt: NOW };
}

function createHarness(overrides = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const state = {
    habits: [habit(), habit({ id: "water", title: "喝水" })],
    habitEntries: [entry("reading", TODAY)],
    tasks: [], activitySessions: [], focusSessions: [], focusByDate: {}, flames: 0, dailyPlans: {}, syncUpdatedAt: 0,
    ...overrides,
  };
  let saveCalls = 0;
  const ids = [
    "habitAddButton", "habitStatsFilter", "habitTodayRate", "habitTodayDetail", "habitTodayProgress",
    "habitWeekStrip", "habitWeekRate", "habitWeekDetail", "habitWeekOverview", "habitCurrentStreak",
    "habitLongestStreak", "habitTrendChart", "habitHeatmapScroller", "habitHeatmap", "habitHeatmapRange",
    "habitSelectedDate", "habitCompletionText", "habitCompletionProgress", "habitList", "habitEmpty", "habitStatus",
    "habitEditorSheet", "habitEditorBackdrop", "habitEditorClose", "habitEditorTitle", "habitForm", "habitTitle",
    "habitMetricType", "habitColor", "habitTargetField", "habitTargetValue", "habitUnitField", "habitUnit",
    "habitSubmitButton", "habitArchiveButton",
  ];
  const els = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));
  els.habitDayInputs = [...document.querySelectorAll('input[name="habitDay"]')];
  const context = {
    document, state, Habits, els, selectedHabitDate: TODAY, selectedHabitStatsFilter: "all", editingHabitId: null,
    Number, String, Object, Array, Set, Map, Math, Date, structuredClone,
    crypto: { randomUUID: () => "new-habit" },
    dateKey(value) {
      if (value === undefined) return TODAY;
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    getWeekStart(value) {
      const date = new Date(value);
      const weekday = date.getDay() || 7;
      date.setDate(date.getDate() - weekday + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    },
    getTaskColor: () => ({ bg: "#eee", border: "#aaa", ink: "#222" }),
    saveState() { saveCalls += 1; },
  };
  context.window = context;
  context.globalThis = context;
  context.confirm = () => true;
  vm.createContext(context);
  vm.runInContext(`${appSource.slice(start, end)}; this.api = { renderHabits, selectHabitStatsFilter, get filter() { return selectedHabitStatsFilter; } };`, context);
  return { document, state, els, api: context.api, get saveCalls() { return saveCalls; } };
}

test("habit statistics modules appear in the requested front-page order", () => {
  const view = new DOMParser().parseFromString(indexSource, "text/html").querySelector("#habitView");
  const selectors = ["#habitTodayHeading", "#habitWeekStrip", "#habitWeekHeading", ".habit-streak-grid", "#habitTrendHeading", "#habitHeatmapHeading"];
  const nodes = selectors.map((selector) => view.querySelector(selector));
  assert.ok(nodes.every(Boolean));
  const markers = ["habitTodayHeading", "habitWeekStrip", "habitWeekHeading", "habit-streak-grid", "habitTrendHeading", "habitHeatmapHeading"];
  const positions = markers.map((marker) => indexSource.indexOf(marker));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("render derives today, week, streak and trend statistics without saving", () => {
  const harness = createHarness();
  const before = structuredClone(harness.state);
  harness.api.renderHabits();
  assert.equal(harness.els.habitTodayRate.textContent, "50%");
  assert.equal(harness.els.habitTodayDetail.textContent, "1 / 2 个习惯达标");
  assert.equal(harness.els.habitWeekRate.textContent, "7%");
  assert.equal(harness.els.habitWeekOverview.children.length, 7);
  assert.equal(harness.els.habitTrendChart.children.length, 14);
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(harness.state, before);
});

test("heatmap contains exactly ninety data days and leaves room after the current week", () => {
  const harness = createHarness();
  harness.api.renderHabits();
  assert.equal(harness.els.habitHeatmap.querySelectorAll(".habit-heatmap-cell").length, 90);
  assert.equal(harness.els.habitHeatmap.querySelectorAll(".habit-heatmap-spacer.is-trailing").length, 42);
  const children = [...harness.els.habitHeatmap.children];
  const todayIndex = children.findIndex((item) => item.dataset.dayKey === TODAY);
  assert.ok(todayIndex >= 0 && todayIndex < children.length - 1);
});

test("days with no scheduled habits use an empty heatmap cell", () => {
  const harness = createHarness({ habits: [habit({ daysOfWeek: [1] })], habitEntries: [] });
  harness.api.renderHabits();
  const tuesday = harness.els.habitHeatmap.querySelector('[data-day-key="2026-07-14"]');
  assert.ok(tuesday.classList.contains("is-empty"));
  assert.match(tuesday.getAttribute("aria-label"), /无应打卡习惯/);
});

test("filtering a single habit stays in memory and does not write persistent state", () => {
  const harness = createHarness();
  harness.api.renderHabits();
  assert.deepEqual([...harness.els.habitStatsFilter.querySelectorAll("option")].map((option) => option.textContent), ["全部习惯", "阅读", "喝水"]);
  const before = structuredClone(harness.state);
  harness.api.selectHabitStatsFilter("reading");
  assert.equal(harness.api.filter, "reading");
  assert.equal(harness.els.habitTodayRate.textContent, "100%");
  assert.equal(harness.saveCalls, 0);
  assert.deepEqual(harness.state, before);
});

test("HTML-like habit titles remain plain option and card text", () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const harness = createHarness({ habits: [habit({ title: unsafe })] });
  harness.api.renderHabits();
  assert.match(harness.els.habitStatsFilter.textContent, /<img src=x/);
  assert.equal(harness.document.querySelector("#habitView img"), null);
});

test("habit statistics do not read task, focus, or activity records", () => {
  const harness = createHarness({
    tasks: [{ id: "task", title: "SHOULD_NOT_RENDER" }],
    activitySessions: [{ id: "activity", title: "SHOULD_NOT_RENDER" }],
    focusSessions: [{ id: "focus", title: "SHOULD_NOT_RENDER" }],
  });
  harness.api.renderHabits();
  assert.doesNotMatch(harness.document.querySelector("#habitView").textContent, /SHOULD_NOT_RENDER/);
});

test("mobile habit page scrolls vertically while heatmap can scroll horizontally", () => {
  assert.match(stylesSource, /@media \(max-width: 560px\)[\s\S]*?\.habit-panel \{[\s\S]*?overflow: hidden auto/);
  assert.match(stylesSource, /\.habit-heatmap-scroller \{[\s\S]*?overflow-x: auto/);
  assert.match(stylesSource, /\.habit-heatmap \{[\s\S]*?grid-template-rows: repeat\(7, 13px\)/);
});
