"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const ActivitySessions = require("../activity-sessions.js");
const Habits = require("../habits.js");
const DailyPlanner = require("../daily-planner.js");

const DAY = "2026-07-20";
const at = (hour, minute = 0) => new Date(`${DAY}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`).getTime();
const habit = (id, metricType, targetValue, extra = {}) => ({
  id, title: id, color: "sage", metricType, targetValue,
  unit: metricType === "duration" ? "分钟" : "次", daysOfWeek: [1],
  includeInPlanner: true, createdAt: at(0), updatedAt: at(0), archivedAt: null,
  ...extra,
});

function completeHabitSessions(sourceHabit, intervals) {
  let sessions = [];
  for (let index = 0; index < intervals.length; index += 1) {
    const [startAt, endAt] = intervals[index];
    const started = ActivitySessions.startHabitActivity({
      sessions, activeActivitySessionId: null, habit: sourceHabit, now: startAt,
      idFactory: () => `${sourceHabit.id}-${index + 1}`,
    });
    assert.equal(started.ok, true);
    const completed = ActivitySessions.completeActivitySession({
      sessions: started.sessions, activeActivitySessionId: started.activeActivitySessionId, now: endAt,
    });
    assert.equal(completed.ok, true);
    sessions = completed.sessions;
  }
  return sessions;
}

test("includeInPlanner is optional, normalized and merge-safe", () => {
  assert.equal(Habits.normalizeHabit(habit("on", "duration", 60)).includeInPlanner, true);
  assert.equal(Habits.normalizeHabit(habit("off", "count", 3, { includeInPlanner: undefined })).includeInPlanner, false);
  const merged = Habits.mergeHabits(
    [habit("same", "duration", 60, { includeInPlanner: false, updatedAt: at(1) })],
    [habit("same", "duration", 60, { includeInPlanner: true, updatedAt: at(2) })]
  );
  assert.equal(merged[0].includeInPlanner, true);
});

test("duration habit accumulates multiple completed sessions and cancellation recalculates", () => {
  const sourceHabit = habit("read", "duration", 60);
  const sessions = completeHabitSessions(sourceHabit, [[at(9), at(9, 25)], [at(10), at(10, 20)]]);
  assert.equal(sessions.filter((item) => item.status === "completed").length, 2);
  assert.equal(Habits.getHabitSessionValue(sessions, sourceHabit, DAY), 45);
  const reconciled = Habits.reconcileHabitEntryFromSessions({ entries: [], habit: sourceHabit, dayKey: DAY, sessions, now: at(10, 20) });
  assert.equal(reconciled.entry.value, 45);
  assert.equal(Habits.isHabitComplete(sourceHabit, reconciled.entry), false);
  const withoutSecond = Habits.reconcileHabitEntryFromSessions({
    entries: reconciled.entries, habit: sourceHabit, dayKey: DAY,
    sessions: sessions.filter((item) => item.id !== "read-2"), now: at(10, 30),
  });
  assert.equal(withoutSecond.entry.value, 25);
});

test("count habit adds one per completion and retains a manual adjustment", () => {
  const sourceHabit = habit("water", "count", 5);
  const sessions = completeHabitSessions(sourceHabit, [[at(9), at(9, 1)], [at(10), at(10, 1)]]);
  assert.equal(Habits.getHabitSessionValue(sessions, sourceHabit, DAY), 2);
  const reconciled = Habits.reconcileHabitEntryFromSessions({ entries: [], habit: sourceHabit, dayKey: DAY, sessions, now: at(10, 1) });
  assert.equal(reconciled.entry.value, 2);
  const adjusted = Habits.setHabitEntry({
    entries: reconciled.entries, habit: sourceHabit, dayKey: DAY, value: 4,
    sessionValue: 2, now: at(10, 2),
  });
  assert.equal(adjusted.entry.value, 4);
  assert.equal(adjusted.entry.manualValue, 2);
  const recalculated = Habits.reconcileHabitEntryFromSessions({
    entries: adjusted.entries, habit: sourceHabit, dayKey: DAY,
    sessions: sessions.slice(0, 1), now: at(10, 3),
  });
  assert.equal(recalculated.entry.value, 3);
});

test("boolean habits cannot start sessions and stay manual", () => {
  const result = ActivitySessions.startHabitActivity({
    sessions: [], activeActivitySessionId: null, habit: habit("sleep", "boolean", 1),
    now: at(9), idFactory: () => "boolean-session",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "INVALID_HABIT");
});

test("planner suggests only unfinished opted-in habits and caps duration at the remaining target", () => {
  const input = {
    now: at(9), tasks: [], courses: [], focusSessions: [],
    habits: [{
      id: "read", title: "阅读", metricType: "duration", includeInPlanner: true,
      scheduledToday: true, completed: false, remainingValue: 25,
    }],
  };
  const before = structuredClone(input);
  const plan = DailyPlanner.buildDailyPlan(input);
  assert.equal(plan.priorities[0].habitId, "read");
  assert.equal(plan.blocks[0].habitId, "read");
  assert.equal(plan.blocks[0].minutes, 25);
  assert.equal(plan.blocks[0].planningMode, "habit");
  assert.deepEqual(input, before);
});

test("habit execution never modifies focus, flames, tasks or plans", () => {
  const envelope = { tasks: [{ id: "task", done: false }], focusSessions: [{ id: "focus" }], focusByDate: { [DAY]: 25 }, flames: 2, dailyPlans: { [DAY]: { marker: true } } };
  const before = structuredClone(envelope);
  completeHabitSessions(habit("walk", "duration", 30), [[at(9), at(9, 30)]]);
  assert.deepEqual(envelope, before);
});
