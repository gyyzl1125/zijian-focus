"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const Habits = require("../habits.js");
const ActivitySessions = require("../activity-sessions.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const sectionStart = appSource.indexOf("function getProfileOverview");
const sectionEnd = appSource.indexOf("function renderHome", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "profile overview helpers should exist");
const profileSource = appSource.slice(sectionStart, sectionEnd);
const overviewEnd = appSource.indexOf("function getProfileAvatarTheme", sectionStart);
assert.ok(overviewEnd > sectionStart, "profile overview calculation boundary should exist");
const overviewSource = appSource.slice(sectionStart, overviewEnd);

const MONDAY = "2026-07-20";
function at(dayKey, hour = 0, minute = 0) {
  const value = new Date(`${dayKey}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value.getTime();
}

function createHarness() {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const habit = {
    id: "read", title: "阅读", color: "sage", metricType: "duration", targetValue: 30,
    unit: "分钟", includeInPlanner: true, daysOfWeek: [1, 2], createdAt: at("2026-07-01"), updatedAt: at("2026-07-01"), archivedAt: null,
  };
  const state = {
    focusByDate: { "2026-07-19": 20, [MONDAY]: 30, "2026-07-21": 15 },
    habits: [habit],
    habitEntries: [{ id: `read::${MONDAY}`, habitId: "read", dayKey: MONDAY, value: 30, manualValue: 0, createdAt: at(MONDAY), updatedAt: at(MONDAY, 10) }],
    activitySessions: [
      { id: "one", type: "task", taskId: "task-1", title: "写作", color: "sage", startAt: at(MONDAY, 9), endAt: at(MONDAY, 9, 25), minutes: 25, status: "completed", endReason: "manual", note: "", focusSessionId: null, createdAt: at(MONDAY, 9), updatedAt: at(MONDAY, 9, 25) },
      { id: "two", type: "habit", taskId: null, habitId: "read", habitMetricType: "duration", title: "阅读", color: "sage", startAt: at("2026-07-21", 10), endAt: at("2026-07-21", 10, 20), minutes: 20, status: "completed", endReason: "manual", note: "", focusSessionId: null, createdAt: at("2026-07-21", 10), updatedAt: at("2026-07-21", 10, 20) },
    ],
    activeActivitySessionId: null,
    flames: 8,
    profileName: "林间小芽",
    selectedTheme: "tea",
  };
  const context = {
    console,
    state,
    globalThis: null,
    Habits,
    ActivitySessions,
    previewThemeId: null,
    normalizeProfileName(value) { return String(value || "").trim() || "自见用户"; },
    dateKey(value = new Date()) {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    getWeekStart(date) {
      const result = new Date(date);
      const day = result.getDay() || 7;
      result.setDate(result.getDate() - day + 1);
      result.setHours(0, 0, 0, 0);
      return result;
    },
    els: {
      profileTodayFocus: document.querySelector("#profileTodayFocus"),
      profileAvatar: document.querySelector("#profileAvatar"),
      profileNameText: document.querySelector("#profileNameText"),
      profileHabitRate: document.querySelector("#profileHabitRate"),
      profileStreakDays: document.querySelector("#profileStreakDays"),
      profileFlames: document.querySelector("#profileFlames"),
      profileEncouragement: document.querySelector("#profileEncouragement"),
      profileWeekFocus: document.querySelector("#profileWeekFocus"),
      profileWeekHabit: document.querySelector("#profileWeekHabit"),
      profileWeekHabitDetail: document.querySelector("#profileWeekHabitDetail"),
      profileWeekActivity: document.querySelector("#profileWeekActivity"),
      profileWeekActivityDetail: document.querySelector("#profileWeekActivityDetail"),
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${profileSource}; this.api = { getProfileOverview, renderProfileOverview };`, context);
  return { document, state, els: context.els, api: context.api };
}

test("profile uses the requested personal card, 2x3 shortcuts, growth and settings hierarchy", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  assert.ok(document.querySelector(".profile-identity-card"));
  assert.equal(document.querySelectorAll(".profile-today-metrics > div").length, 4);
  const shortcuts = [...document.querySelectorAll(".profile-shortcuts [data-view-target]")].map((item) => item.dataset.viewTarget);
  assert.deepEqual(shortcuts, ["timeline", "week", "ddl", "planner", "tasks", "habits"]);
  assert.equal(document.querySelectorAll(".profile-growth-grid > button").length, 3);
  assert.equal(document.querySelectorAll(".profile-setting-list > button").length, 4);
});

test("existing statistics, screen-time, finance, personalization and sync destinations stay accessible", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const targets = [...document.querySelectorAll('[data-view="profile"] [data-view-target]')].map((item) => item.dataset.viewTarget);
  for (const target of ["stats", "screenTime", "finance", "heatmap", "settings"]) assert.ok(targets.includes(target));
});

test("profile overview derives today and week values without storing duplicate statistics", () => {
  const harness = createHarness();
  const before = JSON.stringify(harness.state);
  const overview = harness.api.getProfileOverview(at(MONDAY, 12));
  assert.equal(overview.todayFocusMinutes, 30);
  assert.equal(overview.todayHabit.rate, 1);
  assert.equal(overview.streak, 2);
  assert.equal(overview.flames, 8);
  assert.equal(overview.weekFocusMinutes, 45);
  assert.equal(overview.weekHabitScheduled, 2);
  assert.equal(overview.weekHabitCompleted, 1);
  assert.equal(overview.weekActivityCount, 2);
  assert.equal(overview.weekActivityMinutes, 45);
  assert.match(overview.encouragement, /习惯都已达标/);
  assert.equal(JSON.stringify(harness.state), before);
  assert.doesNotMatch(overviewSource, /saveState|localStorage|state\.[A-Za-z]+\s*=/);
});

test("rendered profile uses compact summaries instead of duplicate charts", () => {
  const harness = createHarness();
  harness.api.renderProfileOverview(at(MONDAY, 12));
  assert.equal(harness.els.profileTodayFocus.textContent, "30");
  assert.equal(harness.els.profileNameText.textContent, "林间小芽");
  assert.equal(harness.els.profileAvatar.dataset.avatarTheme, "forest");
  assert.equal(harness.els.profileHabitRate.textContent, "100%");
  assert.equal(harness.els.profileStreakDays.textContent, "2");
  assert.equal(harness.els.profileFlames.textContent, "8");
  assert.equal(harness.els.profileWeekFocus.textContent, "45 分钟");
  assert.equal(harness.els.profileWeekHabit.textContent, "50%");
  assert.equal(harness.els.profileWeekActivity.textContent, "2 次");
  assert.equal(harness.document.querySelectorAll('[data-view="profile"] canvas, [data-view="profile"] .habit-heatmap-grid').length, 0);
});

test("mobile-first profile controls share compact spacing, rounded cards and safe minimum heights", () => {
  assert.match(stylesSource, /\.profile-identity-card,[\s\S]*?border-radius: 24px;/);
  assert.match(stylesSource, /\.profile-shortcuts \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(stylesSource, /\.profile-shortcuts button \{[\s\S]*?min-height: 76px;/);
  assert.match(stylesSource, /\.profile-setting-list button \{[\s\S]*?min-height: 64px;/);
});
