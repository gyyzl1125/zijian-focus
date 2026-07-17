(function exposeActivitySessions(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ActivitySessions = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createActivitySessions() {
  "use strict";

  const SESSION_STATUSES = new Set(["running", "completed", "cancelled"]);
  const END_REASONS = new Set(["manual", "switched", "cancelled", "recovered"]);
  const SESSION_TYPES = new Set(["task", "habit"]);
  const HABIT_METRIC_TYPES = new Set(["count", "duration"]);

  function timestamp(value) {
    const result = value instanceof Date ? value.getTime() : Number(value);
    return Number.isFinite(result) && result >= 0 ? result : NaN;
  }

  function stableString(value, fallback = "") {
    if (value === undefined || value === null) return fallback;
    return String(value);
  }

  function stableId(value) {
    const id = stableString(value).trim();
    return id ? id : null;
  }

  function calculateMinutes(startAt, endAt) {
    return Math.max(1, Math.round((endAt - startAt) / 60000));
  }

  function terminalPriority(status) {
    return status === "running" ? 0 : 1;
  }

  function sessionSignature(session) {
    return JSON.stringify([
      session.id,
      session.type,
      session.taskId,
      session.habitId,
      session.habitMetricType,
      session.habitValue,
      session.title,
      session.color,
      session.startAt,
      session.endAt,
      session.minutes,
      session.status,
      session.endReason,
      session.note,
      session.focusSessionId,
      session.createdAt,
      session.updatedAt,
    ]);
  }

  function preferSession(left, right) {
    if (!left) return right;
    if (!right) return left;
    if (left.updatedAt !== right.updatedAt) return left.updatedAt > right.updatedAt ? left : right;
    const leftPriority = terminalPriority(left.status);
    const rightPriority = terminalPriority(right.status);
    if (leftPriority !== rightPriority) return leftPriority > rightPriority ? left : right;
    return sessionSignature(left).localeCompare(sessionSignature(right)) >= 0 ? left : right;
  }

  function normalizeActivitySession(raw, now) {
    void now;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = stableId(raw.id);
    const type = SESSION_TYPES.has(raw.type) ? raw.type : (stableId(raw.habitId) ? "habit" : "task");
    const taskId = stableId(raw.taskId);
    const habitId = stableId(raw.habitId);
    const habitMetricType = HABIT_METRIC_TYPES.has(raw.habitMetricType) ? raw.habitMetricType : null;
    if (!id || (type === "task" ? !taskId : !habitId || !habitMetricType)) return null;

    const startAt = timestamp(raw.startAt);
    if (!Number.isFinite(startAt)) return null;
    const rawEndAt = raw.endAt === null || raw.endAt === undefined ? NaN : timestamp(raw.endAt);
    const hasValidEnd = Number.isFinite(rawEndAt) && rawEndAt >= startAt;
    const hasBackwardEnd = Number.isFinite(rawEndAt) && rawEndAt < startAt;
    const requestedStatus = SESSION_STATUSES.has(raw.status) ? raw.status : null;
    let status = requestedStatus || (hasValidEnd ? "completed" : "running");
    let endAt = hasValidEnd ? rawEndAt : null;
    let endReason = END_REASONS.has(raw.endReason) ? raw.endReason : null;

    if (hasBackwardEnd || (status === "completed" && !hasValidEnd)) {
      status = "cancelled";
      endAt = null;
      endReason = "recovered";
    } else if (status === "running" && hasValidEnd) {
      status = "completed";
      endReason = END_REASONS.has(endReason) && endReason !== "cancelled" ? endReason : "recovered";
    } else if (status === "running") {
      endAt = null;
      endReason = null;
    } else if (status === "completed") {
      endReason = END_REASONS.has(endReason) && endReason !== "cancelled" ? endReason : "manual";
    } else {
      endAt = hasValidEnd ? rawEndAt : null;
      endReason = END_REASONS.has(endReason) ? endReason : "cancelled";
    }

    const createdAtValue = timestamp(raw.createdAt);
    const createdAt = Number.isFinite(createdAtValue) ? createdAtValue : startAt;
    const updatedAtValue = timestamp(raw.updatedAt);
    const updatedAt = Math.max(
      Number.isFinite(updatedAtValue) ? updatedAtValue : createdAt,
      createdAt,
      startAt,
      endAt === null ? 0 : endAt
    );

    return {
      id,
      type,
      taskId: type === "task" ? taskId : null,
      title: stableString(raw.title, "未命名任务"),
      color: stableString(raw.color, "sage") || "sage",
      startAt,
      endAt,
      minutes: status === "completed" ? calculateMinutes(startAt, endAt) : 0,
      status,
      endReason,
      note: stableString(raw.note),
      focusSessionId: stableId(raw.focusSessionId),
      createdAt,
      updatedAt,
      ...(type === "habit" ? {
        habitId,
        habitMetricType,
        habitValue: status === "completed"
          ? habitMetricType === "duration"
            ? calculateMinutes(startAt, endAt)
            : Number.isFinite(Number(raw.habitValue)) && Number(raw.habitValue) >= 0 ? Number(raw.habitValue) : 1
          : status === "running" && habitMetricType === "count" ? 1 : 0,
      } : {}),
    };
  }

  function stableSessionSort(left, right) {
    return left.startAt - right.startAt
      || left.createdAt - right.createdAt
      || left.id.localeCompare(right.id);
  }

  function normalizeActivitySessions(rawSessions, now) {
    if (!Array.isArray(rawSessions)) return [];
    const byId = new Map();
    rawSessions.forEach((raw) => {
      const normalized = normalizeActivitySession(raw, now);
      if (!normalized) return;
      byId.set(normalized.id, preferSession(byId.get(normalized.id), normalized));
    });
    const sessions = [...byId.values()];
    const running = sessions
      .filter((session) => session.status === "running")
      .sort((left, right) => right.updatedAt - left.updatedAt
        || right.startAt - left.startAt
        || left.id.localeCompare(right.id));
    const keeperId = running[0]?.id || null;
    return sessions.map((session) => {
      if (session.status !== "running" || session.id === keeperId) return { ...session };
      return {
        ...session,
        endAt: null,
        minutes: 0,
        status: "cancelled",
        endReason: "recovered",
        ...(session.type === "habit" ? { habitValue: 0 } : {}),
      };
    }).sort(stableSessionSort);
  }

  function repairActiveActivitySessionId(sessions, activeId) {
    const items = Array.isArray(sessions) ? sessions : [];
    const requestedId = stableId(activeId);
    if (requestedId && items.some((session) => session?.id === requestedId && session.status === "running")) {
      return requestedId;
    }
    const running = items.filter((session) => session?.status === "running");
    return running.length === 1 ? stableId(running[0].id) : null;
  }

  function getRunningActivitySession(sessions, activeId) {
    const repairedId = repairActiveActivitySessionId(sessions, activeId);
    if (!repairedId) return null;
    const session = (Array.isArray(sessions) ? sessions : []).find((item) => item?.id === repairedId && item.status === "running");
    return session ? { ...session } : null;
  }

  function unchangedResult(sessions, activeActivitySessionId, reason) {
    return {
      ok: false,
      changed: false,
      reason,
      sessions,
      activeActivitySessionId,
      session: null,
    };
  }

  function validateTask(task) {
    if (!task || typeof task !== "object" || Array.isArray(task)) return null;
    const taskId = stableId(task.id);
    if (!taskId) return null;
    return {
      taskId,
      title: stableString(task.title, "未命名任务"),
      color: stableString(task.color, "sage") || "sage",
    };
  }

  function createSessionId(idFactory, task, now) {
    if (typeof idFactory !== "function") return null;
    try {
      return stableId(idFactory({ task, now }));
    } catch {
      return null;
    }
  }

  function validateHabit(habit) {
    if (!habit || typeof habit !== "object" || Array.isArray(habit)) return null;
    const habitId = stableId(habit.id);
    if (!habitId || !HABIT_METRIC_TYPES.has(habit.metricType) || (habit.archivedAt !== null && habit.archivedAt !== undefined)) return null;
    return {
      habitId,
      habitMetricType: habit.metricType,
      title: stableString(habit.title, "未命名习惯"),
      color: stableString(habit.color, "sage") || "sage",
    };
  }

  function startTaskActivity(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    if (!Number.isFinite(now)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TIME");
    const task = validateTask(input.task);
    if (!task) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TASK");
    if (getRunningActivitySession(sessions, activeActivitySessionId)) {
      return unchangedResult(sessions, activeActivitySessionId, "ALREADY_RUNNING");
    }
    const id = createSessionId(input.idFactory, input.task, now);
    if (!id || sessions.some((session) => session.id === id)) {
      return unchangedResult(sessions, activeActivitySessionId, "INVALID_ID");
    }
    const session = {
      id,
      type: "task",
      taskId: task.taskId,
      title: task.title,
      color: task.color,
      startAt: now,
      endAt: null,
      minutes: 0,
      status: "running",
      endReason: null,
      note: "",
      focusSessionId: null,
      createdAt: now,
      updatedAt: now,
    };
    return {
      ok: true,
      changed: true,
      reason: null,
      sessions: [...sessions, session].sort(stableSessionSort),
      activeActivitySessionId: id,
      session: { ...session },
    };
  }

  function startHabitActivity(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    if (!Number.isFinite(now)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TIME");
    const habit = validateHabit(input.habit);
    if (!habit) return unchangedResult(sessions, activeActivitySessionId, "INVALID_HABIT");
    if (getRunningActivitySession(sessions, activeActivitySessionId)) return unchangedResult(sessions, activeActivitySessionId, "ALREADY_RUNNING");
    const id = createSessionId(input.idFactory, input.habit, now);
    if (!id || sessions.some((session) => session.id === id)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_ID");
    const session = {
      id,
      type: "habit",
      taskId: null,
      habitId: habit.habitId,
      habitMetricType: habit.habitMetricType,
      habitValue: habit.habitMetricType === "count" ? 1 : 0,
      title: habit.title,
      color: habit.color,
      startAt: now,
      endAt: null,
      minutes: 0,
      status: "running",
      endReason: null,
      note: "",
      focusSessionId: null,
      createdAt: now,
      updatedAt: now,
    };
    return {
      ok: true,
      changed: true,
      reason: null,
      sessions: [...sessions, session].sort(stableSessionSort),
      activeActivitySessionId: id,
      session: { ...session },
    };
  }

  function completeActivitySession(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    const running = getRunningActivitySession(sessions, activeActivitySessionId);
    if (!running) return unchangedResult(sessions, activeActivitySessionId, "NO_RUNNING_SESSION");
    if (!Number.isFinite(now) || now < running.startAt) {
      return unchangedResult(sessions, activeActivitySessionId, "INVALID_END_TIME");
    }
    const durationMs = now - running.startAt;
    const requestedReason = END_REASONS.has(input.endReason) && input.endReason !== "cancelled"
      ? input.endReason
      : "manual";
    const completed = {
      ...running,
      endAt: now,
      minutes: calculateMinutes(running.startAt, now),
      status: "completed",
      endReason: requestedReason,
      updatedAt: Math.max(running.updatedAt, now),
    };
    if (completed.type === "habit") {
      completed.habitValue = completed.habitMetricType === "duration"
        ? completed.minutes
        : Math.max(0, Number(completed.habitValue) || 1);
    }
    return {
      ok: true,
      changed: true,
      reason: null,
      shortSession: durationMs < 60000,
      sessions: sessions.map((session) => session.id === completed.id ? completed : { ...session }),
      activeActivitySessionId: null,
      session: { ...completed },
    };
  }

  function cancelActivitySession(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    const running = getRunningActivitySession(sessions, activeActivitySessionId);
    if (!running) return unchangedResult(sessions, activeActivitySessionId, "NO_RUNNING_SESSION");
    if (!Number.isFinite(now) || now < running.startAt) {
      return unchangedResult(sessions, activeActivitySessionId, "INVALID_END_TIME");
    }
    const endReason = ["cancelled", "recovered"].includes(input.endReason) ? input.endReason : "cancelled";
    const cancelled = {
      ...running,
      endAt: now,
      minutes: 0,
      status: "cancelled",
      endReason,
      updatedAt: Math.max(running.updatedAt, now),
    };
    if (cancelled.type === "habit") cancelled.habitValue = 0;
    return {
      ok: true,
      changed: true,
      reason: null,
      sessions: sessions.map((session) => session.id === cancelled.id ? cancelled : { ...session }),
      activeActivitySessionId: null,
      session: { ...cancelled },
    };
  }

  function switchTaskActivity(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    if (!Number.isFinite(now)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TIME");
    const task = validateTask(input.task);
    if (!task) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TASK");
    const id = createSessionId(input.idFactory, input.task, now);
    if (!id || sessions.some((session) => session.id === id)) {
      return unchangedResult(sessions, activeActivitySessionId, "INVALID_ID");
    }

    const running = getRunningActivitySession(sessions, activeActivitySessionId);
    let nextSessions = sessions;
    let previousSession = null;
    let shortSession = false;
    if (running) {
      if (now < running.startAt) return unchangedResult(sessions, activeActivitySessionId, "INVALID_END_TIME");
      const completed = completeActivitySession({
        sessions,
        activeActivitySessionId,
        now,
        endReason: "switched",
      });
      if (!completed.ok) return completed;
      nextSessions = completed.sessions;
      previousSession = completed.session;
      shortSession = completed.shortSession;
    }
    const started = startTaskActivity({
      sessions: nextSessions,
      activeActivitySessionId: null,
      task: input.task,
      now,
      idFactory: () => id,
    });
    if (!started.ok) return unchangedResult(sessions, activeActivitySessionId, started.reason);
    return {
      ...started,
      switched: Boolean(running),
      previousSession,
      shortSession,
    };
  }

  function switchHabitActivity(input = {}) {
    const now = timestamp(input.now);
    const sessions = normalizeActivitySessions(input.sessions, input.now);
    const activeActivitySessionId = repairActiveActivitySessionId(sessions, input.activeActivitySessionId);
    if (!Number.isFinite(now)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_TIME");
    const habit = validateHabit(input.habit);
    if (!habit) return unchangedResult(sessions, activeActivitySessionId, "INVALID_HABIT");
    const id = createSessionId(input.idFactory, input.habit, now);
    if (!id || sessions.some((session) => session.id === id)) return unchangedResult(sessions, activeActivitySessionId, "INVALID_ID");
    const running = getRunningActivitySession(sessions, activeActivitySessionId);
    let nextSessions = sessions;
    let previousSession = null;
    let shortSession = false;
    if (running) {
      const completed = completeActivitySession({ sessions, activeActivitySessionId, now, endReason: "switched" });
      if (!completed.ok) return completed;
      nextSessions = completed.sessions;
      previousSession = completed.session;
      shortSession = completed.shortSession;
    }
    const started = startHabitActivity({ sessions: nextSessions, activeActivitySessionId: null, habit: input.habit, now, idFactory: () => id });
    if (!started.ok) return unchangedResult(sessions, activeActivitySessionId, started.reason);
    return { ...started, switched: Boolean(running), previousSession, shortSession };
  }

  function mergeActivitySessions(localSessions, remoteSessions) {
    const local = normalizeActivitySessions(localSessions, 0);
    const remote = normalizeActivitySessions(remoteSessions, 0);
    const byId = new Map();
    [...local, ...remote].forEach((session) => {
      byId.set(session.id, preferSession(byId.get(session.id), session));
    });
    return normalizeActivitySessions([...byId.values()], 0);
  }

  return {
    normalizeActivitySession,
    normalizeActivitySessions,
    repairActiveActivitySessionId,
    getRunningActivitySession,
    startTaskActivity,
    startHabitActivity,
    completeActivitySession,
    cancelActivitySession,
    switchTaskActivity,
    switchHabitActivity,
    mergeActivitySessions,
  };
});
