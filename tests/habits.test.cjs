"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Habits = require("../habits.js");

const NOW = new Date("2026-07-20T09:00:00").getTime();

function habit(overrides = {}) {
  return {
    id: "habit-1",
    title: "阅读",
    color: "sage",
    metricType: "boolean",
    targetValue: 1,
    unit: "",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    createdAt: NOW,
    updatedAt: NOW,
    archivedAt: null,
    ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    id: "ignored",
    habitId: "habit-1",
    dayKey: "2026-07-20",
    value: 1,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test("damaged habit collections normalize safely", () => {
  assert.deepEqual(Habits.normalizeHabits(null, NOW), []);
  assert.deepEqual(Habits.normalizeHabits([{ title: "missing id" }, null], NOW), []);
  assert.deepEqual(Habits.normalizeHabitEntries("broken", NOW), []);
});

test("all three metric types normalize with fixed targets and units", () => {
  const booleanHabit = Habits.normalizeHabit(habit({ targetValue: 99, unit: "x" }), NOW);
  const countHabit = Habits.normalizeHabit(habit({ metricType: "count", targetValue: 8, unit: "页" }), NOW);
  const durationHabit = Habits.normalizeHabit(habit({ metricType: "duration", targetValue: 30, unit: "" }), NOW);
  assert.equal(booleanHabit.targetValue, 1);
  assert.equal(booleanHabit.unit, "");
  assert.equal(countHabit.targetValue, 8);
  assert.equal(countHabit.unit, "页");
  assert.equal(durationHabit.unit, "分钟");
});

test("days of week are unique, sorted and safely defaulted", () => {
  assert.deepEqual(Habits.normalizeHabit(habit({ daysOfWeek: [7, 1, 1, 3, 10] }), NOW).daysOfWeek, [1, 3, 7]);
  assert.deepEqual(Habits.normalizeHabit(habit({ daysOfWeek: [] }), NOW).daysOfWeek, [1, 2, 3, 4, 5, 6, 7]);
});

test("creating, editing and archiving a habit are immutable", () => {
  const source = [habit()];
  const before = structuredClone(source);
  const created = Habits.createHabit({ habits: source, draft: { title: "运动", metricType: "duration", targetValue: 30, unit: "分钟", daysOfWeek: [1, 3, 5] }, now: NOW + 1, idFactory: () => "habit-2" });
  assert.equal(created.ok, true);
  assert.equal(created.habits.length, 2);
  const updated = Habits.updateHabit({ habits: created.habits, habitId: "habit-2", changes: { title: "慢跑", targetValue: 45 }, now: NOW + 2 });
  assert.equal(updated.habit.title, "慢跑");
  const archived = Habits.archiveHabit({ habits: updated.habits, habitId: "habit-2", now: NOW + 3 });
  assert.equal(archived.habit.archivedAt, NOW + 3);
  assert.deepEqual(source, before);
});

test("invalid and repeated archive operations are safe failures", () => {
  assert.equal(Habits.archiveHabit({ habits: [habit()], habitId: "missing", now: NOW }).ok, false);
  assert.equal(Habits.archiveHabit({ habits: [habit({ archivedAt: NOW, updatedAt: NOW })], habitId: "habit-1", now: NOW + 1 }).reason, "ALREADY_ARCHIVED");
});

test("entry identity is canonical by habit id and day key", () => {
  assert.equal(Habits.habitEntryKey("habit-1", "2026-07-20"), "habit-1::2026-07-20");
  assert.equal(Habits.normalizeHabitEntry(entry(), NOW).id, "habit-1::2026-07-20");
  assert.equal(Habits.normalizeHabitEntry(entry({ dayKey: "2026-02-31" }), NOW), null);
});

test("duplicate entries keep only the newer updatedAt record", () => {
  const normalized = Habits.normalizeHabitEntries([
    entry({ value: 1, updatedAt: NOW }),
    entry({ value: 4, updatedAt: NOW + 1 }),
  ], NOW);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].value, 4);
});

