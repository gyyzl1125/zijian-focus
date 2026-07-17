(function exposeDailyPlanner(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DailyPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDailyPlanner() {
  "use strict";

  const FIVE_MINUTES = 5 * 60 * 1000;
  const TEN_MINUTES = 10 * 60 * 1000;
  const MIN_FOCUS_MINUTES = 20;
  const DEFAULT_FOCUS_MINUTES = 25;
  const MIN_TARGET_MINUTES = 25;
  const MAX_TARGET_MINUTES = 50;
  const RECENT_FOCUS_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function asTimestamp(value) {
    const timestamp = value instanceof Date ? value.getTime() : Number(value);
    return Number.isFinite(timestamp) ? timestamp : NaN;
  }

  function startOfLocalDay(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function localTimeOnDay(dayStart, value, fallbackHour) {
    if (Number.isFinite(value)) return dayStart + Number(value) * 60 * 1000;
    const text = typeof value === "string" ? value.trim() : "";
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return dayStart + fallbackHour * 60 * 60 * 1000;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return dayStart + fallbackHour * 60 * 60 * 1000;
    return dayStart + (hour * 60 + minute) * 60 * 1000;
  }

  function ceilToFiveMinutes(timestamp) {
    return Math.ceil(timestamp / FIVE_MINUTES) * FIVE_MINUTES;
  }

  function roundToFiveMinutes(minutes) {
    return Math.round(minutes / 5) * 5;
  }

  function floorToFiveMinutes(minutes) {
    return Math.floor(minutes / 5) * 5;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function dateKey(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatClock(timestamp) {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function formatDateTime(timestamp) {
    return `${dateKey(timestamp)} ${formatClock(timestamp)}`;
  }

  function stableText(value) {
    return value === undefined || value === null ? "" : String(value);
  }

  function isFixedTimeTask(task, fixedTaskIds = new Set()) {
    if (!task || typeof task !== "object") return false;
    const id = stableText(task.id);
    const scheduleType = stableText(task.scheduleType || task.timeType || task.intervalType).toLowerCase();
    if (task.deadlineOnly === true || task.fixedTime === false || task.isFixedTime === false) return false;
    if (["deadline", "ddl", "flexible"].includes(scheduleType)) return false;
    return fixedTaskIds.has(id)
      || task.fixedTime === true
      || task.isFixedTime === true
      || ["fixed", "calendar", "appointment"].includes(scheduleType);
  }

  function clipInterval(item, rangeStart, rangeEnd, kind, index) {
    const startAt = asTimestamp(item && item.startAt);
    const endAt = asTimestamp(item && item.endAt);
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return null;
    const clippedStart = Math.max(rangeStart, startAt);
    const clippedEnd = Math.min(rangeEnd, endAt);
    if (clippedEnd <= clippedStart) return null;
    return {
      startAt: clippedStart,
      endAt: clippedEnd,
      kind,
      sourceId: stableText(item.id) || `${kind}-${index}`,
      title: stableText(item.title) || (kind === "course" ? "未命名课程" : "未命名安排"),
    };
  }

  function mergeIntervals(intervals) {
    const sorted = intervals
      .map((interval) => ({ ...interval }))
      .sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt || stableText(a.sourceId).localeCompare(stableText(b.sourceId)));
    const merged = [];
    for (const interval of sorted) {
      const previous = merged[merged.length - 1];
      if (!previous || interval.startAt > previous.endAt) {
        merged.push({ startAt: interval.startAt, endAt: interval.endAt });
      } else {
        previous.endAt = Math.max(previous.endAt, interval.endAt);
      }
    }
    return merged;
  }

  function findFreeIntervals(rangeStart, rangeEnd, busyIntervals) {
    if (rangeEnd <= rangeStart) return [];
    const free = [];
    let cursor = rangeStart;
    for (const interval of mergeIntervals(busyIntervals)) {
      if (interval.endAt <= rangeStart || interval.startAt >= rangeEnd) continue;
      const startAt = Math.max(rangeStart, interval.startAt);
      const endAt = Math.min(rangeEnd, interval.endAt);
      if (startAt > cursor) free.push({ startAt: cursor, endAt: startAt });
      cursor = Math.max(cursor, endAt);
    }
    if (cursor < rangeEnd) free.push({ startAt: cursor, endAt: rangeEnd });
    return free;
  }

  function completedFocusMinutes(session) {
    const explicit = Number(session && session.minutes);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const startAt = asTimestamp(session && session.startAt);
    const endAt = asTimestamp(session && session.endAt);
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return NaN;
    return (endAt - startAt) / 60000;
  }

  function focusTargetMinutes(focusSessions, now) {
    const recentStart = now - RECENT_FOCUS_DAYS * DAY_MS;
    const durations = (Array.isArray(focusSessions) ? focusSessions : [])
      .filter((session) => {
        const endAt = asTimestamp(session && session.endAt);
        return Number.isFinite(endAt) && endAt <= now && endAt >= recentStart;
      })
      .map(completedFocusMinutes)
      .filter((minutes) => Number.isFinite(minutes) && minutes > 0)
      .sort((a, b) => a - b);
    if (durations.length === 0) return DEFAULT_FOCUS_MINUTES;
    const middle = Math.floor(durations.length / 2);
    const median = durations.length % 2 === 1
      ? durations[middle]
      : (durations[middle - 1] + durations[middle]) / 2;
    return clamp(roundToFiveMinutes(median), MIN_TARGET_MINUTES, MAX_TARGET_MINUTES);
  }

  function taskPriority(task, index, now, dayStart, dayEnd) {
    const startAt = asTimestamp(task.startAt);
    const deadlineAt = asTimestamp(task.endAt);
    const overdue = Number.isFinite(deadlineAt) && deadlineAt < now;
    const dueToday = Number.isFinite(deadlineAt) && deadlineAt >= dayStart && deadlineAt < dayEnd;
    const dueSoon = Number.isFinite(deadlineAt) && deadlineAt >= now && deadlineAt <= now + 72 * 60 * 60 * 1000;
    const active = Number.isFinite(startAt) && Number.isFinite(deadlineAt) && startAt <= now && deadlineAt >= now;
    const id = stableText(task.id);
    const title = stableText(task.title) || "未命名任务";
    const createdAt = asTimestamp(task.createdAt);
    return {
      originalIndex: index,
      taskId: id || null,
      title,
      startAt: Number.isFinite(startAt) ? startAt : null,
      deadlineAt: Number.isFinite(deadlineAt) ? deadlineAt : null,
      overdue,
      dueToday,
      dueSoon,
      active,
      createdAt: Number.isFinite(createdAt) ? createdAt : Number.POSITIVE_INFINITY,
      stableId: id || `input-${String(index).padStart(6, "0")}`,
    };
  }

  function comparePriorities(a, b) {
    return Number(b.overdue) - Number(a.overdue)
      || Number(b.dueToday) - Number(a.dueToday)
      || Number(b.dueSoon) - Number(a.dueSoon)
      || Number(b.active) - Number(a.active)
      || (a.deadlineAt ?? Number.POSITIVE_INFINITY) - (b.deadlineAt ?? Number.POSITIVE_INFINITY)
      || a.createdAt - b.createdAt
      || a.stableId.localeCompare(b.stableId)
      || a.originalIndex - b.originalIndex;
  }

  function priorityReasons(priority, now) {
    const reasons = [];
    if (priority.overdue) {
      const overdueDays = Math.max(1, Math.ceil((now - priority.deadlineAt) / DAY_MS));
      reasons.push(`已逾期 ${overdueDays} 天`);
    } else if (priority.dueToday) {
      reasons.push(`今天 ${formatClock(priority.deadlineAt)} 截止`);
    } else if (priority.dueSoon) {
      reasons.push("72 小时内截止");
    } else if (priority.deadlineAt !== null) {
      reasons.push(`${formatDateTime(priority.deadlineAt)} 截止`);
    } else {
      reasons.push("未设置有效截止时间");
    }
    if (priority.active) reasons.push("当前处于任务时间窗口");
    return reasons;
  }

  function conflictCode(first, second) {
    const kinds = [first.kind, second.kind].sort().join(":");
    if (kinds === "course:course") return "COURSE_COURSE_CONFLICT";
    if (kinds === "course:task") return "TASK_COURSE_CONFLICT";
    if (kinds === "task:task") return "TASK_TASK_CONFLICT";
    return "FIXED_INTERVAL_CONFLICT";
  }

  function conflictWarnings(intervals) {
    const sorted = intervals.slice().sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt || a.sourceId.localeCompare(b.sourceId));
    const warnings = [];
    for (let firstIndex = 0; firstIndex < sorted.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < sorted.length; secondIndex += 1) {
        const first = sorted[firstIndex];
        const second = sorted[secondIndex];
        if (second.startAt >= first.endAt) break;
        warnings.push({
          code: conflictCode(first, second),
          severity: "warning",
          message: `${first.title} 与 ${second.title} 的固定时段冲突`,
          sourceIds: [first.sourceId, second.sourceId],
        });
      }
    }
    return warnings;
  }

  function invalidIntervalWarning(kind, item, index) {
    return {
      code: "INVALID_INTERVAL",
      severity: "warning",
      message: `${stableText(item && item.title) || (kind === "course" ? "课程" : "安排")} 的开始或结束时间无效`,
      sourceIds: [stableText(item && item.id) || `${kind}-${index}`],
    };
  }

  function taskTimeSemantics(task) {
    const values = [task?.scheduleType, task?.timeType, task?.intervalType]
      .map((value) => stableText(value).trim().toLowerCase())
      .filter(Boolean);
    if (values.some((value) => ["fixed", "calendar", "appointment"].includes(value))) return "fixed";
    if (values.some((value) => ["deadline", "ddl", "flexible"].includes(value))) return "deadline";
    return "legacy";
  }

  function sprintTimestamp(value) {
    if (value === null || value === undefined || value === "") return NaN;
    return asTimestamp(value);
  }

  function resolveTaskDeadline(task) {
    if (!task || typeof task !== "object" || Array.isArray(task) || task.done === true) return NaN;
    const explicitDeadline = sprintTimestamp(task.deadlineAt);
    if (Number.isFinite(explicitDeadline)) return explicitDeadline;
    if (taskTimeSemantics(task) === "fixed" && task.deadlineOnly !== true) return NaN;
    return sprintTimestamp(task.endAt);
  }

  function getTaskDeadlineAt(task, now) {
    const timestamp = sprintTimestamp(now);
    if (!Number.isFinite(timestamp)) return null;
    const deadlineAt = resolveTaskDeadline(task);
    return Number.isFinite(deadlineAt) && deadlineAt > timestamp ? deadlineAt : null;
  }

  function sprintWarning(code, message, sourceIds = [], severity = "warning") {
    return {
      code,
      severity,
      message: stableText(message),
      sourceIds: sourceIds.map(stableText).filter(Boolean),
    };
  }

  function nextLocalDay(dayStart) {
    const date = new Date(dayStart);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  }

  function localHourOnDay(dayStart, hour) {
    const date = new Date(dayStart);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0).getTime();
  }

  function normalizedSprintOptions(input) {
    const focus = Number(input.focusMinutes ?? 45);
    const rest = Number(input.breakMinutes ?? 10);
    const minimum = Number(input.minimumBlockMinutes ?? 20);
    const maximum = Number(input.maxCandidates ?? 8);
    const startHour = Number(input.dailyWindow?.startHour ?? 7);
    const endHour = Number(input.dailyWindow?.endHour ?? 22);
    if (!Number.isFinite(focus) || !Number.isFinite(rest) || !Number.isFinite(minimum)
      || !Number.isFinite(maximum)) throw new TypeError("deadline sprint options must be finite numbers");
    if (focus <= 0 || rest < 0 || minimum <= 0 || maximum <= 0) {
      throw new RangeError("deadline sprint durations and candidate limit must be positive");
    }
    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)
      || startHour < 0 || endHour > 24 || endHour <= startHour) {
      throw new RangeError("deadline sprint daily window must use valid local hours");
    }
    const minimumBlockMinutes = Math.max(5, Math.ceil(minimum / 5) * 5);
    return {
      focusMinutes: Math.max(minimumBlockMinutes, floorToFiveMinutes(focus)),
      breakMinutes: Math.ceil(rest / 5) * 5,
      minimumBlockMinutes,
      maxCandidates: Math.max(1, Math.floor(maximum)),
      startHour,
      endHour,
    };
  }

  function sprintBaseResult(now, task, deadlineAt, options, warnings = []) {
    const taskId = task && task.id !== undefined && task.id !== null ? stableText(task.id) : null;
    return {
      version: 1,
      mode: "deadline-sprint",
      generated_at: now,
      taskId,
      title: stableText(task && task.title) || "未命名任务",
      deadlineAt: Number.isFinite(deadlineAt) ? deadlineAt : null,
      focusMinutes: options.focusMinutes,
      breakMinutes: options.breakMinutes,
      candidates: [],
      warnings,
      totalCandidateMinutes: 0,
      candidateCount: 0,
      intensityLevel: "low",
    };
  }

  function buildDeadlineSprintCandidates(input = {}) {
    const now = sprintTimestamp(input.now);
    if (!Number.isFinite(now)) throw new TypeError("buildDeadlineSprintCandidates requires a finite now timestamp");
    const options = normalizedSprintOptions(input);
    const task = input.task;
    const taskId = task && task.id !== undefined && task.id !== null ? stableText(task.id).trim() : "";
    if (!task || typeof task !== "object" || Array.isArray(task) || task.done === true || !taskId) {
      return sprintBaseResult(now, task, NaN, options, [
        sprintWarning("INVALID_TASK", "请选择一个有效且未完成的任务", taskId ? [taskId] : [], "error"),
      ]);
    }

    const resolvedDeadline = resolveTaskDeadline(task);
    if (!Number.isFinite(resolvedDeadline)) {
      return sprintBaseResult(now, task, NaN, options, [
        sprintWarning("NO_DEADLINE", "任务没有可用于截止前冲刺的截止时间", [taskId], "error"),
      ]);
    }
    const requestedDeadline = sprintTimestamp(input.deadlineAt);
    const deadlineAt = Number.isFinite(requestedDeadline) ? requestedDeadline : resolvedDeadline;
    if (deadlineAt <= now) {
      return sprintBaseResult(now, task, deadlineAt, options, [
        sprintWarning("DEADLINE_PASSED", "任务截止时间已经过去", [taskId], "error"),
      ]);
    }

    const planningStartAt = ceilToFiveMinutes(now);
    const dailyRanges = [];
    for (let dayStart = startOfLocalDay(planningStartAt); dayStart < deadlineAt; dayStart = nextLocalDay(dayStart)) {
      const windowStartAt = localHourOnDay(dayStart, options.startHour);
      const windowEndAt = options.endHour === 24 ? nextLocalDay(dayStart) : localHourOnDay(dayStart, options.endHour);
      const startAt = Math.max(planningStartAt, windowStartAt);
      const endAt = Math.min(deadlineAt, windowEndAt);
      if (endAt > startAt) dailyRanges.push({ startAt, endAt });
    }

    const result = sprintBaseResult(now, task, deadlineAt, options);
    const sourceGroups = [
      { items: Array.isArray(input.courses) ? input.courses : [], kind: "course", fixedOnly: false },
      { items: Array.isArray(input.fixedTasks) ? input.fixedTasks : [], kind: "task", fixedOnly: true },
      { items: Array.isArray(input.adoptedBlocks) ? input.adoptedBlocks : [], kind: "focus-plan", fixedOnly: false },
    ];
    const busyIntervals = [];
    sourceGroups.forEach(({ items, kind, fixedOnly }) => {
      items.forEach((item, index) => {
        if (fixedOnly && !isFixedTimeTask(item)) return;
        const startAt = sprintTimestamp(item && item.startAt);
        const endAt = sprintTimestamp(item && item.endAt);
        if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
          result.warnings.push(sprintWarning(
            "INVALID_INTERVAL",
            `${stableText(item && item.title) || "安排"} 的开始或结束时间无效`,
            [stableText(item && item.id) || `${kind}-${index}`]
          ));
          return;
        }
        if (endAt <= planningStartAt || startAt >= deadlineAt) return;
        busyIntervals.push({ startAt, endAt, kind, sourceId: stableText(item.id) || `${kind}-${index}` });
      });
    });

    const totalWindowMinutes = dailyRanges.reduce((sum, range) => sum + (range.endAt - range.startAt) / 60000, 0);
    if (totalWindowMinutes < options.minimumBlockMinutes) {
      result.warnings.push(sprintWarning(
        "INSUFFICIENT_TIME",
        `截止前没有至少 ${options.minimumBlockMinutes} 分钟的可安排时间`,
        [taskId]
      ));
      return result;
    }

    const sprintId = [
      "sprint",
      encodeURIComponent(taskId),
      deadlineAt,
      options.focusMinutes,
      options.breakMinutes,
      options.minimumBlockMinutes,
      `${options.startHour}-${options.endHour}`,
    ].join(":");
    let nextCandidateStartAt = planningStartAt;
    let limitReached = false;

    outer: for (const range of dailyRanges) {
      const clippedBusy = busyIntervals
        .map((interval) => ({
          startAt: Math.max(range.startAt, interval.startAt),
          endAt: Math.min(range.endAt, interval.endAt),
        }))
        .filter((interval) => interval.endAt > interval.startAt);
      const freeIntervals = findFreeIntervals(range.startAt, range.endAt, clippedBusy);
      for (const free of freeIntervals) {
        let cursor = ceilToFiveMinutes(Math.max(free.startAt, nextCandidateStartAt));
        while (cursor < free.endAt) {
          const availableMinutes = floorToFiveMinutes((free.endAt - cursor) / 60000);
          if (availableMinutes < options.minimumBlockMinutes) break;
          if (result.candidates.length >= options.maxCandidates) {
            limitReached = true;
            break outer;
          }
          const minutes = Math.min(options.focusMinutes, availableMinutes);
          const endAt = cursor + minutes * 60000;
          const sequence = result.candidates.length + 1;
          result.candidates.push({
            id: `${sprintId}:${cursor}:${endAt}`,
            taskId,
            title: `截止前冲刺 · ${stableText(task.title) || "未命名任务"}`,
            startAt: cursor,
            endAt,
            minutes,
            planningMode: "deadline-sprint",
            sprintId,
            deadlineAt,
            sequence,
          });
          nextCandidateStartAt = endAt + options.breakMinutes * 60000;
          cursor = ceilToFiveMinutes(Math.max(nextCandidateStartAt, free.startAt));
        }
      }
    }

    if (result.candidates.length === options.maxCandidates) limitReached = true;
    if (result.candidates.length === 0) {
      result.warnings.push(sprintWarning(
        "NO_AVAILABLE_SLOT",
        `截止前没有至少 ${options.minimumBlockMinutes} 分钟的空闲时段`,
        [taskId]
      ));
    }
    if (limitReached) {
      result.warnings.push(sprintWarning(
        "CANDIDATE_LIMIT_REACHED",
        `候选时段已达到 ${options.maxCandidates} 个上限`,
        [taskId],
        "info"
      ));
    }
    result.totalCandidateMinutes = result.candidates.reduce((sum, candidate) => sum + candidate.minutes, 0);
    result.candidateCount = result.candidates.length;
    result.intensityLevel = result.totalCandidateMinutes <= 90
      ? "low"
      : result.totalCandidateMinutes <= 180 ? "moderate" : "high";
    return result;
  }

  function buildDailyPlan(input = {}) {
    const now = asTimestamp(input.now);
    if (!Number.isFinite(now)) throw new TypeError("buildDailyPlan requires a finite now timestamp");

    const tasks = Array.isArray(input.tasks) ? input.tasks : [];
    const habits = Array.isArray(input.habits) ? input.habits : [];
    const courses = Array.isArray(input.courses) ? input.courses : [];
    const focusSessions = Array.isArray(input.focusSessions) ? input.focusSessions : [];
    const adoptedBlocks = Array.isArray(input.adoptedBlocks) ? input.adoptedBlocks : [];
    const fixedTaskIds = new Set((Array.isArray(input.fixedTaskIds) ? input.fixedTaskIds : []).map(stableText));
    const dayStart = startOfLocalDay(now);
    const nextDayStart = new Date(new Date(dayStart).getFullYear(), new Date(dayStart).getMonth(), new Date(dayStart).getDate() + 1).getTime();
    const windowStartAt = localTimeOnDay(dayStart, input.windowStart, 7);
    const windowEndAt = localTimeOnDay(dayStart, input.windowEnd, 22);
    if (windowEndAt <= windowStartAt) throw new RangeError("planning window end must be after its start");
    const planningStartAt = Math.max(windowStartAt, ceilToFiveMinutes(now));
    const warnings = [];

    const taskPriorities = tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task && task.done !== true)
      .map(({ task, index }) => taskPriority(task, index, now, dayStart, nextDayStart))
      .sort(comparePriorities)
      .map((priority, index) => ({
        rank: index + 1,
        taskId: priority.taskId,
        title: priority.title,
        startAt: priority.startAt,
        deadlineAt: priority.deadlineAt,
        overdue: priority.overdue,
        reasons: priorityReasons(priority, now),
        _stableId: priority.stableId,
      }));
    const habitPriorities = habits
      .filter((habit) => habit && habit.includeInPlanner === true && habit.scheduledToday === true
        && habit.completed !== true && stableText(habit.id).trim())
      .map((habit, index) => ({
        rank: taskPriorities.length + index + 1,
        taskId: null,
        habitId: stableText(habit.id).trim(),
        planningEntityType: "habit",
        title: stableText(habit.title) || "未命名习惯",
        startAt: null,
        deadlineAt: null,
        overdue: false,
        remainingMinutes: habit.metricType === "duration" && Number.isFinite(Number(habit.remainingValue))
          ? Math.max(0, Number(habit.remainingValue))
          : null,
        reasons: ["今日习惯尚未达标"],
        _stableId: `habit:${stableText(habit.id).trim()}`,
      }));
    const openPriorities = [...taskPriorities, ...habitPriorities]
      .slice(0, 3)
      .map((priority, index) => ({ ...priority, rank: index + 1 }));

    tasks.forEach((task, index) => {
      if (!task || task.done === true) return;
      const startAt = asTimestamp(task.startAt);
      const deadlineAt = asTimestamp(task.endAt);
      if (!Number.isFinite(startAt) || !Number.isFinite(deadlineAt) || deadlineAt <= startAt) {
        warnings.push(invalidIntervalWarning("task", task, index));
      }
      if (Number.isFinite(deadlineAt) && deadlineAt < now) {
        warnings.push({
          code: "OVERDUE_TASK",
          severity: "warning",
          message: `${stableText(task.title) || "未命名任务"} 已逾期`,
          sourceIds: [stableText(task.id) || `task-${index}`],
        });
      }
    });

    const hardIntervals = [];
    courses.forEach((course, index) => {
      const startAt = asTimestamp(course && course.startAt);
      const endAt = asTimestamp(course && course.endAt);
      if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
        warnings.push(invalidIntervalWarning("course", course, index));
        return;
      }
      const interval = clipInterval(course, windowStartAt, windowEndAt, "course", index);
      if (interval) hardIntervals.push(interval);
    });
    tasks.forEach((task, index) => {
      if (!task || task.done === true || !isFixedTimeTask(task, fixedTaskIds)) return;
      const startAt = asTimestamp(task.startAt);
      const endAt = asTimestamp(task.endAt);
      if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return;
      const interval = clipInterval(task, windowStartAt, windowEndAt, "task", index);
      if (interval) hardIntervals.push(interval);
    });
    adoptedBlocks.forEach((block, index) => {
      const startAt = asTimestamp(block && block.startAt);
      const endAt = asTimestamp(block && block.endAt);
      if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
        warnings.push(invalidIntervalWarning("focus-plan", block, index));
        return;
      }
      const interval = clipInterval(block, windowStartAt, windowEndAt, "focus-plan", index);
      if (interval) hardIntervals.push(interval);
    });
    warnings.push(...conflictWarnings(hardIntervals));

    const targetMinutes = focusTargetMinutes(focusSessions, now);
    const freeIntervals = findFreeIntervals(planningStartAt, windowEndAt, hardIntervals);
    const blocks = [];
    let nextFocusStartAt = planningStartAt;

    for (const priority of openPriorities) {
      let selected = null;
      const latestEndAt = !priority.overdue && priority.deadlineAt !== null
        ? Math.min(windowEndAt, priority.deadlineAt)
        : windowEndAt;
      for (const free of freeIntervals) {
        const startAt = ceilToFiveMinutes(Math.max(free.startAt, nextFocusStartAt));
        const availableEndAt = Math.min(free.endAt, latestEndAt);
        const availableMinutes = floorToFiveMinutes((availableEndAt - startAt) / 60000);
        const minimumMinutes = priority.habitId ? 5 : MIN_FOCUS_MINUTES;
        const cappedMinutes = priority.habitId && Number.isFinite(priority.remainingMinutes)
          ? Math.min(targetMinutes, availableMinutes, floorToFiveMinutes(priority.remainingMinutes))
          : Math.min(targetMinutes, availableMinutes);
        if (availableMinutes < minimumMinutes || cappedMinutes < minimumMinutes) continue;
        const minutes = cappedMinutes;
        selected = { startAt, endAt: startAt + minutes * 60000, minutes };
        break;
      }
      if (!selected) {
        warnings.push({
          code: "NO_FOCUS_SLOT",
          severity: "warning",
          message: `${priority.title} 没有至少 20 分钟的可用专注时段`,
          sourceIds: priority.taskId ? [priority.taskId] : priority.habitId ? [priority.habitId] : [],
        });
        continue;
      }
      const blockIdentity = priority.taskId || priority._stableId;
      blocks.push({
        id: `${dateKey(dayStart)}:${blockIdentity}:${selected.startAt}`,
        taskId: priority.taskId,
        ...(priority.habitId ? { habitId: priority.habitId, planningMode: "habit" } : {}),
        title: `专注 · ${priority.title}`,
        startAt: selected.startAt,
        endAt: selected.endAt,
        minutes: selected.minutes,
      });
      nextFocusStartAt = selected.endAt + TEN_MINUTES;
    }

    if (planningStartAt >= windowEndAt) {
      warnings.push({
        code: "NO_PLANNING_WINDOW",
        severity: "warning",
        message: "今天的默认安排窗口已经结束",
        sourceIds: [],
      });
    }

    const committed = mergeIntervals([
      ...hardIntervals,
      ...blocks.map((block) => ({ startAt: block.startAt, endAt: block.endAt })),
    ].map((interval) => ({
      ...interval,
      startAt: Math.max(planningStartAt, interval.startAt),
      endAt: Math.min(windowEndAt, interval.endAt),
    })).filter((interval) => interval.endAt > interval.startAt));
    const remainingWindowMinutes = Math.max(0, (windowEndAt - planningStartAt) / 60000);
    const committedMinutes = committed.reduce((sum, interval) => sum + (interval.endAt - interval.startAt) / 60000, 0);
    if (remainingWindowMinutes > 0 && committedMinutes / remainingWindowMinutes >= 0.75) {
      warnings.push({
        code: "DENSE_DAY",
        severity: "warning",
        message: "今天剩余安排已占可用窗口的 75% 或以上",
        sourceIds: [],
      });
    }
    if (committed.some((interval) => (interval.endAt - interval.startAt) / 60000 > 120)) {
      warnings.push({
        code: "LONG_COMMITMENT_RUN",
        severity: "warning",
        message: "存在连续超过 120 分钟的安排",
        sourceIds: [],
      });
    }

    return {
      version: 1,
      dayKey: dateKey(dayStart),
      generated_at: now,
      window: {
        startAt: windowStartAt,
        endAt: windowEndAt,
        planningStartAt: Math.min(planningStartAt, windowEndAt),
      },
      focusTargetMinutes: targetMinutes,
      priorities: openPriorities.map(({ _stableId, remainingMinutes, ...priority }) => priority),
      blocks,
      warnings,
    };
  }

  return {
    buildDailyPlan,
    buildDeadlineSprintCandidates,
    focusTargetMinutes,
    getTaskDeadlineAt,
    isFixedTimeTask,
    mergeIntervals,
  };
});
