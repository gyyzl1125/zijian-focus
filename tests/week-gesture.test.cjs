const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const gestureStart = appSource.indexOf("let weekHeaderGesture = null;");
const gestureEnd = appSource.indexOf("let statsTouchStartX = null;", gestureStart);
assert.ok(gestureStart >= 0 && gestureEnd > gestureStart, "week header gesture helpers should exist");
const gestureSource = appSource.slice(gestureStart, gestureEnd);

function createHarness() {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const shifts = [];
  const context = {
    document,
    Date,
    Number,
    Math,
    globalThis: null,
    els: { weekDayHeaders: document.querySelector("#weekDayHeaders") },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    let weekShiftInProgress = false;
    const shifts = [];
    function shiftWeekSchedule(direction) {
      if (weekShiftInProgress) return false;
      weekShiftInProgress = true;
      shifts.push(direction);
      return true;
    }
    function isMobileWeekSchedule() { return false; }
    ${gestureSource}
    this.api = {
      start: startWeekHeaderGesture,
      move: moveWeekHeaderGesture,
      finish: finishWeekHeaderGesture,
      cancel: cancelWeekHeaderGesture,
      unlock() { weekShiftInProgress = false; },
      get shifts() { return shifts.slice(); }
    };
  `, context);
  return { api: context.api, header: context.els.weekDayHeaders, shifts };
}

function pointer(pointerId, clientX, clientY, timeStamp, extra = {}) {
  return { pointerId, clientX, clientY, timeStamp, isPrimary: true, pointerType: "touch", ...extra };
}

function swipe(harness, { startX = 160, startY = 20, endX = 80, endY = 22, duration = 180 } = {}) {
  harness.api.start(pointer(1, startX, startY, 100));
  harness.api.move(pointer(1, endX, endY, 100 + duration / 2));
  return harness.api.finish(pointer(1, endX, endY, 100 + duration));
}

function recordedShifts(harness) {
  return Array.from(harness.api.shifts);
}

test("the date header is a distinct gesture region outside the content scroller", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const headers = document.querySelector("#weekDayHeaders");
  const board = document.querySelector("#weekBoard");
  assert.ok(headers && board);
  assert.notEqual(headers, board);
  assert.equal(headers.parentElement, board.parentElement);
});

test("left swipe on the date header switches to the next week", () => {
  const harness = createHarness();
  assert.equal(swipe(harness), true);
  assert.deepEqual(recordedShifts(harness), [1]);
});

test("right swipe on the date header switches to the previous week", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { startX: 80, endX: 150 }), true);
  assert.deepEqual(recordedShifts(harness), [-1]);
});

test("vertical movement in the date header does not switch weeks", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { endX: 145, endY: 120 }), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("horizontal movement below fifty pixels does not switch weeks", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { endX: 115 }), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("diagonal movement dominated by the vertical axis does not switch weeks", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { endX: 100, endY: 90 }), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("slow gestures over six hundred milliseconds do not switch weeks", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { duration: 601 }), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("a tap on the date header does not switch weeks", () => {
  const harness = createHarness();
  assert.equal(swipe(harness, { endX: 160, endY: 20, duration: 80 }), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("one pointer gesture can switch at most one week", () => {
  const harness = createHarness();
  swipe(harness);
  assert.equal(harness.api.finish(pointer(1, 20, 20, 400)), false);
  assert.deepEqual(recordedShifts(harness), [1]);
});

test("a second swipe is ignored while a week switch is still rendering", () => {
  const harness = createHarness();
  swipe(harness);
  swipe(harness, { startX: 160, endX: 70 });
  assert.deepEqual(recordedShifts(harness), [1]);
});

test("pointer cancellation clears gesture state without switching", () => {
  const harness = createHarness();
  harness.api.start(pointer(4, 160, 20, 100));
  harness.api.move(pointer(4, 70, 20, 150));
  harness.api.cancel(pointer(4, 70, 20, 160));
  assert.equal(harness.api.finish(pointer(4, 70, 20, 170)), false);
  assert.deepEqual(recordedShifts(harness), []);
});

test("the content region owns mobile day swipes while the header keeps desktop week gestures", () => {
  assert.match(appSource, /weekBoard\?\.addEventListener\("pointerdown", startWeekMobileDayGesture/);
  assert.match(appSource, /weekBoard\?\.addEventListener\("pointerup", finishWeekMobileDayGesture/);
  assert.match(appSource, /weekDayHeaders\?\.addEventListener\("pointerdown"/);
  assert.match(appSource, /weekDayHeaders\?\.addEventListener\("pointerup"/);
});

test("mobile content scrolls vertically and no longer uses horizontal seven-column snapping", () => {
  const mobileRule = stylesSource.slice(stylesSource.indexOf("@media (max-width: 560px)"));
  assert.match(mobileRule, /\.week-board \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;/);
  assert.match(mobileRule, /\.week-board \{[\s\S]*?touch-action: pan-y;/);
  assert.doesNotMatch(mobileRule, /scroll-snap-type: x proximity;/);
});

test("header gesture detection never prevents default scrolling or clicking", () => {
  assert.doesNotMatch(gestureSource, /preventDefault\s*\(/);
  assert.match(stylesSource, /\.week-day-headers \{[\s\S]*?touch-action: pan-y;/);
});

test("top arrow controls remain labelled and call the same bounded shift function", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  assert.equal(document.querySelector("#prevWeekButton").getAttribute("aria-label"), "上一周");
  assert.equal(document.querySelector("#nextWeekButton").getAttribute("aria-label"), "下一周");
  assert.match(appSource, /prevWeekButton\.addEventListener\("click", \(\) => \{\s*shiftWeekSchedule\(-1\)/);
  assert.match(appSource, /nextWeekButton\.addEventListener\("click", \(\) => \{\s*shiftWeekSchedule\(1\)/);
});

test("week gestures and rendering remain read-only", () => {
  assert.doesNotMatch(gestureSource, /saveState\s*\(|state\.|dailyPlans|focusSessions|focusByDate|flames/);
});
