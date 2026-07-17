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
const layoutStart = appSource.indexOf("function layoutOverlappingEvents");
const layoutEnd = appSource.indexOf("function weekEventDisplayPriority", layoutStart);
const overflowEnd = appSource.indexOf("function showWeekOverlapSummary", layoutEnd);
const helperStart = appSource.indexOf("function dailyPlanDayKey");
const helperEnd = appSource.indexOf("function createAdoptedDailyPlan", helperStart);
const renderStart = appSource.indexOf("function renderTimeline");
const renderEnd = appSource.indexOf("function renderDdl", renderStart);
assert.ok(layoutStart >= 0 && layoutEnd > layoutStart, "week lane helper should exist");
assert.ok(overflowEnd > layoutEnd, "local overflow helper should exist");
assert.ok(helperStart >= 0 && helperEnd > helperStart, "adopted plan helpers should exist");
assert.ok(renderStart >= 0 && renderEnd > renderStart, "week renderer should exist");

const layoutContext = { Number, String, Object, Array, Math, Set, Map, globalThis: { DailyPlanner } };
vm.createContext(layoutContext);
vm.runInContext(`${appSource.slice(layoutStart, overflowEnd)}; this.layout = layoutOverlappingEvents; this.overflow = buildWeekOverflowDisplay;`, layoutContext);
const layout = layoutContext.layout;
const overflow = layoutContext.overflow;

