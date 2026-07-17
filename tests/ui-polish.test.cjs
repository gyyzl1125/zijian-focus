"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { DOMParser } = require("linkedom");

const indexSource = fs.readFileSync("index.html", "utf8");
const appSource = fs.readFileSync("app.js", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const document = new DOMParser().parseFromString(indexSource, "text/html");

test("task toolbar uses explicit icon-and-text actions without an ambiguous checkmark", () => {
  const toolbar = document.querySelector(".task-panel-actions");
  assert.ok(toolbar);
  assert.deepEqual([...toolbar.querySelectorAll("button")].map((button) => button.textContent.trim()), [
    "通知", "◉测试提醒", "⚙通知设置", "⌫清除完成",
  ]);
  assert.doesNotMatch(toolbar.textContent, /✓/);
  assert.match(stylesSource, /\.task-panel-actions \{[\s\S]*?grid-template-columns: repeat\(4, auto\)/);
  assert.match(stylesSource, /@media \(max-width: 720px\)[\s\S]*?\.task-panel-actions \{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
});

test("empty schedule, timeline and week chart receive compact presentation states", () => {
  assert.match(appSource, /timeline-card"\)\?\.classList\.toggle\("is-empty-state"/);
  assert.match(appSource, /week-schedule"\)\?\.classList\.toggle\("is-empty-state"/);
  assert.match(appSource, /week-chart-card"\)\?\.classList\.toggle\("is-empty-state"/);
  assert.match(stylesSource, /\.timeline-card\.is-empty-state,[\s\S]*?\.week-schedule\.is-empty-state \{[\s\S]*?min-height: 0/);
  assert.match(stylesSource, /\.week-chart-card\.is-empty-state \.week-chart \{[\s\S]*?height: 88px/);
});

test("habit empty state is a single creation guide and marks analytical sections as optional content", () => {
  const panel = document.querySelector("#habitPanel");
  assert.ok(panel.querySelector("#habitOnboardingButton"));
  assert.equal(panel.querySelectorAll("[data-habit-content]").length, 7);
  assert.match(appSource, /habitContentSections\?\.forEach\(\(section\) => \{ section\.hidden = !hasActiveHabits; \}\)/);
  assert.match(panel.querySelector("#habitOnboarding").textContent, /创建第一个习惯/);
  assert.match(stylesSource, /\.habit-panel\.is-empty-state \{[\s\S]*?min-height: 0/);
});

test("memo categories scroll horizontally and provide a lightweight mobile hint", () => {
  assert.equal(document.querySelector("#memoTags").getAttribute("aria-label"), "备忘分类，可横向滚动");
  assert.match(document.querySelector(".memo-tags-hint").textContent, /左右滑动/);
  assert.match(stylesSource, /\.memo-tags \{[\s\S]*?overflow-x: auto/);
  assert.match(stylesSource, /@media \(max-width: 720px\)[\s\S]*?\.memo-tags-hint \{[\s\S]*?display: block/);
  assert.match(stylesSource, /\.memo-panel \{[\s\S]*?grid-template-rows: auto auto auto auto minmax\(0, 1fr\)/);
});

test("affected helper text has a readable minimum size", () => {
  assert.match(stylesSource, /\.week-gesture-hint,[\s\S]*?\.week-mobile-plan-status \{[\s\S]*?font-size: max\(0\.72rem, 12px\)/);
});
