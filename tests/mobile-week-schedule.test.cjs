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
const helperStart = appSource.indexOf("function dailyPlanDayKey");
const helperEnd = appSource.indexOf("function createAdoptedDailyPlan", helperStart);
const renderStart = appSource.indexOf("function renderTimeline");
const renderEnd = appSource.indexOf("function renderDdl", renderStart);
const shiftStart = appSource.indexOf("function shiftWeekSchedule");
const shiftEnd = appSource.indexOf("function shiftStatsWeek", shiftStart);
const gestureStart = appSource.indexOf("let weekMobileDayGesture = null;");
const gestureEnd = appSource.indexOf("let weekHeaderGesture = null;", gestureStart);

assert.ok(helperStart >= 0 && helperEnd > helperStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart);
assert.ok(shiftStart >= 0 && shiftEnd > shiftStart);
assert.ok(gestureStart >= 0 && gestureEnd > gestureStart);

const MONDAY = "2026-07-20";
const TUESDAY = "2026-07-21";
const TODAY = "2026-07-22";
const SUNDAY = "2026-07-26";
const NEXT_MONDAY = "2026-07-27";

function at(dayKey, hour, minute = 0) {
  const value = new Date(`${dayKey}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value.getTime();
}

function adoptedPlan(dayKey, blocks) {
  return {
    version: 2,
    mode: "deadline-sprint",
    dayKey,
    generated_at: at(dayKey, 7),
    adopted_at: at(dayKey, 7, 1),
    window: { startAt: at(dayKey, 7), endAt: at(dayKey, 22), planningStartAt: at(dayKey, 7) },
    focusTargetMinutes: 45,
    priorities: [],
    blocks,
    warnings: [],
  };
}

function sprintBlock(id, taskId, title, startAt, endAt) {
  return {
    id, taskId, title, startAt, endAt,
    minutes: Math.round((endAt - startAt) / 60000),
    planningMode: "deadline-sprint",
    sprintId: `sprint-${id}`,
    deadlineAt: endAt + 3600000,
    sequence: 1,
  };
}

function baseState(overrides = {}) {
  return {
    tasks: [], courses: [], dailyPlans: {}, activitySessions: [],
    focusSessions: [], focusByDate: {}, flames: 0,
    ...overrides,
  };
}

function createHarness({ state = baseState(), selectedWeekDate = MONDAY } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  const context = {
    document,
    state,
    DailyPlanner,
    selectedWeekDate,
    selectedTimelineDate: MONDAY,
    weekShiftInProgress: false,
    weekScrollInitialized: false,
    eventDetailTaskId: null,
    dailyPlanPreview: null,
    Number, String, Object, Array, Set, Map, Math, Date,
    matchMedia() { return { matches: true }; },
    requestAnimationFrame(callback) { callback(); },
    els: {
      weekBoard: document.querySelector("#weekBoard"),
      weekDayHeaders: document.querySelector("#weekDayHeaders"),
      weekRangeTitle: document.querySelector("#weekRangeTitle"),
      weekNavigationStatus: document.querySelector("#weekNavigationStatus"),
      eventSheet: document.querySelector("#eventSheet"),
      eventSheetType: document.querySelector("#eventSheetType"),
      eventSheetTitle: document.querySelector("#eventSheetTitle"),
      eventSheetMeta: document.querySelector("#eventSheetMeta"),
      eventSheetDescription: document.querySelector("#eventSheetDescription"),
      eventSheetDeleteButton: document.querySelector("#eventSheetDeleteButton"),
    },
    dateKey(value) {
      if (value === undefined) return TODAY;
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
    getDayCourses(dayKey) {
      return (state.courses || []).filter((course) => context.dateKey(new Date(course.startAt)) === dayKey);
    },
    getTaskColor() { return { bg: "#eee", border: "#aaa", ink: "#222" }; },
    formatClock(timestamp) {
      const value = new Date(timestamp);
      return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
    },
    formatDateTime(timestamp) { return new Date(timestamp).toLocaleString("zh-CN"); },
    formatDuration(startAt, endAt) { return `${Math.round((endAt - startAt) / 60000)}分钟`; },
    formatMonthDay(value) { return `${value.getMonth() + 1}月${value.getDate()}日`; },
    saveState() { saveCalls += 1; },
    deleteTaskById() { throw new Error("task deletion is out of scope"); },
    showReminderToast() {},
    weekGestureTime(event) { return Number(event.timeStamp); },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(renderStart, renderEnd)}
    ${appSource.slice(shiftStart, shiftEnd)}
    ${appSource.slice(gestureStart, gestureEnd)}
    this.api = {
      renderWeekSchedule,
      getPlannedItemsForDay,
      getMobilePlannedItemStatuses,
      shiftWeekSchedule,
      shiftMobileWeekDay,
      startSwipe: startWeekMobileDayGesture,
      finishSwipe: finishWeekMobileDayGesture,
      cancelSwipe: cancelWeekMobileDayGesture,
      get selectedDay() { return selectedWeekDate; }
    };
  `, context);
  return {
    document, state, els: context.els, api: context.api,
    get saveCalls() { return saveCalls; },
  };
}

