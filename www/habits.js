(function initHabits(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && typeof root === "object") root.Habits = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createHabitsApi() {
  "use strict";

  const METRIC_TYPES = new Set(["boolean", "count", "duration"]);
  const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function finiteTimestamp(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  function cleanId(value) {
    const id = String(value ?? "").trim();
    return id && !["__proto__", "prototype", "constructor"].includes(id) ? id : "";
  }

  function cleanText(value, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function normalizeDaysOfWeek(value) {
    const source = Array.isArray(value) ? value : [1, 2, 3, 4, 5, 6, 7];
    const days = [...new Set(source.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))]
      .sort((a, b) => a - b);
    return days.length ? days : [1, 2, 3, 4, 5, 6, 7];
  }

  function normalizeHabit(raw, now = Date.now()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = cleanId(raw.id);
    const title = cleanText(raw.title);
    if (!id || !title) return null;
    const metricType = METRIC_TYPES.has(raw.metricType) ? raw.metricType : "boolean";
    const createdAt = finiteTimestamp(raw.createdAt) ?? finiteTimestamp(raw.updatedAt) ?? finiteTimestamp(now);
    const updatedAt = finiteTimestamp(raw.updatedAt) ?? createdAt;
    if (createdAt === null || updatedAt === null) return null;
    const archivedAt = raw.archivedAt === null || raw.archivedAt === undefined
      ? null
      : finiteTimestamp(raw.archivedAt);
    const rawTarget = Number(raw.targetValue);
    const targetValue = metricType === "boolean"
      ? 1
      : Number.isFinite(rawTarget) && rawTarget > 0 ? rawTarget : 1;
    const defaultUnit = metricType === "duration" ? "分钟" : metricType === "count" ? "次" : "";
    return {
      id,
      title,
      color: cleanText(raw.color, "sage"),
      metricType,
      targetValue,
      unit: metricType === "boolean" ? "" : cleanText(raw.unit, defaultUnit),
      daysOfWeek: normalizeDaysOfWeek(raw.daysOfWeek),
      includeInPlanner: raw.includeInPlanner === true,
      createdAt,
      updatedAt,
      archivedAt,
    };
  }

  function chooseHabit(left, right) {
    if (!left) return right;
    if (!right) return left;
    if (right.updatedAt !== left.updatedAt) return right.updatedAt > left.updatedAt ? right : left;
    if (Boolean(right.archivedAt) !== Boolean(left.archivedAt)) return right.archivedAt ? right : left;
    return JSON.stringify(right) > JSON.stringify(left) ? right : left;
  }

  function normalizeHabits(rawHabits, now = Date.now()) {
    const byId = new Map();
    (Array.isArray(rawHabits) ? rawHabits : []).forEach((raw) => {
      const habit = normalizeHabit(raw, now);
      if (!habit) return;
      byId.set(habit.id, chooseHabit(byId.get(habit.id), habit));
    });
    return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }

  function normalizeDayKey(value) {
    const dayKey = String(value ?? "");
    if (!DAY_KEY_PATTERN.test(dayKey)) return "";
    const date = new Date(`${dayKey}T00:00:00`);
    if (!Number.isFinite(date.getTime())) return "";
    const check = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return check === dayKey ? dayKey : "";
  }

  function habitEntryKey(habitId, dayKey) {
    const id = cleanId(habitId);
    const day = normalizeDayKey(dayKey);
    return id && day ? `${id}::${day}` : "";
  }

  function normalizeHabitEntry(raw, now = Date.now()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const habitId = cleanId(raw.habitId);
    const dayKey = normalizeDayKey(raw.dayKey);
    const key = habitEntryKey(habitId, dayKey);
    const value = Number(raw.value);
    if (!key || !Number.isFinite(value) || value < 0) return null;
    const createdAt = finiteTimestamp(raw.createdAt) ?? finiteTimestamp(raw.updatedAt) ?? finiteTimestamp(now);
    const updatedAt = finiteTimestamp(raw.updatedAt) ?? createdAt;
    if (createdAt === null || updatedAt === null) return null;
    const manualValue = Number(raw.manualValue);
    return {
      id: key,
      habitId,
      dayKey,
      value,
      ...(Number.isFinite(manualValue) && manualValue >= 0 ? { manualValue } : {}),
      createdAt,
      updatedAt,
    };
  }

  function chooseEntry(left, right) {
    if (!left) return right;
    if (!right) return left;
    if (right.updatedAt !== left.updatedAt) return right.updatedAt > left.updatedAt ? right : left;
    return JSON.stringify(right) > JSON.stringify(left) ? right : left;
  }

  function normalizeHabitEntries(rawEntries, now = Date.now()) {
    const byKey = new Map();
    (Array.isArray(rawEntries) ? rawEntries : []).forEach((raw) => {
      const entry = normalizeHabitEntry(raw, now);
      if (!entry) return;
      byKey.set(entry.id, chooseEntry(byKey.get(entry.id), entry));
    });
    return [...byKey.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.habitId.localeCompare(b.habitId));
  }

  function mergeHabits(localHabits, remoteHabits, now = Date.now()) {
    return normalizeHabits([...normalizeHabits(localHabits, now), ...normalizeHabits(remoteHabits, now)], now);
  }

  function mergeHabitEntries(localEntries, remoteEntries, now = Date.now()) {
    return normalizeHabitEntries([...normalizeHabitEntries(localEntries, now), ...normalizeHabitEntries(remoteEntries, now)], now);
  }

  function createHabit({ habits, draft, now, idFactory }) {
    const timestamp = finiteTimestamp(now);
    if (timestamp === null || typeof idFactory !== "function") return { ok: false, reason: "INVALID_INPUT", habits: normalizeHabits(habits, timestamp ?? Date.now()) };
    const id = cleanId(idFactory());
    const habit = normalizeHabit({ ...draft, id, createdAt: timestamp, updatedAt: timestamp, archivedAt: null }, timestamp);
    if (!habit) return { ok: false, reason: "INVALID_HABIT", habits: normalizeHabits(habits, timestamp) };
    const current = normalizeHabits(habits, timestamp);
    if (current.some((item) => item.id === habit.id)) return { ok: false, reason: "DUPLICATE_ID", habits: current };
    return { ok: true, habit, habits: normalizeHabits([...current, habit], timestamp) };
  }

  function updateHabit({ habits, habitId, changes, now }) {
    const timestamp = finiteTimestamp(now);
    const id = cleanId(habitId);
    const current = normalizeHabits(habits, timestamp ?? Date.now());
    const existing = current.find((habit) => habit.id === id);
    if (timestamp === null || !existing) return { ok: false, reason: "NOT_FOUND", habits: current };
    const updated = normalizeHabit({ ...existing, ...changes, id, createdAt: existing.createdAt, updatedAt: Math.max(existing.updatedAt, timestamp) }, timestamp);
    if (!updated) return { ok: false, reason: "INVALID_HABIT", habits: current };
    return { ok: true, habit: updated, habits: current.map((habit) => habit.id === id ? updated : habit) };
  }

  function archiveHabit({ habits, habitId, now }) {
    const timestamp = finiteTimestamp(now);
    const id = cleanId(habitId);
    const current = normalizeHabits(habits, timestamp ?? Date.now());
    const existing = current.find((habit) => habit.id === id);
    if (timestamp === null || !existing || existing.archivedAt !== null) return { ok: false, reason: existing ? "ALREADY_ARCHIVED" : "NOT_FOUND", habits: current };
    const archivedAt = Math.max(timestamp, existing.updatedAt);
    const archived = { ...existing, archivedAt, updatedAt: archivedAt };
    return { ok: true, habit: archived, habits: current.map((habit) => habit.id === id ? archived : habit) };
  }

  function setHabitEntry({ entries, habit, dayKey, value, now, sessionValue = 0 }) {
    const timestamp = finiteTimestamp(now);
    const normalizedHabit = normalizeHabit(habit, timestamp ?? Date.now());
    const key = habitEntryKey(normalizedHabit?.id, dayKey);
    const numericValue = normalizedHabit?.metricType === "boolean" ? (Number(value) > 0 ? 1 : 0) : Number(value);
    const normalizedSessionValue = Number.isFinite(Number(sessionValue)) && Number(sessionValue) >= 0 ? Number(sessionValue) : 0;
    const current = normalizeHabitEntries(entries, timestamp ?? Date.now());
    if (timestamp === null || !normalizedHabit || !key || !Number.isFinite(numericValue) || numericValue < 0) {
      return { ok: false, reason: "INVALID_ENTRY", entries: current };
    }
    const previous = current.find((entry) => entry.id === key);
    const manualValue = normalizedHabit.metricType === "boolean" ? null : Math.max(0, numericValue - normalizedSessionValue);
    if (previous && previous.value === numericValue
      && (normalizedHabit.metricType === "boolean" || previous.manualValue === manualValue)) {
      return { ok: false, reason: "NO_CHANGE", entry: previous, entries: current };
    }
    const entry = {
      id: key,
      habitId: normalizedHabit.id,
      dayKey: normalizeDayKey(dayKey),
      value: numericValue,
      ...(normalizedHabit.metricType === "boolean" ? {} : { manualValue }),
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: Math.max(previous?.updatedAt ?? timestamp, timestamp),
    };
    return {
      ok: true,
      entry,
      entries: normalizeHabitEntries([...current.filter((item) => item.id !== key), entry], timestamp),
    };
  }

  function getHabitEntry(entries, habitId, dayKey) {
    const key = habitEntryKey(habitId, dayKey);
    return key ? normalizeHabitEntries(entries).find((entry) => entry.id === key) || null : null;
  }

  function isHabitComplete(habit, entry) {
    const normalizedHabit = normalizeHabit(habit);
    const normalizedEntry = normalizeHabitEntry(entry);
    if (!normalizedHabit || !normalizedEntry || normalizedEntry.habitId !== normalizedHabit.id) return false;
    return normalizedEntry.value >= normalizedHabit.targetValue;
  }

  function dayBounds(dayKey) {
    const normalized = normalizeDayKey(dayKey);
    if (!normalized) return null;
    const start = new Date(`${normalized}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { startAt: start.getTime(), endAt: end.getTime(), weekday: start.getDay() || 7 };
  }

  function dayKeyFromTimestamp(value) {
    const timestamp = finiteTimestamp(Number(value));
    if (timestamp === null) return "";
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getHabitSessionValue(sessions, habit, dayKey) {
    const normalizedHabit = normalizeHabit(habit);
    const bounds = dayBounds(dayKey);
    if (!normalizedHabit || normalizedHabit.metricType === "boolean" || !bounds) return 0;
    return (Array.isArray(sessions) ? sessions : []).reduce((sum, session) => {
      if (!session || session.type !== "habit" || String(session.habitId || "") !== normalizedHabit.id
        || session.status !== "completed") return sum;
      const startAt = Number(session.startAt);
      if (!Number.isFinite(startAt) || startAt < bounds.startAt || startAt >= bounds.endAt) return sum;
      if (normalizedHabit.metricType === "duration") return sum + Math.max(0, Number(session.minutes) || 0);
      const value = Number(session.habitValue);
      return sum + (Number.isFinite(value) && value >= 0 ? value : 1);
    }, 0);
  }

  function reconcileHabitEntryFromSessions({ entries, habit, dayKey, sessions, now }) {
    const timestamp = finiteTimestamp(now);
    const normalizedHabit = normalizeHabit(habit, timestamp ?? Date.now());
    const current = normalizeHabitEntries(entries, timestamp ?? Date.now());
    const key = habitEntryKey(normalizedHabit?.id, dayKey);
    if (timestamp === null || !normalizedHabit || normalizedHabit.metricType === "boolean" || !key) {
      return { ok: false, changed: false, reason: "INVALID_INPUT", entries: current, entry: null };
    }
    const previous = current.find((entry) => entry.id === key) || null;
    const manualValue = Number.isFinite(Number(previous?.manualValue))
      ? Math.max(0, Number(previous.manualValue))
      : Math.max(0, Number(previous?.value) || 0);
    const sessionValue = getHabitSessionValue(sessions, normalizedHabit, dayKey);
    const value = manualValue + sessionValue;
    if (!previous && value === 0) return { ok: true, changed: false, entries: current, entry: null, sessionValue };
    if (previous && previous.value === value && previous.manualValue === manualValue) {
      return { ok: true, changed: false, entries: current, entry: previous, sessionValue };
    }
    const entry = {
      id: key,
      habitId: normalizedHabit.id,
      dayKey: normalizeDayKey(dayKey),
      value,
      manualValue,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: Math.max(previous?.updatedAt ?? timestamp, timestamp),
    };
    return {
      ok: true,
      changed: true,
      entry,
      sessionValue,
      entries: normalizeHabitEntries([...current.filter((item) => item.id !== key), entry], timestamp),
    };
  }

  function reconcileHabitEntriesFromSessions(habits, entries, sessions, now) {
    const timestamp = finiteTimestamp(now);
    if (timestamp === null) return normalizeHabitEntries(entries);
    const normalizedHabits = normalizeHabits(habits, timestamp).filter((habit) => habit.metricType !== "boolean");
    const habitById = new Map(normalizedHabits.map((habit) => [habit.id, habit]));
    const pairs = new Set();
    normalizeHabitEntries(entries, timestamp).forEach((entry) => {
      if (habitById.has(entry.habitId)) pairs.add(`${entry.habitId}::${entry.dayKey}`);
    });
    (Array.isArray(sessions) ? sessions : []).forEach((session) => {
      const habitId = cleanId(session?.habitId);
      const dayKey = dayKeyFromTimestamp(Number(session?.startAt));
      if (habitById.has(habitId) && dayKey) pairs.add(`${habitId}::${dayKey}`);
    });
    let result = normalizeHabitEntries(entries, timestamp);
    [...pairs].sort().forEach((pair) => {
      const splitAt = pair.indexOf("::");
      const habitId = pair.slice(0, splitAt);
      const dayKey = pair.slice(splitAt + 2);
      result = reconcileHabitEntryFromSessions({ entries: result, habit: habitById.get(habitId), dayKey, sessions, now: timestamp }).entries;
    });
    return result;
  }

  function getHabitsForDay(habits, dayKey) {
    const bounds = dayBounds(dayKey);
    if (!bounds) return [];
    return normalizeHabits(habits)
      .filter((habit) => habit.createdAt < bounds.endAt
        && habit.archivedAt === null
        && habit.daysOfWeek.includes(bounds.weekday));
  }

  function getHabitCompletionSummary(habits, entries, dayKey) {
    const scheduled = getHabitsForDay(habits, dayKey);
    const normalizedEntries = normalizeHabitEntries(entries);
    const completed = scheduled.filter((habit) => isHabitComplete(habit, normalizedEntries.find((entry) => entry.habitId === habit.id && entry.dayKey === dayKey))).length;
    return {
      scheduled: scheduled.length,
      completed,
      rate: scheduled.length ? completed / scheduled.length : 0,
    };
  }

  function getHabitDayStats(habits, entries, dayKey, habitId = null) {
    const selectedId = habitId === null || habitId === undefined || habitId === "all" ? null : cleanId(habitId);
    const scheduled = getHabitsForDay(habits, dayKey)
      .filter((habit) => !selectedId || habit.id === selectedId);
    const normalizedEntries = normalizeHabitEntries(entries);
    const completed = scheduled.filter((habit) => {
      const entry = normalizedEntries.find((item) => item.habitId === habit.id && item.dayKey === dayKey);
      return isHabitComplete(habit, entry);
    }).length;
    return {
      dayKey: normalizeDayKey(dayKey),
      scheduled: scheduled.length,
      completed,
      rate: scheduled.length ? completed / scheduled.length : null,
    };
  }

  function addDaysToKey(dayKey, amount) {
    const normalized = normalizeDayKey(dayKey);
    const days = Number(amount);
    if (!normalized || !Number.isInteger(days)) return "";
    const date = new Date(`${normalized}T12:00:00`);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getHabitStatsRange(habits, entries, startDayKey, endDayKey, habitId = null) {
    const start = normalizeDayKey(startDayKey);
    const end = normalizeDayKey(endDayKey);
    if (!start || !end || start > end) return [];
    const result = [];
    let cursor = start;
    let guard = 0;
    while (cursor && cursor <= end && guard < 5000) {
      result.push(getHabitDayStats(habits, entries, cursor, habitId));
      cursor = addDaysToKey(cursor, 1);
      guard += 1;
    }
    return result;
  }

  function getHabitStreakStats(habits, entries, throughDayKey, habitId = null) {
    const through = normalizeDayKey(throughDayKey);
    const normalizedHabits = normalizeHabits(habits);
    const selectedId = habitId === null || habitId === undefined || habitId === "all" ? null : cleanId(habitId);
    const relevant = normalizedHabits.filter((habit) => !selectedId || habit.id === selectedId);
    if (!through || relevant.length === 0) return { current: 0, longest: 0 };
    const earliest = relevant.reduce((minimum, habit) => {
      const date = new Date(habit.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return !minimum || key < minimum ? key : minimum;
    }, "");
    const stats = getHabitStatsRange(normalizedHabits, entries, earliest, through, selectedId);
    let longest = 0;
    let running = 0;
    stats.forEach((day) => {
      if (day.scheduled === 0) return;
      if (day.rate === 1) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    });
    let current = 0;
    for (let index = stats.length - 1; index >= 0; index -= 1) {
      const day = stats[index];
      if (day.scheduled === 0) continue;
      if (day.rate !== 1) break;
      current += 1;
    }
    return { current, longest };
  }

  return Object.freeze({
    normalizeHabit,
    normalizeHabits,
    normalizeHabitEntry,
    normalizeHabitEntries,
    habitEntryKey,
    mergeHabits,
    mergeHabitEntries,
    createHabit,
    updateHabit,
    archiveHabit,
    setHabitEntry,
    getHabitSessionValue,
    reconcileHabitEntryFromSessions,
    reconcileHabitEntriesFromSessions,
    getHabitEntry,
    isHabitComplete,
    getHabitsForDay,
    getHabitCompletionSummary,
    getHabitDayStats,
    getHabitStatsRange,
    getHabitStreakStats,
    addDaysToKey,
  });
});
