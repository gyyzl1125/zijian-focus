"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Habits = require("../habits.js");

const NOW = new Date("2026-07-20T09:00:00").getTime();

function habit(overrides = {}) {
  return {
    id: "daily", title: "阅读", color: "sage", metricType: "boolean",
    targetValue: 1, unit: "", daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    createdAt: new Date("2026-07-01T09:00:00").getTime(), updatedAt: NOW,
    archivedAt: null, ...overrides,
  };
}

function entry(habitId, dayKey, value = 1) {
  return { id: `${habitId}::${dayKey}`, habitId, dayKey, value, createdAt: NOW, updatedAt: NOW };
}

test("combined daily completion is completed habits divided by scheduled habits", () => {
  const habits = [habit(), habit({ id: "water", title: "喝水", metricType: "count", targetValue: 8, unit: "杯" })];
  const stats = Habits.getHabitDayStats(habits, [entry("daily", "2026-07-20"), entry("water", "2026-07-20", 4)], "2026-07-20");
  assert.deepEqual(stats, { dayKey: "2026-07-20", scheduled: 2, completed: 1, rate: 0.5 });
});

test("single-habit filter derives only the selected habit", () => {
  const habits = [habit(), habit({ id: "water", title: "喝水" })];
  assert.deepEqual(Habits.getHabitDayStats(habits, [entry("daily", "2026-07-20")], "2026-07-20", "water"), {
    dayKey: "2026-07-20", scheduled: 1, completed: 0, rate: 0,
  });
});

test("a day with no scheduled habit is empty rather than zero percent", () => {
  const stats = Habits.getHabitDayStats([habit({ daysOfWeek: [1] })], [], "2026-07-21");
  assert.equal(stats.scheduled, 0);
  assert.equal(stats.rate, null);
});

test("range returns every natural day in stable chronological order", () => {
  const stats = Habits.getHabitStatsRange([habit()], [], "2026-07-18", "2026-07-20");
  assert.deepEqual(stats.map((day) => day.dayKey), ["2026-07-18", "2026-07-19", "2026-07-20"]);
  assert.deepEqual(Habits.getHabitStatsRange([], [], "bad", "2026-07-20"), []);
});

test("no-schedule days are neutral to current and longest streaks", () => {
  const mondayOnly = habit({ daysOfWeek: [1] });
  const stats = Habits.getHabitStreakStats([mondayOnly], [entry("daily", "2026-07-20")], "2026-07-21");
  assert.deepEqual(stats, { current: 1, longest: 1 });
});

test("an incomplete scheduled day breaks the streak", () => {
  const habits = [habit()];
  const entries = [entry("daily", "2026-07-17"), entry("daily", "2026-07-18"), entry("daily", "2026-07-20")];
  assert.deepEqual(Habits.getHabitStreakStats(habits, entries, "2026-07-20"), { current: 1, longest: 2 });
});

test("archived habits do not contribute to live statistics", () => {
  const archived = habit({ archivedAt: NOW, updatedAt: NOW });
  assert.deepEqual(Habits.getHabitDayStats([archived], [entry("daily", "2026-07-20")], "2026-07-20"), {
    dayKey: "2026-07-20", scheduled: 0, completed: 0, rate: null,
  });
});

test("statistics are deterministic and do not modify inputs", () => {
  const habits = [habit()];
  const entries = [entry("daily", "2026-07-20")];
  const before = structuredClone({ habits, entries });
  const first = Habits.getHabitStatsRange(habits, entries, "2026-07-01", "2026-07-20");
  const second = Habits.getHabitStatsRange(habits, entries, "2026-07-01", "2026-07-20");
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual({ habits, entries }, before);
});

test("day-key arithmetic crosses month boundaries deterministically", () => {
  assert.equal(Habits.addDaysToKey("2026-07-01", -1), "2026-06-30");
  assert.equal(Habits.addDaysToKey("2026-07-31", 1), "2026-08-01");
});