function pointer(pointerId, clientX, clientY, timeStamp) {
  return { pointerId, clientX, clientY, timeStamp, isPrimary: true, pointerType: "touch" };
}

function swipe(harness, { startX = 180, startY = 80, endX = 90, endY = 82, duration = 180 } = {}) {
  harness.api.startSwipe(pointer(1, startX, startY, 100));
  return harness.api.finishSwipe(pointer(1, endX, endY, 100 + duration));
}

test("mobile renders seven date capsules with separate today and selected states", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  const headers = harness.els.weekDayHeaders.querySelectorAll("button.week-day-header");
  assert.equal(headers.length, 7);
  assert.equal(harness.els.weekDayHeaders.querySelector(".is-selected").dataset.dayKey, MONDAY);
  assert.equal(harness.els.weekDayHeaders.querySelector(".is-today").dataset.dayKey, TODAY);
  assert.notEqual(harness.els.weekDayHeaders.querySelector(".is-selected"), harness.els.weekDayHeaders.querySelector(".is-today"));
});

test("mobile renders one vertical day list without desktop columns, lanes or summaries", () => {
  const state = baseState({ tasks: [{ id: "task", title: "任务", startAt: at(MONDAY, 9), endAt: at(MONDAY, 10), done: false }] });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.equal(harness.els.weekBoard.querySelectorAll(".week-mobile-day-list").length, 1);
  assert.equal(harness.els.weekBoard.querySelectorAll(".week-column").length, 0);
  assert.equal(harness.els.weekBoard.querySelectorAll(".week-block").length, 0);
  assert.equal(harness.els.weekBoard.querySelectorAll(".is-overlap-summary").length, 0);
});

test("the day list is sorted and labels course, task, planned focus and sprint", () => {
  const balanced = sprintBlock("balanced", "balanced-task", "均衡块", at(MONDAY, 11), at(MONDAY, 11, 25));
  balanced.planningMode = "balanced";
  const sprint = sprintBlock("sprint", "sprint-task", "冲刺块", at(MONDAY, 13), at(MONDAY, 13, 45));
  const state = baseState({
    courses: [{ id: "course", title: "课程", startAt: at(MONDAY, 8), endAt: at(MONDAY, 9) }],
    tasks: [
      { id: "task", title: "任务", startAt: at(MONDAY, 10), endAt: at(MONDAY, 10, 30), done: false },
      { id: "balanced-task" }, { id: "sprint-task" },
    ],
    dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [sprint, balanced]) },
    activitySessions: [{ id: "actual", title: "不应显示的实际记录", status: "completed", startAt: at(MONDAY, 7), endAt: at(MONDAY, 8) }],
  });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  const cards = [...harness.els.weekBoard.querySelectorAll(".week-mobile-plan-card")];
  assert.deepEqual(cards.map((card) => card.querySelector(".week-mobile-plan-time").textContent.slice(0, 5)), ["08:00", "10:00", "11:00", "13:00"]);
  assert.deepEqual(cards.map((card) => card.querySelector(".week-mobile-plan-type").textContent), ["课程", "任务", "计划专注", "截止前冲刺"]);
  assert.doesNotMatch(harness.els.weekBoard.textContent, /不应显示的实际记录/);
});

