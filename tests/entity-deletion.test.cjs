const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");
const helperStart = source.indexOf("function normalizeDeletionMap");
const helperEnd = source.indexOf("function normalizeState", helperStart);
const mergeStart = source.indexOf("function mergeById");
const mergeEnd = source.indexOf("function scheduleCloudSync", mergeStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "deletion registry helpers should exist");
assert.ok(mergeStart >= 0 && mergeEnd > mergeStart, "sync merge helpers should exist");

function createApi(state = {}) {
  const context = {
    Number,
    String,
    Object,
    Array,
    Map,
    Set,
    structuredClone,
    state,
  };
  vm.createContext(context);
  vm.runInContext(`
    ${source.slice(helperStart, helperEnd)}
    ${source.slice(mergeStart, mergeEnd)}
    this.api = {
      normalizeDeletionMap,
      normalizeDeletionRegistry,
      mergeDeletionRegistries,
      filterDeletedEntities,
      mergeSyncedStates,
      cloudSafeState
    };
  `, context);
  return context.api;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseState(overrides = {}) {
  return {
    syncUpdatedAt: 0,
    tasks: [],
    courses: [],
    memos: [],
    focusSessions: [],
    flameLedger: [],
    transactions: [],
    focusByDate: {},
    flames: 0,
    dailyPlans: {},
    memoTags: [],
    ownedSkins: [],
    ownedFlowers: [],
    ownedThemes: [],
    quotes: [],
    deletions: { version: 1, tasks: {}, memos: {} },
    ...overrides,
  };
}

function task(id, title = `task-${id}`) {
  return { id, title, done: false, startAt: 1, endAt: 2 };
}

function memo(id, title = `memo-${id}`) {
  return { id, title, tag: "其他", body: "", done: false, createdAt: 1 };
}

test("old states without deletions normalize to an empty versioned registry", () => {
  const api = createApi();
  assert.deepEqual(plain(api.normalizeDeletionRegistry(undefined)), {
    version: 1,
    tasks: {},
    memos: {},
  });
  assert.match(source, /deletions:\s*\{ version: 1, tasks: \{\}, memos: \{\} \}/);
});

test("damaged registries, invalid ids and invalid deletedAt values are ignored", () => {
  const api = createApi();
  const normalized = api.normalizeDeletionRegistry({
    version: 99,
    tasks: {
      "": { deletedAt: 10 },
      "   ": { deletedAt: 11 },
      constructor: { deletedAt: 12 },
      stringTime: { deletedAt: "13" },
      nan: { deletedAt: NaN },
      infinity: { deletedAt: Infinity },
      zero: { deletedAt: 0 },
      negative: { deletedAt: -1 },
      array: [],
      valid: { deletedAt: 14, ignored: "field" },
    },
    memos: "broken",
  });
  assert.deepEqual(plain(normalized), {
    version: 1,
    tasks: { zero: { deletedAt: 0 }, negative: { deletedAt: -1 }, valid: { deletedAt: 14 } },
    memos: {},
  });
  assert.deepEqual(plain(api.normalizeDeletionRegistry([])), { version: 1, tasks: {}, memos: {} });
});

test("a local task tombstone filters the matching local task", () => {
  const api = createApi();
  const active = api.filterDeletedEntities(
    [task("keep"), task("deleted")],
    { deleted: { deletedAt: 100 } }
  );
  assert.deepEqual(plain(active), [task("keep")]);
});

test("a local tombstone prevents a remote stale task from reviving", () => {
  const api = createApi();
  const local = baseState({
    syncUpdatedAt: 200,
    deletions: { version: 1, tasks: { gone: { deletedAt: 200 } }, memos: {} },
  });
  const remote = baseState({ syncUpdatedAt: 100, tasks: [task("gone")] });
  const merged = api.mergeSyncedStates(local, remote);
  assert.deepEqual(plain(merged.tasks), []);
  assert.equal(merged.deletions.tasks.gone.deletedAt, 200);
});

test("a remote tombstone prevents a local stale task from reviving", () => {
  const api = createApi();
  const local = baseState({ syncUpdatedAt: 100, tasks: [task("gone")] });
  const remote = baseState({
    syncUpdatedAt: 200,
    deletions: { version: 1, tasks: { gone: { deletedAt: 200 } }, memos: {} },
  });
  const merged = api.mergeSyncedStates(local, remote);
  assert.deepEqual(plain(merged.tasks), []);
  assert.equal(merged.deletions.tasks.gone.deletedAt, 200);
});

test("task and memo tombstones use independent namespaces", () => {
  const api = createApi();
  const sharedId = "same-id";
  const taskDeleted = api.mergeSyncedStates(
    baseState({ tasks: [task(sharedId)], memos: [memo(sharedId)] }),
    baseState({ deletions: { version: 1, tasks: { [sharedId]: { deletedAt: 10 } }, memos: {} } })
  );
  assert.deepEqual(plain(taskDeleted.tasks), []);
  assert.deepEqual(plain(taskDeleted.memos), [memo(sharedId)]);

  const memoDeleted = api.mergeSyncedStates(
    baseState({ tasks: [task(sharedId)], memos: [memo(sharedId)] }),
    baseState({ deletions: { version: 1, tasks: {}, memos: { [sharedId]: { deletedAt: 11 } } } })
  );
  assert.deepEqual(plain(memoDeleted.tasks), [task(sharedId)]);
  assert.deepEqual(plain(memoDeleted.memos), []);
});

test("the newer deletedAt wins for the same entity and id", () => {
  const api = createApi();
  const merged = api.mergeDeletionRegistries(
    { version: 1, tasks: { item: { deletedAt: 100 } }, memos: { note: { deletedAt: 400 } } },
    { version: 1, tasks: { item: { deletedAt: 300 } }, memos: { note: { deletedAt: 200 } } }
  );
  assert.equal(merged.tasks.item.deletedAt, 300);
  assert.equal(merged.memos.note.deletedAt, 400);
});

test("multiple A/B exchange rounds do not revive deleted tasks or memos", () => {
  const api = createApi();
  let deviceA = baseState({
    syncUpdatedAt: 300,
    deletions: {
      version: 1,
      tasks: { taskGone: { deletedAt: 300 } },
      memos: { memoGone: { deletedAt: 301 } },
    },
  });
  let deviceB = baseState({
    syncUpdatedAt: 100,
    tasks: [task("taskGone")],
    memos: [memo("memoGone")],
  });
  for (let round = 0; round < 5; round += 1) {
    deviceB = plain(api.mergeSyncedStates(deviceB, deviceA));
    deviceB.syncUpdatedAt += 1;
    deviceA = plain(api.mergeSyncedStates(deviceA, deviceB));
    deviceA.syncUpdatedAt += 1;
  }
  assert.deepEqual(deviceA.tasks, []);
  assert.deepEqual(deviceB.tasks, []);
  assert.deepEqual(deviceA.memos, []);
  assert.deepEqual(deviceB.memos, []);
  assert.ok(deviceA.deletions.tasks.taskGone);
  assert.ok(deviceB.deletions.memos.memoGone);
});

test("deletion registries do not modify unrelated entities or statistics", () => {
  const api = createApi();
  const courses = [{ id: "course", title: "课程", startAt: 10, endAt: 20 }];
  const focusSessions = [{ id: "focus", title: "专注", startAt: 10, endAt: 20, minutes: 10 }];
  const focusByDate = { "2026-07-17": 10 };
  const dailyPlans = { "2026-07-17": { generated_at: 10, adopted_at: 20, marker: "keep" } };
  const local = baseState({ courses, focusSessions, focusByDate, flames: 9, dailyPlans });
  const remote = baseState({
    deletions: {
      version: 1,
      tasks: { missingTask: { deletedAt: 100 } },
      memos: { missingMemo: { deletedAt: 101 } },
    },
  });
  const merged = api.mergeSyncedStates(local, remote);
  assert.deepEqual(plain(merged.courses), courses);
  assert.deepEqual(plain(merged.focusSessions), focusSessions);
  assert.deepEqual(plain(merged.focusByDate), focusByDate);
  assert.equal(merged.flames, 9);
  assert.deepEqual(plain(merged.dailyPlans), dailyPlans);
});

test("cloudSafeState retains normalized tombstones and filters stale entities", () => {
  const state = baseState({
    tasks: [task("gone"), task("active")],
    memos: [memo("memoGone"), memo("memoActive")],
    deletions: {
      version: 7,
      tasks: { gone: { deletedAt: 100 }, broken: { deletedAt: "bad" } },
      memos: { memoGone: { deletedAt: 101 } },
    },
    heatmapImage: "large-image",
    isRunning: true,
    startedAt: 1,
    endsAt: 2,
  });
  const api = createApi(state);
  const snapshot = api.cloudSafeState();
  assert.deepEqual(plain(snapshot.deletions), {
    version: 1,
    tasks: { gone: { deletedAt: 100 } },
    memos: { memoGone: { deletedAt: 101 } },
  });
  assert.deepEqual(plain(snapshot.tasks), [task("active")]);
  assert.deepEqual(plain(snapshot.memos), [memo("memoActive")]);
  assert.equal(snapshot.heatmapImage, "");
  assert.equal(snapshot.isRunning, false);
});

test("JSON backup round-trips deletion registries and old backups remain compatible", () => {
  const api = createApi();
  const registry = api.normalizeDeletionRegistry({
    tasks: { taskGone: { deletedAt: 100 } },
    memos: { memoGone: { deletedAt: 101 } },
  });
  const backup = JSON.stringify({ app: "zijian", version: 1, state: baseState({ deletions: registry }) });
  const restored = JSON.parse(backup).state;
  assert.deepEqual(plain(api.normalizeDeletionRegistry(restored.deletions)), plain(registry));
  const oldBackupState = baseState();
  delete oldBackupState.deletions;
  assert.deepEqual(plain(api.normalizeDeletionRegistry(JSON.parse(JSON.stringify({ state: oldBackupState })).state.deletions)), {
    version: 1, tasks: {}, memos: {},
  });
  assert.match(source, /const backup = \{[\s\S]*?state,[\s\S]*?\};/);
  assert.match(source, /state = restoreTimerState\(\{ \.\.\.defaultState, \.\.\.nextState \}\);[\s\S]*?normalizeState\(\);/);
});

test("merge results are stable for the same inputs", () => {
  const api = createApi();
  const local = baseState({
    syncUpdatedAt: 10,
    tasks: [task("gone"), task("active")],
    deletions: { version: 1, tasks: { gone: { deletedAt: 20 } }, memos: {} },
  });
  const remote = baseState({ syncUpdatedAt: 5, tasks: [task("gone"), task("remote")] });
  assert.equal(
    JSON.stringify(api.mergeSyncedStates(local, remote)),
    JSON.stringify(api.mergeSyncedStates(structuredClone(local), structuredClone(remote)))
  );
});

test("normalization, filtering and merging do not mutate inputs", () => {
  const api = createApi();
  const local = baseState({
    tasks: [task("gone")],
    memos: [memo("memoGone")],
    deletions: { version: 1, tasks: { gone: { deletedAt: 100 } }, memos: {} },
  });
  const remote = baseState({
    tasks: [task("remote")],
    deletions: { version: 1, tasks: {}, memos: { memoGone: { deletedAt: 101 } } },
  });
  const beforeLocal = structuredClone(local);
  const beforeRemote = structuredClone(remote);
  api.normalizeDeletionRegistry(local.deletions);
  api.filterDeletedEntities(local.tasks, local.deletions.tasks);
  api.mergeSyncedStates(local, remote);
  assert.deepEqual(local, beforeLocal);
  assert.deepEqual(remote, beforeRemote);
});
