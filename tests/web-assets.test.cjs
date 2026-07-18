"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  WEB_ASSETS,
  checkWeb,
  prepareWeb,
} = require("../scripts/prepare-web.cjs");

function makeFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "zijian web assets "));
  const rootDir = path.join(fixtureRoot, "project with spaces");
  const webDir = path.join(rootDir, "www");
  fs.mkdirSync(rootDir, { recursive: true });
  WEB_ASSETS.forEach((asset, index) => {
    fs.writeFileSync(path.join(rootDir, asset), `asset-${index}-${asset}\n`, "utf8");
  });
  return { fixtureRoot, rootDir, webDir };
}

function removeFixture(fixtureRoot) {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

test("prepare copies only the allowlist, supports spaces and preserves unrelated www files", () => {
  const fixture = makeFixture();
  try {
    fs.mkdirSync(fixture.webDir, { recursive: true });
    fs.writeFileSync(path.join(fixture.webDir, "keep-me.txt"), "untouched", "utf8");
    fs.writeFileSync(path.join(fixture.rootDir, ".env"), "SECRET=value", "utf8");
    fs.mkdirSync(path.join(fixture.rootDir, "tests"));
    fs.writeFileSync(path.join(fixture.rootDir, "tests", "private.test.cjs"), "not copied", "utf8");

    const results = prepareWeb({ ...fixture, log() {} });

    assert.equal(results.length, WEB_ASSETS.length);
    assert.equal(results.every((result) => result.matches), true);
    assert.equal(fs.readFileSync(path.join(fixture.webDir, "keep-me.txt"), "utf8"), "untouched");
    assert.equal(fs.existsSync(path.join(fixture.webDir, ".env")), false);
    assert.equal(fs.existsSync(path.join(fixture.webDir, "tests")), false);
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
});

test("check fails when an allowlisted target is missing", () => {
  const fixture = makeFixture();
  try {
    prepareWeb({ ...fixture, log() {} });
    fs.rmSync(path.join(fixture.webDir, "daily-planner.js"));
    assert.throws(
      () => checkWeb({ ...fixture, log() {} }),
      (error) => error && error.code === "WEB_ASSET_CHECK_FAILED"
    );
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
});

test("check fails when source and www content differ", () => {
  const fixture = makeFixture();
  try {
    prepareWeb({ ...fixture, log() {} });
    fs.writeFileSync(path.join(fixture.webDir, "app.js"), "stale app", "utf8");
    assert.throws(
      () => checkWeb({ ...fixture, log() {} }),
      (error) => error && error.code === "WEB_ASSET_CHECK_FAILED"
    );
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
});

test("prepare fails before copying when a source asset is missing", () => {
  const fixture = makeFixture();
  try {
    fs.rmSync(path.join(fixture.rootDir, "sw.js"));
    assert.throws(() => prepareWeb({ ...fixture, log() {} }), /Missing source web assets: sw\.js/);
    assert.equal(fs.existsSync(fixture.webDir), false);
  } finally {
    removeFixture(fixture.fixtureRoot);
  }
});

test("CLI check returns a non-zero exit code for the real www when it is stale", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const target = path.join(projectRoot, "www", "daily-planner.js");
  const backup = fs.existsSync(target) ? fs.readFileSync(target) : null;
  try {
    fs.rmSync(target, { force: true });
    const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts", "prepare-web.cjs"), "check"], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(`${result.stdout}\n${result.stderr}`, /MISSING TARGET\s+daily-planner\.js/);
  } finally {
    if (backup) fs.writeFileSync(target, backup);
  }
});

test("service worker precaches every local asset referenced by index", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const index = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const worker = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");
  const localRefs = [...index.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => asset !== "capacitor.js");

  assert.ok(localRefs.includes("daily-planner.js?v=59"));
  assert.ok(localRefs.includes("habits.js?v=59"));
  localRefs.forEach((asset) => assert.match(worker, new RegExp(`"\\./${asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`)));
  assert.match(worker, /const CACHE_NAME = "zijian-focus-v59"/);
});