function event(id, startAt, endAt, type = "task", title = id, extra = {}) {
  return { id, startAt, endAt, type, title, ...extra };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("two overlapping events use different lanes", () => {
  const result = plain(layout([event("a", 0, 20), event("b", 10, 30)]));
  assert.deepEqual(result.map((item) => item.laneIndex), [0, 1]);
  assert.deepEqual(result.map((item) => item.laneCount), [2, 2]);
  assert.notEqual(result[0].leftPercent, result[1].leftPercent);
});

test("three simultaneous events use three lanes", () => {
  const result = plain(layout([event("c", 0, 20), event("a", 0, 20), event("b", 0, 20)]));
  assert.deepEqual(result.map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(result.map((item) => item.laneIndex), [0, 1, 2]);
  assert.ok(result.every((item) => item.laneCount === 3));
});

test("non-overlapping events reuse lane zero", () => {
  const result = plain(layout([event("a", 0, 10), event("b", 20, 30)]));
  assert.deepEqual(result.map((item) => item.laneIndex), [0, 0]);
  assert.ok(result.every((item) => item.laneCount === 1));
});

test("chain overlaps remain one group and safely reuse lanes", () => {
  const result = plain(layout([event("a", 0, 10), event("b", 5, 15), event("c", 10, 20)]));
  assert.equal(new Set(result.map((item) => item.overlapGroupId)).size, 1);
  assert.deepEqual(result.map((item) => item.laneIndex), [0, 1, 0]);
  assert.ok(result.every((item) => item.laneCount === 2));
});

test("touching events are separate groups and never forced side by side", () => {
  const result = plain(layout([event("a", 0, 10), event("b", 10, 20)]));
  assert.notEqual(result[0].overlapGroupId, result[1].overlapGroupId);
  assert.deepEqual(result.map((item) => item.laneIndex), [0, 0]);
});

test("identical intervals sort stably by id", () => {
  const result = plain(layout([event("z", 0, 10), event("a", 0, 10), event("m", 0, 10)]));
  assert.deepEqual(result.map((item) => item.id), ["a", "m", "z"]);
});

test("lane layout never mutates its input", () => {
  const input = [event("b", 5, 15, "task", "<b>任务</b>"), event("a", 0, 10)];
  const before = structuredClone(input);
  layout(input);
  assert.deepEqual(input, before);
  assert.equal(Object.hasOwn(input[0], "laneIndex"), false);
});

test("fixed input produces a byte-for-byte stable result", () => {
  const input = [event("b", 5, 15), event("a", 0, 10), event("c", 10, 20)];
  assert.equal(JSON.stringify(layout(input)), JSON.stringify(layout(structuredClone(input))));
});

test("local lane counts recover after a four-way overlap ends", () => {
  const input = [
    event("long", 0, 120, "course"),
    event("b", 30, 60, "task"),
    event("c", 30, 60, "planned-focus"),
    event("d", 30, 60, "task"),
    event("later", 60, 90, "task"),
  ];
  const result = plain(layout(input));
  assert.equal(result.find((item) => item.id === "long").laneCount, 4);
  assert.equal(result.find((item) => item.id === "later").laneCount, 2);
});

test("overflow summaries cover only the actual over-capacity time slice", () => {
  const laidOut = layout([
    event("long", 0, 120, "course"),
    event("b", 30, 60, "task"),
    event("c", 30, 60, "planned-focus"),
    event("d", 30, 60, "task"),
    event("later", 60, 90, "task"),
  ]);
  const display = plain(overflow(laidOut, 3));
  assert.equal(display.summaries.length, 1);
  assert.equal(display.summaries[0].startAt, 30);
  assert.equal(display.summaries[0].endAt, 60);
  assert.equal(display.summaries[0].events.length, 4);
  const later = display.eventSegments.find((segment) => segment.id === "later");
  assert.equal(later.laneCount, 2);
  const longAfterOverlap = display.eventSegments.find((segment) => segment.id === "long" && segment.startAt === 90);
  assert.equal(longAfterOverlap.endAt, 120);
  assert.equal(longAfterOverlap.laneCount, 1);
  assert.equal(longAfterOverlap.laneIndex, 0);
});

const MONDAY = "2026-07-20";
const TODAY = "2026-07-22";

function at(dayKey, hour, minute = 0) {
  const value = new Date(`${dayKey}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value.getTime();
}

function plannedBlock(id, title, startAt, endAt, extra = {}) {
  return {
    id,
    taskId: "planned-task",
    title,
    startAt,
    endAt,
    minutes: Math.round((endAt - startAt) / 60000),
    ...extra,
  };
}

function adoptedPlan(dayKey, blocks) {
  return {
    version: 2,
    mode: blocks.some((block) => block.planningMode === "deadline-sprint") ? "deadline-sprint" : "balanced",
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

function baseState(overrides = {}) {
  return { tasks: [], courses: [], focusSessions: [], focusByDate: {}, flames: 0, dailyPlans: {}, ...overrides };
}

function createHarness({ state = baseState(), selectedWeekDate = TODAY } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  let scrollCalls = 0;
  const articlePrototype = Object.getPrototypeOf(document.createElement("article"));
  const previousScroll = articlePrototype.scrollIntoView;
  articlePrototype.scrollIntoView = function scrollIntoView(options) {
    scrollCalls += 1;
    this.dataset.scrollInline = String(options?.inline || "");
    const board = this.parentElement;
    const index = [...board.children].indexOf(this);
    board.scrollLeft = Math.max(0, index) * 154;
  };
  const context = {
    document,
    state,
    DailyPlanner,
    matchMedia() { return { matches: false }; },
    globalThis: null,
    selectedTimelineDate: MONDAY,
    selectedWeekDate,
    weekShiftInProgress: false,
    weekScrollInitialized: false,
    eventDetailTaskId: null,
    dailyPlanPreview: null,
    Number, String, Object, Array, Set, Map, Math, Date,
    els: {
      weekStrip: document.querySelector("#weekStrip"),
      timelineDateTitle: document.querySelector("#timelineDateTitle"),
      timelineStats: document.querySelector("#timelineStats"),
      timelineList: document.querySelector("#timelineList"),
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
    saveState() { saveCalls += 1; },
    deleteTaskById() { throw new Error("deletion is out of scope"); },
    showReminderToast() {},
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
      const startAt = new Date(`${dayKey}T00:00:00`).getTime();
      const end = new Date(`${dayKey}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return (state.courses || []).filter((course) => course.startAt < end.getTime() && course.endAt > startAt);
    },
    getTaskStatus(item) { return item.done ? "done" : "waiting"; },
    getTaskColor() { return { bg: "#eee", border: "#aaa", ink: "#222" }; },
    formatClock(timestamp) {
      const value = new Date(timestamp);
      return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
    },
    formatDateTime(timestamp) { return new Date(timestamp).toLocaleString("zh-CN"); },
    formatDuration(startAt, endAt) { return `${Math.round((endAt - startAt) / 60000)}分钟`; },
    formatMonthDay(value) { return `${value.getMonth() + 1}.${value.getDate()}`; },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(renderStart, renderEnd)}
    this.api = { renderWeekSchedule, showEventDetail, showWeekOverlapSummary, syncWeekHeaderScroll };
  `, context);
  return {
    document,
    state,
    els: context.els,
    api: context.api,
    restore() { articlePrototype.scrollIntoView = previousScroll; },
    get saveCalls() { return saveCalls; },
    get scrollCalls() { return scrollCalls; },
  };
}

function overlappingState(title = "计划专注") {
  const startAt = at(TODAY, 10);
  const endAt = at(TODAY, 11);
  const sprint = plannedBlock("plan", title, startAt, endAt, {
    planningMode: "deadline-sprint",
    sprintId: "sprint",
    deadlineAt: at(TODAY, 18),
    sequence: 1,
  });
  return baseState({
    courses: [{ id: "course", title: "课程", startAt, endAt, color: "sky" }],
    tasks: [
      { id: "fixed", title: "固定任务", startAt, endAt, scheduleType: "fixed", done: false },
      { id: "ordinary", title: "普通任务", startAt, endAt, done: false },
    ],
    dailyPlans: { [TODAY]: adoptedPlan(TODAY, [sprint]) },
  });
}

test("more than three concurrent lanes render two priority cards and a summary", () => {
  const harness = createHarness({ state: overlappingState() });
  harness.api.renderWeekSchedule();
  const today = harness.els.weekBoard.querySelector(`[data-day-key="${TODAY}"]`);
  const cards = [...today.querySelectorAll(".week-block")];
  assert.equal(cards.length, 3);
  assert.ok(cards[0].classList.contains("is-course"));
  assert.ok(cards[1].classList.contains("is-task"));
  assert.match(cards[1].textContent, /固定任务/);
  assert.ok(cards[2].classList.contains("is-overlap-summary"));
  assert.match(cards[2].textContent, /\+2 项/);
  harness.restore();
});

test("summary card opens a safe text-only list of every event", () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const harness = createHarness({ state: overlappingState(unsafe) });
  harness.api.renderWeekSchedule();
  harness.document.querySelector(".week-block.is-overlap-summary").click();
  assert.equal(harness.els.eventSheetType.textContent, "SCHEDULE");
  assert.match(harness.els.eventSheetTitle.textContent, /4 项安排/);
  assert.match(harness.els.eventSheetDescription.textContent, /课程/);
  assert.match(harness.els.eventSheetDescription.textContent, /固定任务/);
  assert.match(harness.els.eventSheetDescription.textContent, /计划专注/);
  assert.match(harness.els.eventSheetDescription.textContent, /<img src=x/);
  assert.equal(harness.els.eventSheet.querySelector("img"), null);
  assert.equal(harness.els.eventSheetDeleteButton.hidden, true);
  harness.restore();
});

test("planned focus and an ordinary task occupy distinct horizontal positions", () => {
  const startAt = at(TODAY, 9);
  const endAt = at(TODAY, 10);
  const sprint = plannedBlock("plan", "冲刺", startAt, endAt, {
    planningMode: "deadline-sprint", sprintId: "s", deadlineAt: at(TODAY, 18), sequence: 1,
  });
  const state = baseState({
    tasks: [
      { id: "ordinary", title: "普通任务", startAt, endAt, done: false },
    ],
    dailyPlans: { [TODAY]: adoptedPlan(TODAY, [sprint]) },
  });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  const taskCard = harness.document.querySelector(".week-block.is-task");
  const planCard = harness.document.querySelector(".week-block.is-planned-focus");
  assert.ok(taskCard && planCard);
  assert.notEqual(taskCard.style.getPropertyValue("--event-left"), planCard.style.getPropertyValue("--event-left"));
  assert.match(planCard.textContent, /计划专注 · 冲刺/);
  harness.restore();
});

test("very short events use compact cards and preserve real detail times", () => {
  const startAt = at(TODAY, 12);
  const endAt = at(TODAY, 12, 10);
  const state = baseState({ tasks: [{ id: "short", title: "很短的任务标题", startAt, endAt, done: false }] });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  const card = harness.document.querySelector(".week-block.is-compact");
  assert.ok(card);
  assert.match(card.textContent, /12:00/);
  assert.match(card.textContent, /很短的任务标题/);
  card.click();
  assert.match(harness.els.eventSheetMeta.textContent, /10分钟/);
  harness.restore();
});

test("desktop rendering keeps seven aligned headers and columns", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  assert.equal(harness.els.weekDayHeaders.children.length, 7);
  assert.equal(harness.els.weekBoard.children.length, 7);
  assert.equal(harness.els.weekBoard.querySelectorAll(".week-column").length, 7);
  assert.equal(harness.scrollCalls, 0);
  harness.restore();
});

test("content scrolling keeps the date headers in the same horizontal coordinate system", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  harness.els.weekBoard.scrollLeft = 462;
  harness.api.syncWeekHeaderScroll();
  assert.equal(harness.els.weekDayHeaders.scrollLeft, 462);
  harness.restore();
});

test("ordinary rerender preserves the user's current week scroll position", () => {
  const harness = createHarness();
  harness.api.renderWeekSchedule();
  harness.els.weekBoard.scrollLeft = 308;
  harness.api.syncWeekHeaderScroll();
  harness.api.renderWeekSchedule();
  assert.equal(harness.scrollCalls, 0);
  assert.equal(harness.els.weekBoard.scrollLeft, 308);
  assert.equal(harness.els.weekDayHeaders.scrollLeft, 308);
  harness.restore();
});

test("desktop navigation announces a new week without changing the seven-column layout", () => {
  const nextMonday = "2026-07-27";
  const harness = createHarness({ selectedWeekDate: nextMonday });
  harness.api.renderWeekSchedule({ reposition: true, announce: true });
  assert.equal(harness.els.weekBoard.children.length, 7);
  assert.equal(harness.scrollCalls, 0);
  assert.match(harness.els.weekNavigationStatus.textContent, /已切换到/);
  harness.restore();
});

test("planned focus details remain PLAN and never expose task deletion", () => {
  const startAt = at(TODAY, 14);
  const sprint = plannedBlock("detail", "冲刺详情", startAt, at(TODAY, 14, 45), {
    planningMode: "deadline-sprint", sprintId: "s", deadlineAt: at(TODAY, 18), sequence: 1,
  });
  const state = baseState({ tasks: [{ id: "planned-task" }], dailyPlans: { [TODAY]: adoptedPlan(TODAY, [sprint]) } });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  harness.document.querySelector(".week-block.is-planned-focus").click();
  assert.equal(harness.els.eventSheetType.textContent, "PLAN");
  assert.equal(harness.els.eventSheetDeleteButton.hidden, true);
  harness.restore();
});

test("week rendering is read-only for plans and focus statistics", () => {
  const state = overlappingState();
  state.focusSessions = [{ id: "focus", startAt: at(TODAY, 8), endAt: at(TODAY, 8, 25), minutes: 25 }];
  state.focusByDate = { [TODAY]: 25 };
  state.flames = 6;
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
  harness.restore();
});

test("mobile week CSS uses a seven-day capsule strip and a vertical single-day list", () => {
  const mobileRule = stylesSource.slice(stylesSource.indexOf("@media (max-width: 560px)"));
  assert.match(mobileRule, /\.week-day-headers \{[\s\S]*?grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(mobileRule, /\.week-board \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;/);
  assert.match(mobileRule, /\.week-mobile-day-list \{[\s\S]*?display: grid;/);
  assert.match(mobileRule, /\.week-mobile-plan-card \{[\s\S]*?width: 100%;[\s\S]*?min-width: 0;/);
  assert.doesNotMatch(mobileRule, /scroll-snap-type: x proximity/);
});

test("week cards enforce minimum height and clip compact text", () => {
  assert.match(stylesSource, /\.week-block \{[\s\S]*?min-height: 32px;[\s\S]*?overflow: hidden;/);
  assert.match(stylesSource, /\.week-block\.is-compact span \{ -webkit-line-clamp: 1; \}/);
  assert.match(stylesSource, /\.week-block\.is-compact small \{ display: none; \}/);
});

test("planned focus styling uses a light solid border instead of dashed layers", () => {
  const plannedRule = stylesSource.slice(stylesSource.indexOf(".week-block.is-planned-focus {"), stylesSource.indexOf(".week-block.is-planned-focus::before"));
  assert.match(plannedRule, /border-width: 1px/);
  assert.match(plannedRule, /border-style: solid/);
  assert.doesNotMatch(plannedRule, /dashed|999px/);
});
