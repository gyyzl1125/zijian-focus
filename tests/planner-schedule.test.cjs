const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");
const ActivitySessions = require("../activity-sessions.js");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const helperStart = appSource.indexOf("function dailyPlanDayKey");
const helperEnd = appSource.indexOf("function createAdoptedDailyPlan", helperStart);
const renderStart = appSource.indexOf("function renderTimeline");
const renderEnd = appSource.indexOf("function renderDdl", renderStart);
const activityRenderStart = appSource.indexOf("function getActivitySessionsForTimelineDay");
assert.ok(helperStart >= 0 && helperEnd > helperStart, "adopted plan display helpers should exist");
assert.ok(activityRenderStart >= 0 && renderStart > activityRenderStart && renderEnd > renderStart, "schedule renderers should exist");

const MONDAY = "2026-07-20";
const TUESDAY = "2026-07-21";

function at(dayKey, hour, minute = 0, dayOffset = 0) {
  const value = new Date(`${dayKey}T00:00:00`);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, minute, 0, 0);
  return value.getTime();
}

function block(id, taskId, title, startAt, endAt, overrides = {}) {
  return {
    id, taskId, title, startAt, endAt,
    minutes: Math.max(1, Math.round((endAt - startAt) / 60000)),
    ...overrides,
  };
}

function adoptedPlan(dayKey, blocks, overrides = {}) {
  return {
    version: 1,
    dayKey,
    generated_at: at(dayKey, 7),
    adopted_at: at(dayKey, 7, 5),
    window: { startAt: at(dayKey, 7), endAt: at(dayKey, 22), planningStartAt: at(dayKey, 7, 5) },
    focusTargetMinutes: 25,
    priorities: [],
    blocks,
    warnings: [],
    ...overrides,
  };
}

