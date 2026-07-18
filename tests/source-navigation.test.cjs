"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const sectionStart = appSource.indexOf("function currentDocumentScrollTop");
const sectionEnd = appSource.indexOf("els.startPauseButton", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "source-aware navigation helpers should exist");
const navigationSource = appSource.slice(sectionStart, sectionEnd);

function createHarness({ scrollTop = 240 } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const scrollCalls = [];
  const historyCalls = [];
  const plannerScrollCalls = [];
  const window = {
    scrollY: scrollTop,
    location: { href: "https://app.local/" },
    history: { pushState(...args) { historyCalls.push(args); } },
    requestAnimationFrame(callback) { callback(); },
    scrollTo(options) { scrollCalls.push(options); },
  };
  const dailyPlanCard = document.querySelector("#dailyPlanCard");
  dailyPlanCard.scrollIntoView = (options) => plannerScrollCalls.push(options);
  const context = {
    console,
    document,
    window,
    PROFILE_RETURN_DESTINATIONS: new Set(["timeline", "week", "ddl", "planner", "tasks", "habits"]),
    navigationSource: null,
    navigationDestination: null,
    profileScrollTop: 0,
    profileHistoryArmed: false,
    activeView: "profile",
    els: {
      sourceBackButton: document.querySelector("#sourceBackButton"),
      views: [...document.querySelectorAll(".app-view")],
      navButtons: [...document.querySelectorAll(".nav-button, [data-view-target]")],
      dailyPlanCard,
    },
    renderTimeline() {}, renderWeekSchedule() {}, renderDdl() {}, renderMemos() {},
    renderHabits() {}, renderThemes() {}, loadUsageStats() {}, refreshPaymentAccess() {}, renderHome() {},
  };
  vm.createContext(context);
  vm.runInContext(`${navigationSource}; this.api = {
    setActiveView,
    returnToProfile,
    handleSourceAwareBack,
    get activeView() { return activeView; },
    get source() { return navigationSource; },
    get destination() { return navigationDestination; },
    get historyArmed() { return profileHistoryArmed; }
  };`, context);
  return { context, document, window, api: context.api, scrollCalls, historyCalls, plannerScrollCalls };
}

test("profile exposes the six requested source-aware destinations", () => {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  const targets = [...document.querySelectorAll('[data-view="profile"] [data-view-target]')]
    .map((button) => button.dataset.viewTarget);
  for (const target of ["timeline", "week", "ddl", "planner", "tasks", "habits"]) {
    assert.ok(targets.includes(target), `profile should link to ${target}`);
  }
});

test("a profile shortcut shows one accessible return control and returns to profile", () => {
  const harness = createHarness();
  harness.api.setActiveView("timeline", { source: "profile" });
  assert.equal(harness.api.activeView, "timeline");
  assert.equal(harness.api.source, "profile");
  assert.equal(harness.context.els.sourceBackButton.hidden, false);
  assert.equal(harness.context.els.sourceBackButton.getAttribute("aria-label"), "返回我的");
  assert.equal(harness.historyCalls.length, 1);
  assert.equal(harness.api.returnToProfile(), true);
  assert.equal(harness.api.activeView, "profile");
  assert.equal(harness.context.els.sourceBackButton.hidden, true);
  assert.equal(harness.scrollCalls.at(-1)?.top, 240);
  assert.equal(harness.scrollCalls.at(-1)?.left, 0);
  assert.equal(harness.scrollCalls.at(-1)?.behavior, "auto");
});

test("profile scroll restoration also supports the mobile view scroll container", () => {
  const harness = createHarness({ scrollTop: 0 });
  const profileView = harness.document.querySelector('[data-view="profile"]');
  const viewScrollCalls = [];
  profileView.scrollTop = 360;
  profileView.scrollTo = (options) => viewScrollCalls.push(options);
  harness.api.setActiveView("week", { source: "profile" });
  profileView.scrollTop = 0;
  assert.equal(harness.api.returnToProfile(), true);
  assert.equal(profileView.scrollTop, 360);
  assert.equal(viewScrollCalls.at(-1)?.top, 360);
});

test("ordinary and bottom-navigation entries clear the in-memory source", () => {
  const harness = createHarness();
  harness.api.setActiveView("week", { source: "profile" });
  harness.api.setActiveView("tasks");
  assert.equal(harness.api.activeView, "tasks");
  assert.equal(harness.api.source, null);
  assert.equal(harness.api.destination, null);
  assert.equal(harness.context.els.sourceBackButton.hidden, true);
  assert.equal(harness.api.returnToProfile(), false);
});

test("the planner shortcut opens the home planner without persisting navigation state", () => {
  const harness = createHarness();
  const state = { marker: true };
  const before = JSON.stringify(state);
  harness.api.setActiveView("planner", { source: "profile" });
  assert.equal(harness.api.activeView, "home");
  assert.equal(harness.api.destination, "planner");
  assert.equal(harness.plannerScrollCalls.length, 1);
  assert.equal(JSON.stringify(state), before);
  assert.doesNotMatch(navigationSource, /saveState|localStorage|state\./);
});

test("system back follows the same source rule and only handles profile-origin views", () => {
  const harness = createHarness();
  let prevented = 0;
  harness.api.setActiveView("habits", { source: "profile" });
  assert.equal(harness.api.handleSourceAwareBack({ preventDefault() { prevented += 1; } }), true);
  assert.equal(harness.api.activeView, "profile");
  assert.equal(prevented, 1);
  assert.equal(harness.api.handleSourceAwareBack({ preventDefault() { prevented += 1; } }), false);
  assert.equal(prevented, 1);
});

test("browser, legacy Android and Capacitor back events use the shared handler", () => {
  assert.match(appSource, /addEventListener\?\.\("popstate"[\s\S]*?handleSourceAwareBack/);
  assert.match(appSource, /document\.addEventListener\?\.\("backbutton", handleSourceAwareBack\)/);
  assert.match(appSource, /addListener\?\.\("backButton", handleSourceAwareBack\)/);
});

test("the return control has a unified visible style and at least a 44px target", () => {
  assert.match(stylesSource, /\.source-back-button \{[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px;/);
  assert.match(stylesSource, /\.source-back-button\[hidden\] \{ display: none; \}/);
});
