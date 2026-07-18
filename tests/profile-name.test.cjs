"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { DOMParser } = require("linkedom");

const appSource = fs.readFileSync("app.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
const stylesSource = fs.readFileSync("styles.css", "utf8");
const normalizeStart = appSource.indexOf("function normalizeProfileName");
const normalizeEnd = appSource.indexOf("function normalizeState", normalizeStart);
const editorStart = appSource.indexOf("function getProfileAvatarTheme");
const editorEnd = appSource.indexOf("function renderProfileOverview", editorStart);
assert.ok(normalizeStart >= 0 && normalizeEnd > normalizeStart && editorStart >= 0 && editorEnd > editorStart);
const helperSource = `${appSource.slice(normalizeStart, normalizeEnd)}\n${appSource.slice(editorStart, editorEnd)}`;

function createHarness({ state = { profileName: "自见用户", selectedTheme: "paper", syncUpdatedAt: 0 }, saveResult = true } = {}) {
  const document = new DOMParser().parseFromString(indexSource, "text/html");
  let saveCalls = 0;
  let persisted = null;
  const toasts = [];
  const context = {
    console,
    Date,
    state,
    previewThemeId: null,
    els: {
      profileAvatar: document.querySelector("#profileAvatar"),
      profileNameText: document.querySelector("#profileNameText"),
      profileNameEditButton: document.querySelector("#profileNameEditButton"),
      profileNameForm: document.querySelector("#profileNameForm"),
      profileNameInput: document.querySelector("#profileNameInput"),
    },
    saveState() {
      saveCalls += 1;
      if (saveResult === false) return false;
      state.syncUpdatedAt += 1;
      persisted = JSON.stringify(state);
      return true;
    },
    showReminderToast(title, body) { toasts.push({ title, body }); },
  };
  context.renderProfileOverview = () => {
    context.els.profileNameText.textContent = context.normalizeName(state.profileName);
    context.els.profileAvatar.dataset.avatarTheme = context.api.getTheme(state.selectedTheme);
  };
  vm.createContext(context);
  vm.runInContext(`${helperSource}; this.normalizeName = normalizeProfileName; this.api = {
    normalizeProfileName,
    getTheme: getProfileAvatarTheme,
    updateTheme: updateProfileAvatarTheme,
    open: openProfileNameEditor,
    close: closeProfileNameEditor,
    save: saveProfileName
  };`, context);
  return {
    context, document, state, els: context.els, api: context.api, toasts,
    get saveCalls() { return saveCalls; },
    get persisted() { return persisted; },
  };
}

test("profile name normalization is bounded, stable and falls back when empty", () => {
  const harness = createHarness();
  assert.equal(harness.api.normalizeProfileName("  林间   小芽  "), "林间 小芽");
  assert.equal(harness.api.normalizeProfileName(" \u0000\n "), "自见用户");
  assert.equal(harness.api.normalizeProfileName("芽".repeat(40)).length, 32);
});

test("inline SVG contains four theme scenes and theme ids map deterministically", () => {
  const harness = createHarness();
  assert.equal(harness.document.querySelectorAll("#profileAvatar svg [data-avatar-scene]").length, 4);
  assert.deepEqual(["paper", "tea", "moon", "plum"].map(harness.api.getTheme), ["spring", "forest", "night", "warm"]);
  harness.api.updateTheme("moon");
  assert.equal(harness.els.profileAvatar.dataset.avatarTheme, "night");
  assert.match(stylesSource, /\.profile-avatar\[data-avatar-theme="night"\]/);
});

test("editing saves once, persists, reopens with the saved value and renders unsafe text literally", () => {
  const harness = createHarness();
  assert.equal(harness.api.open(), true);
  assert.equal(harness.els.profileNameForm.hidden, false);
  harness.els.profileNameInput.value = '<img src=x onerror="alert(1)">';
  assert.equal(harness.api.save({ preventDefault() {} }), true);
  assert.equal(harness.saveCalls, 1);
  assert.equal(JSON.parse(harness.persisted).profileName, '<img src=x onerror="alert(1)">');
  assert.equal(harness.els.profileNameText.textContent, '<img src=x onerror="alert(1)">');
  assert.equal(harness.els.profileNameText.querySelector("img"), null);
  assert.equal(harness.api.open(), true);
  assert.equal(harness.els.profileNameInput.value, '<img src=x onerror="alert(1)">');
});

test("an empty submitted name stores and renders the default", () => {
  const harness = createHarness({ state: { profileName: "旧名字", selectedTheme: "paper", syncUpdatedAt: 0 } });
  harness.api.open();
  harness.els.profileNameInput.value = "   ";
  assert.equal(harness.api.save({ preventDefault() {} }), true);
  assert.equal(harness.state.profileName, "自见用户");
  assert.equal(harness.els.profileNameText.textContent, "自见用户");
});

test("a save failure rolls back state and keeps the editor open for retry", () => {
  const harness = createHarness({ state: { profileName: "原名字", selectedTheme: "paper", syncUpdatedAt: 9 }, saveResult: false });
  harness.api.open();
  harness.els.profileNameInput.value = "新名字";
  assert.equal(harness.api.save({ preventDefault() {} }), false);
  assert.equal(harness.state.profileName, "原名字");
  assert.equal(harness.state.syncUpdatedAt, 9);
  assert.equal(harness.els.profileNameForm.hidden, false);
  assert.equal(harness.toasts.at(-1).title, "保存失败");
});

test("profile name uses state persistence, whole-state sync and backup paths", () => {
  assert.match(appSource, /profileName:\s*"自见用户"/);
  assert.match(appSource, /state\.profileName = normalizeProfileName\(state\.profileName\)/);
  assert.match(appSource, /const merged = \{ \.\.\.local, \.\.\.preferred \};/);
  assert.match(appSource, /function cloudSafeState\(\)[\s\S]*?structuredClone\(state\)/);
  assert.match(appSource, /const backup = \{[\s\S]*?state,[\s\S]*?\};/);
  assert.doesNotMatch(helperSource, /innerHTML/);
});
