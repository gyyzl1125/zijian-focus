"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const styles = fs.readFileSync("styles.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");

const marker = "/* v59: the focus screen owns its mobile scroll area above the fixed navigation. */";
const start = styles.indexOf(marker);
assert.ok(start >= 0, "the final mobile focus layout rules should exist");
const mobileFocusRules = styles.slice(start);

test("focus remains a distinct view above the fixed bottom navigation", () => {
  assert.match(index, /<section class="app-view" id="focusView" data-view="focus"/);
  assert.match(index, /<nav class="bottom-nav"/);
  assert.ok(index.indexOf('id="focusView"') < index.indexOf('class="bottom-nav"'));
});

test("mobile focus reserves navigation and safe-area clearance", () => {
  assert.match(mobileFocusRules, /\.app-view\[data-view="focus"\]\.is-active\s*\{[\s\S]*?padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(mobileFocusRules, /scroll-padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(mobileFocusRules, /overflow-y:\s*auto;/);
  assert.match(mobileFocusRules, /-webkit-overflow-scrolling:\s*touch;/);
});

test("the focus card can grow instead of clipping its final content", () => {
  assert.match(mobileFocusRules, /#focusView \.timer-panel\s*\{[\s\S]*?height:\s*auto;/);
  assert.match(mobileFocusRules, /#focusView \.timer-content\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.doesNotMatch(mobileFocusRules, /font-size:\s*(?:0\.[0-6]|[0-9])rem/);
  assert.doesNotMatch(mobileFocusRules, /display:\s*none/);
});

test("other fixed-navigation screens retain shared safe-area protection", () => {
  assert.match(styles, /\.app-shell\s*\{[\s\S]*?padding:\s*14px 16px calc\(104px \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(styles, /\.app-view\[data-view="home"\]\.is-active,[\s\S]*?padding-bottom:\s*calc\(80px \+ env\(safe-area-inset-bottom\)\);/);
});

test("desktop focus layout remains the existing two-column panel", () => {
  const beforeMobileFix = styles.slice(0, start);
  assert.match(beforeMobileFix, /\.timer-panel\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1\.02fr\) minmax\(310px, 0\.98fr\);/);
});