function baseState(overrides = {}) {
  return {
    tasks: [], courses: [], activitySessions: [], activeActivitySessionId: null,
    focusSessions: [], focusByDate: {}, flames: 0,
    dailyPlans: {},
    ...overrides,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness({ state = baseState(), timelineDay = MONDAY, weekDay = MONDAY, preview = null } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  const context = {
    document,
    state,
    dailyPlanPreview: preview,
    selectedTimelineDate: timelineDay,
    selectedWeekDate: weekDay,
    eventDetailTaskId: null,
    Number, String, Object, Array, Set, Map, Math, Date, Error,
    ActivitySessions,
    crypto: { randomUUID() { return "unused-activity"; } },
    confirm() { return false; },
    console: { error() {} },
    els: {
      weekStrip: document.querySelector("#weekStrip"),
      timelineDateTitle: document.querySelector("#timelineDateTitle"),
      timelineStats: document.querySelector("#timelineStats"),
      timelineList: document.querySelector("#timelineList"),
      timelineTaskSelect: document.querySelector("#timelineTaskSelect"),
      timelineStartButton: document.querySelector("#timelineStartButton"),
      timelineTaskEmpty: document.querySelector("#timelineTaskEmpty"),
      timelineRunningCard: document.querySelector("#timelineRunningCard"),
      timelineRunningTitle: document.querySelector("#timelineRunningTitle"),
      timelineRunningStarted: document.querySelector("#timelineRunningStarted"),
      timelineRunningElapsed: document.querySelector("#timelineRunningElapsed"),
      timelineEndButton: document.querySelector("#timelineEndButton"),
      timelineActivityStatus: document.querySelector("#timelineActivityStatus"),
      weekBoard: document.querySelector("#weekBoard"),
      weekRangeTitle: document.querySelector("#weekRangeTitle"),
      eventSheet: document.querySelector("#eventSheet"),
      eventSheetType: document.querySelector("#eventSheetType"),
      eventSheetTitle: document.querySelector("#eventSheetTitle"),
      eventSheetMeta: document.querySelector("#eventSheetMeta"),
      eventSheetDescription: document.querySelector("#eventSheetDescription"),
      eventSheetDeleteButton: document.querySelector("#eventSheetDeleteButton"),
    },
    saveState() { saveCalls += 1; },
    deleteTaskById() { throw new Error("task deletion must not run"); },
    showReminderToast() {},
    dateKey(value = new Date()) {
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
      const endAt = new Date(`${dayKey}T00:00:00`);
      endAt.setDate(endAt.getDate() + 1);
      return (state.courses || []).filter((course) => course.startAt < endAt.getTime() && course.endAt > startAt);
    },
    getTaskStatus(item) { return item.done ? "done" : "waiting"; },
    getTaskColor(id) {
      const colors = {
        sky: { bg: "#eaf5ff", border: "#9ecbf2", ink: "#193d5c" },
        lemon: { bg: "#fff9d8", border: "#e4cf65", ink: "#54480d" },
        lavender: { bg: "#f2edff", border: "#b8a5ef", ink: "#3e2d69" },
        sage: { bg: "#edf7e8", border: "#a7cf97", ink: "#254521" },
      };
      return colors[id] || colors.sage;
    },
    formatClock(timestamp) {
      const value = new Date(timestamp);
      return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
    },
    formatDateTime(timestamp) { return new Date(timestamp).toLocaleString("zh-CN"); },
    formatDuration(startAt, endAt) { return `${Math.max(1, Math.round((endAt - startAt) / 60000))}分钟`; },
    formatMonthDay(value) { return `${value.getMonth() + 1}.${value.getDate()}`; },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    ${appSource.slice(helperStart, helperEnd)}
    ${appSource.slice(activityRenderStart, renderStart)}
    ${appSource.slice(renderStart, renderEnd)}
    this.api = {
      getBlocks: getAdoptedFocusBlocksForDay,
      renderTimeline,
      renderWeekSchedule,
      showEventDetail,
      get eventTaskId() { return eventDetailTaskId; }
    };
  `, context);
  return {
    state, document, els: context.els, api: context.api,
    get saveCalls() { return saveCalls; },
  };
}

test("adopted focus blocks stay out of the actual timeline and remain in the week schedule", () => {
  const scheduled = block("plan-1", "task-1", "写报告", at(MONDAY, 10), at(MONDAY, 10, 25));
  const harness = createHarness({
    state: baseState({ tasks: [{ id: "task-1", title: "写报告", startAt: at(MONDAY, 9), endAt: at(MONDAY, 18) }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [scheduled]) } }),
  });
  harness.api.renderTimeline();
  assert.equal(harness.document.querySelector(".timeline-task-card.is-planned-focus"), null);
  harness.api.renderWeekSchedule();
  const card = harness.document.querySelector(".week-block.is-planned-focus");
  assert.ok(card);
  assert.match(card.textContent, /写报告/);
});

test("in-memory previews and plans without adopted_at never render", () => {
  const previewBlock = block("preview", "task-1", "只在预览", at(MONDAY, 10), at(MONDAY, 10, 25));
  const draft = adoptedPlan(MONDAY, [previewBlock]);
  delete draft.adopted_at;
  const harness = createHarness({
    state: baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: draft } }),
    preview: adoptedPlan(MONDAY, [previewBlock]),
  });
  harness.api.renderTimeline();
  harness.api.renderWeekSchedule();
  assert.equal(harness.document.querySelectorAll(".is-planned-focus").length, 0);
  const helperSource = appSource.slice(helperStart, helperEnd);
  assert.doesNotMatch(helperSource, /dailyPlanPreview/);
});

test("week schedule places adopted blocks on the correct day and time", () => {
  const scheduled = block("plan-2", "task-2", "阅读", at(TUESDAY, 10), at(TUESDAY, 10, 30));
  const harness = createHarness({ state: baseState({ tasks: [{ id: "task-2" }], dailyPlans: { [TUESDAY]: adoptedPlan(TUESDAY, [scheduled]) } }) });
  harness.api.renderWeekSchedule();
  const mondayColumn = harness.els.weekBoard.children[0];
  const tuesdayColumn = harness.els.weekBoard.children[1];
  assert.equal(mondayColumn.querySelector(".is-planned-focus"), null);
  const card = tuesdayColumn.querySelector(".is-planned-focus");
  assert.ok(card);
  assert.equal(card.style.getPropertyValue("--event-top"), "20%");
  assert.equal(card.style.getPropertyValue("--event-height"), "3.3333333333333335%");
  assert.match(card.textContent, /10:00阅读计划专注/);
});

test("cross-midnight blocks are clipped and rendered once on both days", () => {
  const crossing = block("cross", "task-cross", "跨夜整理", at(MONDAY, 21, 30), at(TUESDAY, 0, 30));
  const state = baseState({ tasks: [{ id: "task-cross" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [crossing]) } });
  const harness = createHarness({ state });
  assert.deepEqual(plain(harness.api.getBlocks(MONDAY)).map(({ startAt, endAt }) => ({ startAt, endAt })), [
    { startAt: at(MONDAY, 21, 30), endAt: at(TUESDAY, 0) },
  ]);
  assert.deepEqual(plain(harness.api.getBlocks(TUESDAY)).map(({ startAt, endAt }) => ({ startAt, endAt })), [
    { startAt: at(TUESDAY, 0), endAt: at(TUESDAY, 0, 30) },
  ]);
  harness.api.renderWeekSchedule();
  const mondayCard = harness.els.weekBoard.children[0].querySelector(".is-planned-focus");
  const tuesdayCard = harness.els.weekBoard.children[1].querySelector(".is-planned-focus");
  assert.match(mondayCard.textContent, /21:30/);
  assert.match(tuesdayCard.textContent, /00:00/);
  assert.equal(harness.els.weekBoard.querySelectorAll(".is-planned-focus").length, 2);
});

test("damaged blocks are ignored and duplicate block ids render once", () => {
  const valid = block("same", "task-1", "有效", at(MONDAY, 10), at(MONDAY, 10, 25));
  const duplicate = block("same", "task-1", "重复", at(MONDAY, 11), at(MONDAY, 11, 25));
  const invalid = block("broken", "task-1", "损坏", at(MONDAY, 12), at(MONDAY, 11));
  const missingId = block("", "task-1", "无 ID", at(MONDAY, 13), at(MONDAY, 13, 25));
  const harness = createHarness({ state: baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [valid, duplicate, invalid, missingId]) } }) });
  assert.deepEqual(plain(harness.api.getBlocks(MONDAY)).map((item) => item.title), ["有效"]);
  harness.api.renderWeekSchedule();
  assert.equal(harness.document.querySelectorAll(".week-block.is-planned-focus").length, 1);
});

test("plans with damaged window metadata are ignored safely", () => {
  const scheduled = block("valid-looking", "task-1", "不应展示", at(MONDAY, 10), at(MONDAY, 10, 25));
  const damagedPlan = adoptedPlan(MONDAY, [scheduled], {
    window: { startAt: "broken", endAt: at(MONDAY, 22), planningStartAt: at(MONDAY, 7) },
  });
  const harness = createHarness({ state: baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: damagedPlan } }) });
  assert.doesNotThrow(() => harness.api.renderWeekSchedule());
  assert.equal(harness.document.querySelectorAll(".is-planned-focus").length, 0);
});

test("schedule rendering is read-only and never affects focus history or statistics", () => {
  const state = baseState({
    tasks: [{ id: "task-1" }],
    focusSessions: [{ id: "focus", title: "真实专注", startAt: at(MONDAY, 9), endAt: at(MONDAY, 9, 25), minutes: 25 }],
    focusByDate: { [MONDAY]: 25 }, flames: 8,
    dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("plan", "task-1", "计划块", at(MONDAY, 10), at(MONDAY, 10, 25))]) },
  });
  const before = structuredClone(state);
  const harness = createHarness({ state });
  harness.api.renderTimeline();
  harness.api.renderWeekSchedule();
  assert.deepEqual(state, before);
  assert.equal(harness.saveCalls, 0);
});

test("replaced adopted plans replace old schedule cards on rerender", () => {
  const state = baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("old", "task-1", "旧块", at(MONDAY, 10), at(MONDAY, 10, 25))]) } });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.match(harness.els.weekBoard.textContent, /旧块/);
  state.dailyPlans[MONDAY] = adoptedPlan(MONDAY, [block("new", "task-1", "新块", at(MONDAY, 11), at(MONDAY, 11, 25))]);
  harness.api.renderWeekSchedule();
  assert.doesNotMatch(harness.els.weekBoard.textContent, /旧块/);
  assert.match(harness.els.weekBoard.textContent, /新块/);
});

test("cleaned task references disappear while orphaned legacy blocks remain safe", () => {
  const state = baseState({ dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, []) } });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.equal(harness.document.querySelectorAll(".is-planned-focus").length, 0);

  state.dailyPlans[MONDAY] = adoptedPlan(MONDAY, [block("orphan", "missing-task", "保存的旧标题", at(MONDAY, 10), at(MONDAY, 10, 25))]);
  harness.api.renderWeekSchedule();
  assert.match(harness.els.weekBoard.textContent, /保存的旧标题/);
  assert.match(harness.els.weekBoard.textContent, /原任务已删除/);
});

test("HTML-like block titles render only as text", () => {
  const title = '<img src=x onerror="alert(1)">';
  const state = baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("html", "task-1", title, at(MONDAY, 10), at(MONDAY, 10, 25))]) } });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  assert.equal(harness.document.querySelector("#weekBoard img"), null);
  assert.match(harness.els.weekBoard.textContent, /<img src=x/);
});

test("planned entities stay in the week schedule while the actual timeline remains activity-only", () => {
  const state = baseState({
    tasks: [{ id: "task", title: "普通任务", startAt: at(MONDAY, 8), endAt: at(MONDAY, 8, 30), done: false, color: "sage" }],
    courses: [{ id: "course", title: "课程", startAt: at(MONDAY, 9), endAt: at(MONDAY, 9, 30), color: "sky" }],
    focusSessions: [{ id: "focus", title: "真实专注", startAt: at(MONDAY, 10), endAt: at(MONDAY, 10, 25), minutes: 25 }],
    dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("plan", "task", "计划专注块", at(MONDAY, 11), at(MONDAY, 11, 25))]) },
  });
  const harness = createHarness({ state });
  harness.api.renderTimeline();
  assert.match(harness.els.timelineList.textContent, /还没有实际活动记录/);
  assert.doesNotMatch(harness.els.timelineList.textContent, /普通任务|课程|计划专注块/);
  harness.api.renderWeekSchedule();
  assert.match(harness.els.weekBoard.textContent, /普通任务/);
  assert.match(harness.els.weekBoard.textContent, /课程/);
  assert.match(harness.els.weekBoard.textContent, /计划专注块/);
  assert.equal(state.focusSessions.length, 1);
});

test("planned focus details reuse eventSheet without task deletion actions", () => {
  const state = baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("detail", "task-1", "详情块", at(MONDAY, 10), at(MONDAY, 10, 25))]) } });
  const harness = createHarness({ state });
  harness.api.renderWeekSchedule();
  harness.document.querySelector(".week-block.is-planned-focus").click();
  assert.equal(harness.els.eventSheetType.textContent, "PLAN");
  assert.equal(harness.els.eventSheetTitle.textContent, "详情块");
  assert.match(harness.els.eventSheetDescription.textContent, /来源：今日编排/);
  assert.equal(harness.els.eventSheetDeleteButton.hidden, true);
  assert.equal(harness.api.eventTaskId, null);
  assert.equal(harness.saveCalls, 0);
});

test("a fresh page harness restores planned focus solely from persisted dailyPlans", () => {
  const persisted = baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: adoptedPlan(MONDAY, [block("persisted", "task-1", "已恢复", at(MONDAY, 10), at(MONDAY, 10, 25))]) } });
  const harness = createHarness({ state: JSON.parse(JSON.stringify(persisted)) });
  harness.api.renderWeekSchedule();
  assert.match(harness.els.weekBoard.textContent, /已恢复/);
});

test("version 2 plans render more than three adopted sprint blocks", () => {
  const sprintBlocks = Array.from({ length: 5 }, (_, index) => block(
    `sprint-${index}`,
    "task-1",
    `冲刺 ${index + 1}`,
    at(MONDAY, 8 + index),
    at(MONDAY, 8 + index, 45),
    { planningMode: "deadline-sprint", sprintId: "sprint", deadlineAt: at(TUESDAY, 18), sequence: index + 1 }
  ));
  const plan = adoptedPlan(MONDAY, sprintBlocks, { version: 2, mode: "deadline-sprint", focusTargetMinutes: 45 });
  const harness = createHarness({ state: baseState({ tasks: [{ id: "task-1" }], dailyPlans: { [MONDAY]: plan } }) });
  harness.api.renderWeekSchedule();
  assert.equal(harness.document.querySelectorAll(".week-block.is-planned-focus").length, 5);
});

test("planned week blocks retain mobile overflow safeguards and accessible labels", () => {
  assert.match(stylesSource, /\.week-block \{[\s\S]*?max-width: calc\(100% - 8px\);[\s\S]*?overflow: hidden;/);
  assert.match(stylesSource, /\.week-block\.is-planned-focus/);
  assert.match(stylesSource, /@media[\s\S]*?\.week-block span \{[\s\S]*?overflow: hidden;/);
  assert.match(appSource, /setAttribute\("aria-label", `计划专注/);
});