test("conflict, completed and overdue statuses are deterministic", () => {
  const harness = createHarness();
  const active = { id: "a", type: "task", startAt: 100, endAt: 200, done: true };
  const overlap = { id: "b", type: "course", startAt: 150, endAt: 250 };
  assert.deepEqual(Array.from(harness.api.getMobilePlannedItemStatuses(active, [active, overlap], 300)), ["冲突", "已完成"]);
  const overdue = { id: "c", type: "task", startAt: 100, endAt: 200, done: false };
  assert.deepEqual(Array.from(harness.api.getMobilePlannedItemStatuses(overdue, [overdue], 300)), ["已过期"]);
});

test("clicking a date changes only the in-memory selection and rerenders that day", () => {
  const state = baseState({ tasks: [{ id: "tuesday", title: "周二任务", startAt: at(TUESDAY, 9), endAt: at(TUESDAY, 10), done: false }] });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  harness.els.weekDayHeaders.querySelector(`[data-day-key="${TUESDAY}"]`).click();
  assert.equal(harness.api.selectedDay, TUESDAY);
  assert.match(harness.els.weekBoard.textContent, /周二任务/);
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
});

test("clicking a mobile plan card reuses the existing detail sheet", () => {
  const state = baseState({ tasks: [{ id: "detail", title: "详情任务", startAt: at(MONDAY, 9), endAt: at(MONDAY, 10), done: false }] });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  harness.els.weekBoard.querySelector(".week-mobile-plan-card").click();
  assert.equal(harness.els.eventSheet.hidden, false);
  assert.equal(harness.els.eventSheetTitle.textContent, "详情任务");
  assert.equal(harness.els.eventSheetType.textContent, "Task");
});

test("horizontal day swipes move one day and cross week boundaries", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  assert.equal(swipe(harness), true);
  assert.equal(harness.api.selectedDay, TUESDAY);
  assert.equal(swipe(harness, { startX: 90, endX: 180 }), true);
  assert.equal(harness.api.selectedDay, MONDAY);
  const sunday = createHarness({ selectedWeekDate: SUNDAY });
  sunday.api.renderWeekSchedule();
  assert.equal(swipe(sunday), true);
  assert.equal(sunday.api.selectedDay, NEXT_MONDAY);
  assert.equal(sunday.els.weekDayHeaders.querySelector(".is-selected").dataset.dayKey, NEXT_MONDAY);
});

test("vertical and short movements do not switch the selected day", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  assert.equal(swipe(harness, { endX: 170, endY: 180 }), false);
  assert.equal(harness.api.selectedDay, MONDAY);
  assert.equal(swipe(harness, { endX: 140, endY: 82 }), false);
  assert.equal(harness.api.selectedDay, MONDAY);
});

test("top navigation still shifts a whole week while preserving the weekday", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  assert.equal(harness.api.shiftWeekSchedule(1), true);
  assert.equal(harness.api.selectedDay, NEXT_MONDAY);
  assert.equal(harness.els.weekDayHeaders.querySelector(".is-selected").dataset.dayKey, NEXT_MONDAY);
  assert.match(harness.els.weekNavigationStatus.textContent, /已切换到/);
});

test("HTML-like titles remain text and mobile rendering is read-only", () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const state = baseState({
    tasks: [{ id: "unsafe", title: unsafe, startAt: at(MONDAY, 9), endAt: at(MONDAY, 10), done: false }],
    focusSessions: [{ id: "focus" }], focusByDate: { [MONDAY]: 25 }, flames: 4,
  });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.match(harness.els.weekBoard.textContent, /<img src=x/);
  assert.equal(harness.els.weekBoard.querySelector("img"), null);
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
});

test("mobile CSS removes seven-column horizontal scrolling and supports vertical browsing", () => {
  const mobileRule = stylesSource.slice(stylesSource.indexOf("@media (max-width: 560px)"));
  assert.match(mobileRule, /\.week-day-headers \{[\s\S]*?repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(mobileRule, /\.week-board \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;/);
  assert.match(mobileRule, /\.week-mobile-plan-card \{[\s\S]*?grid-template-columns: 78px minmax\(0, 1fr\)/);
  assert.doesNotMatch(mobileRule, /scroll-snap-type: x proximity/);
});