test("boolean check-in and cancellation use one unique record", () => {
  const checked = Habits.setHabitEntry({ entries: [], habit: habit(), dayKey: "2026-07-20", value: true, now: NOW });
  assert.equal(checked.entries.length, 1);
  assert.equal(checked.entry.value, 1);
  const cancelled = Habits.setHabitEntry({ entries: checked.entries, habit: habit(), dayKey: "2026-07-20", value: 0, now: NOW + 1 });
  assert.equal(cancelled.entries.length, 1);
  assert.equal(cancelled.entry.value, 0);
  assert.equal(cancelled.entry.createdAt, NOW);
});

test("count and duration values are stored without derived completion fields", () => {
  const count = habit({ metricType: "count", targetValue: 8, unit: "页" });
  const result = Habits.setHabitEntry({ entries: [], habit: count, dayKey: "2026-07-20", value: 5, now: NOW });
  assert.equal(result.entry.value, 5);
  assert.equal(Object.hasOwn(result.entry, "completed"), false);
  assert.equal(Habits.isHabitComplete(count, result.entry), false);
  assert.equal(Habits.isHabitComplete(count, { ...result.entry, value: 8 }), true);
});

test("completion rate is derived at read time", () => {
  const habits = [habit(), habit({ id: "habit-2", metricType: "count", targetValue: 3 })];
  const entries = [entry(), entry({ habitId: "habit-2", value: 2 })];
  assert.deepEqual(Habits.getHabitCompletionSummary(habits, entries, "2026-07-20"), { scheduled: 2, completed: 1, rate: 0.5 });
  assert.equal(habits.some((item) => Object.hasOwn(item, "completionRate")), false);
});

test("only active habits scheduled for the selected weekday are returned", () => {
  const habits = [
    habit({ id: "monday", daysOfWeek: [1] }),
    habit({ id: "tuesday", daysOfWeek: [2] }),
    habit({ id: "archived", daysOfWeek: [1], archivedAt: NOW + 1 }),
  ];
  assert.deepEqual(Habits.getHabitsForDay(habits, "2026-07-20").map((item) => item.id), ["monday"]);
});

test("habit merge chooses newer updatedAt and retains archives", () => {
  const merged = Habits.mergeHabits(
    [habit({ title: "旧标题", updatedAt: NOW })],
    [habit({ title: "新标题", updatedAt: NOW + 1, archivedAt: NOW + 1 })],
    NOW + 2
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, "新标题");
  assert.equal(merged[0].archivedAt, NOW + 1);
});

test("entry merge chooses newer cancellation so old check-ins do not revive", () => {
  const merged = Habits.mergeHabitEntries(
    [entry({ value: 1, updatedAt: NOW })],
    [entry({ value: 0, updatedAt: NOW + 1 })],
    NOW + 2
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].value, 0);
});

test("merge order and serialization are deterministic", () => {
  const local = [habit({ id: "b" }), habit({ id: "a" })];
  const remote = [habit({ id: "c", updatedAt: NOW + 1 })];
  assert.equal(JSON.stringify(Habits.mergeHabits(local, remote, NOW + 2)), JSON.stringify(Habits.mergeHabits(remote, local, NOW + 2)));
});

test("all public operations leave input objects unchanged", () => {
  const habits = [habit()];
  const entries = [entry()];
  const beforeHabits = structuredClone(habits);
  const beforeEntries = structuredClone(entries);
  Habits.normalizeHabits(habits, NOW);
  Habits.normalizeHabitEntries(entries, NOW);
  Habits.mergeHabits(habits, habits, NOW);
  Habits.mergeHabitEntries(entries, entries, NOW);
  Habits.setHabitEntry({ entries, habit: habits[0], dayKey: "2026-07-20", value: 0, now: NOW + 1 });
  assert.deepEqual(habits, beforeHabits);
  assert.deepEqual(entries, beforeEntries);
});

test("the data module has no DOM, persistence or app-state side effects", () => {
  const source = require("node:fs").readFileSync("habits.js", "utf8");
  assert.doesNotMatch(source, /document\.|localStorage|saveState\s*\(|state\./);
});
