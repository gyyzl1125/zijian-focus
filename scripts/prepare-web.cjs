"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const WEB_ASSETS = Object.freeze([
  "index.html",
  "styles.css",
  "app.js",
  "daily-planner.js",
  "activity-sessions.js",
  "habits.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "clear-cache.html",
  "fflate.min.js",
]);

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function resolveLocations(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, ".."));
  const webDir = path.resolve(options.webDir || path.join(rootDir, "www"));
  return { rootDir, webDir };
}

function inspectAssets(options = {}) {
  const { rootDir, webDir } = resolveLocations(options);
  return WEB_ASSETS.map((relativePath) => {
    const sourcePath = path.join(rootDir, relativePath);
    const targetPath = path.join(webDir, relativePath);
    const sourceExists = fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile();
    const targetExists = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile();
    const sourceHash = sourceExists ? sha256(sourcePath) : null;
    const targetHash = targetExists ? sha256(targetPath) : null;
    return {
      relativePath,
      sourcePath,
      targetPath,
      sourceExists,
      targetExists,
      sourceHash,
      targetHash,
      matches: sourceExists && targetExists && sourceHash === targetHash,
    };
  });
}

function checkWeb(options = {}) {
  const log = options.log || console.log;
  const results = inspectAssets(options);
  let valid = true;

  log("Web asset check (SHA-256):");
  for (const result of results) {
    if (!result.sourceExists) {
      valid = false;
      log(`  MISSING SOURCE  ${result.relativePath}`);
    } else if (!result.targetExists) {
      valid = false;
      log(`  MISSING TARGET  ${result.relativePath}`);
    } else if (!result.matches) {
      valid = false;
      log(`  HASH MISMATCH   ${result.relativePath}`);
    } else {
      log(`  OK ${result.sourceHash}  ${result.relativePath}`);
    }
  }

  if (!valid) {
    const error = new Error("Web asset check failed.");
    error.code = "WEB_ASSET_CHECK_FAILED";
    error.results = results;
    throw error;
  }

  log(`Verified ${results.length} allowlisted web assets.`);
  return results;
}

function prepareWeb(options = {}) {
  const log = options.log || console.log;
  const { rootDir, webDir } = resolveLocations(options);
  const missingSources = WEB_ASSETS.filter((relativePath) => {
    const sourcePath = path.join(rootDir, relativePath);
    return !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile();
  });
  if (missingSources.length) {
    throw new Error(`Missing source web assets: ${missingSources.join(", ")}`);
  }

  fs.mkdirSync(webDir, { recursive: true });
  log(`Syncing ${WEB_ASSETS.length} web assets to ${webDir}:`);
  for (const relativePath of WEB_ASSETS) {
    const sourcePath = path.join(rootDir, relativePath);
    const targetPath = path.join(webDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    log(`  COPIED ${relativePath}`);
  }

  return checkWeb({ rootDir, webDir, log });
}

function runCli() {
  const mode = process.argv[2];
  try {
    if (mode === "prepare") {
      prepareWeb();
    } else if (mode === "check") {
      checkWeb();
    } else {
      console.error("Usage: node scripts/prepare-web.cjs <prepare|check>");
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(error && error.message ? error.message : "Web asset operation failed.");
    process.exitCode = 1;
  }
}

if (require.main === module) runCli();

module.exports = {
  WEB_ASSETS,
  checkWeb,
  inspectAssets,
  prepareWeb,
  sha256,
};
