const STORAGE_KEY = "zijian-focus-state-v6";
const SYNC_SESSION_KEY = "zijian-supabase-session-v1";
const SUPABASE_URL = "https://wjdtybwisbdhsnkgfwhh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QyZfnFciac6qGwA2haICCw_8H9CWVC-";
const OLD_STORAGE_KEYS = ["sprout-focus-state-v2", "sprout-focus-state-v1"];
const MINUTE = 60;
const MIN_MINUTES = 5;
const MAX_MINUTES = 180;
const BASE_TITLE = "自见";
const WEATHER_STATES = ["sunny", "cloudy", "rainy"];
const CHICK_STAGES = ["egg", "hatching", "chick", "grown"];
const FAST_FINISH_COST = 5;
const TASK_NOTIFICATION_CHANNEL_ID = "zijian-task-reminders-v3";
const DEFAULT_MEMO_TAGS = ["全部", "影视音乐", "书目", "待办", "灵感", "其他"];
const FINANCE_CATEGORIES = {
  "餐饮": "#e8a95b", "购物": "#d8849f", "交通": "#6fa6cf", "居住": "#8a83bd", "学习": "#75a77a",
  "游戏": "#7f82d9", "娱乐": "#d67f66", "医疗": "#63aaa2", "人情": "#bb8b63", "其他": "#9a9a96", "收入": "#5c9868", "存钱": "#5d93a6",
};

const SKINS = [
  { id: "classic", name: "暖黄", cost: 0, chick: "#f4c84d", wing: "#edb735", scene: "meadow" },
  { id: "mint", name: "薄荷", cost: 12, chick: "#9fd8b3", wing: "#70ba8b", scene: "mint" },
  { id: "berry", name: "莓果", cost: 18, chick: "#e9a3c4", wing: "#d879a9", scene: "berry" },
  { id: "night", name: "夜色", cost: 25, chick: "#404552", wing: "#2b2f3a", scene: "night" },
];

const FLOWER_SKINS = [
  { id: "coral", name: "珊瑚", cost: 0, core: "#ff8e73", petal: "#ffb0a0" },
  { id: "iris", name: "鸢尾", cost: 10, core: "#7c6ee6", petal: "#b7a8ff" },
  { id: "sun", name: "小阳", cost: 14, core: "#f2b84b", petal: "#ffe08a" },
  { id: "snow", name: "雪铃", cost: 18, core: "#dfeeff", petal: "#ffffff" },
];

const THEMES = [
  { id: "paper", name: "纸白", cost: 0, ink: "#111111", bg: "#f7f7f5", panel: "#ffffff", soft: "#eeeeee", primary: "#111111" },
  { id: "moon", name: "月草", cost: 16, ink: "#f7f7f2", bg: "#121513", panel: "#1d211e", soft: "#29312b", primary: "#dce8d5" },
  { id: "tea", name: "海雾", cost: 18, ink: "#10263a", bg: "#e8f4ff", panel: "#f8fbff", soft: "#d7eaff", primary: "#2f6fa8" },
  { id: "plum", name: "梅影", cost: 22, ink: "#351737", bg: "#f8e8f3", panel: "#fff6fc", soft: "#edd0e6", primary: "#9b3f82" },
];

const TASK_COLORS = [
  { id: "sage", name: "鼠尾草", bg: "#edf7e8", border: "#a7cf97", ink: "#254521", badge: "#d7efce" },
  { id: "sky", name: "天空蓝", bg: "#eaf5ff", border: "#9ecbf2", ink: "#193d5c", badge: "#d5ebff" },
  { id: "peach", name: "蜜桃", bg: "#fff0e8", border: "#efb28e", ink: "#62321f", badge: "#ffe0cf" },
  { id: "lavender", name: "薰衣草", bg: "#f2edff", border: "#b8a5ef", ink: "#3e2d69", badge: "#e4dbff" },
  { id: "lemon", name: "柠檬", bg: "#fff9d8", border: "#e4cf65", ink: "#54480d", badge: "#fff1a3" },
  { id: "rose", name: "玫瑰", bg: "#ffeef3", border: "#ee9ab0", ink: "#653044", badge: "#ffd6e1" },
];

const HEATMAP_PALETTES = {
  forest: [
    ["#eef7e8", "#cde7bf", "#91c978", "#54a14a", "#246b32"],
    ["#eff8ef", "#c8e6d0", "#82c899", "#3f9b6a", "#1e6848"],
    ["#f0f7df", "#d7eaa8", "#a9ce5d", "#6f9d2d", "#426719"],
  ],
  ocean: [
    ["#eaf7fb", "#bde7f4", "#74c7df", "#2f9fc1", "#12627d"],
    ["#edf5ff", "#bfdcff", "#79b6f2", "#3586d4", "#14518f"],
    ["#e8fbfb", "#b5eeee", "#64cccc", "#249a9a", "#0f6363"],
  ],
  sunset: [
    ["#fff1df", "#ffd1a3", "#ff9e66", "#e66d3f", "#9e342d"],
    ["#fff3e8", "#ffc6b5", "#ff887c", "#dd4f56", "#8d2438"],
    ["#fff6d8", "#ffe08a", "#f7b640", "#d77c1f", "#874414"],
  ],
  berry: [
    ["#f8eafa", "#e2b8ea", "#c578d5", "#9345b0", "#5a246f"],
    ["#fff0f6", "#f6b8d1", "#df6fa3", "#ae3274", "#6d1949"],
    ["#f1edff", "#c9bcf7", "#9078de", "#5b3eb2", "#34206e"],
  ],
  mono: [
    ["#eeeeee", "#cfcfcf", "#9f9f9f", "#5f5f5f", "#111111"],
    ["#f4f4f4", "#d8d8d8", "#aaaaaa", "#747474", "#202020"],
    ["#e9e9e9", "#c5c5c5", "#929292", "#555555", "#000000"],
  ],
};

const defaultState = {
  selectedMinutes: 25,
  timerSecondsLeft: 25 * MINUTE,
  timerTotalSeconds: 25 * MINUTE,
  isRunning: false,
  startedAt: null,
  endsAt: null,
  tasks: [],
  courses: [],
  memos: [],
  memoTags: DEFAULT_MEMO_TAGS.slice(1),
  selectedMemoTag: "全部",
  focusSessions: [],
  focusByDate: {},
  selectedTaskColor: "sage",
  heatmapPalette: "forest",
  heatmapImage: "",
  feedSources: { memos: true, tasks: true, quotes: true },
  quotes: [],
  weather: null,
  flames: 0,
  flameLedger: [],
  ownedSkins: ["classic"],
  selectedSkin: "classic",
  ownedFlowers: ["coral"],
  selectedFlower: "coral",
  ownedThemes: ["paper"],
  selectedTheme: "paper",
  transactions: [],
  monthlyBudget: 0,
  dailyPlans: {},
  deletions: { version: 1, tasks: {}, memos: {} },
};

let state = loadState();
normalizeState();
saveState(false);
let tickHandle = null;
let dailyPlanPreview = null;
let dailyPlanPreviewError = null;
let dailyPlanGenerating = false;
let dailyPlanAdopting = false;
let dailyPlanAdoptionError = null;
let dailyPlanPreviewNeedsRegeneration = false;
let dailyPlanMode = "balanced";
let deadlineSprintPreview = null;
let deadlineSprintSelectedIds = new Set();
let deadlineSprintTaskId = null;
let deadlineSprintGenerating = false;
let deadlineSprintError = null;
let deadlineSprintAdopting = false;
let deadlineSprintAdoptionError = null;
let deadlineSprintAdoptionNotice = null;
let deadlineSprintConflictIds = new Set();

const els = {
  scene: document.querySelector("#scene"),
  plant: document.querySelector("#plant"),
  chick: document.querySelector("#chick"),
  grassPatch: document.querySelector("#grassPatch"),
  seedLayer: document.querySelector("#seedLayer"),
  sunButton: document.querySelector("#sunButton"),
  clouds: [...document.querySelectorAll(".cloud")],
  timerDial: document.querySelector("#timerDial"),
  dialKnob: document.querySelector("#dialKnob"),
  dialMinutes: document.querySelector("#dialMinutes"),
  minuteRange: document.querySelector("#minuteRange"),
  timeDisplay: document.querySelector("#timeDisplay"),
  progressBar: document.querySelector("#progressBar"),
  timerNote: document.querySelector("#timerNote"),
  startPauseButton: document.querySelector("#startPauseButton"),
  resetButton: document.querySelector("#resetButton"),
  fastFinishButton: document.querySelector("#fastFinishButton"),
  chipButtons: [...document.querySelectorAll(".chip-button")],
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskStart: document.querySelector("#taskStart"),
  taskEnd: document.querySelector("#taskEnd"),
  taskReminderMode: document.querySelector("#taskReminderMode"),
  taskReminder: document.querySelector("#taskReminder"),
  taskReminderAt: document.querySelector("#taskReminderAt"),
  relativeReminderField: document.querySelector("#relativeReminderField"),
  absoluteReminderField: document.querySelector("#absoluteReminderField"),
  taskColorPicker: document.querySelector("#taskColorPicker"),
  taskList: document.querySelector("#taskList"),
  emptyTasks: document.querySelector("#emptyTasks"),
  clearDoneButton: document.querySelector("#clearDoneButton"),
  notifyButton: document.querySelector("#notifyButton"),
  testNotificationButton: document.querySelector("#testNotificationButton"),
  notificationSettingsButton: document.querySelector("#notificationSettingsButton"),
  heatmap: document.querySelector("#heatmap"),
  heatmapPalette: document.querySelector("#heatmapPalette"),
  todayMinutes: document.querySelector("#todayMinutes"),
  flameBalance: document.querySelector("#flameBalance"),
  flameEarnedWeek: document.querySelector("#flameEarnedWeek"),
  flameSpentWeek: document.querySelector("#flameSpentWeek"),
  flameBalanceText: document.querySelector("#flameBalanceText"),
  streakDays: document.querySelector("#streakDays"),
  streakPill: document.querySelector("#streakPill"),
  streakHint: document.querySelector("#streakHint"),
  views: [...document.querySelectorAll(".app-view")],
  navButtons: [...document.querySelectorAll(".nav-button, [data-view-target]")],
  weekStrip: document.querySelector("#weekStrip"),
  timelineDateTitle: document.querySelector("#timelineDateTitle"),
  timelineStats: document.querySelector("#timelineStats"),
  timelineList: document.querySelector("#timelineList"),
  weekBoard: document.querySelector("#weekBoard"),
  weekRangeTitle: document.querySelector("#weekRangeTitle"),
  prevWeekButton: document.querySelector("#prevWeekButton"),
  nextWeekButton: document.querySelector("#nextWeekButton"),
  importIcsButton: document.querySelector("#importIcsButton"),
  icsFileInput: document.querySelector("#icsFileInput"),
  ddlList: document.querySelector("#ddlList"),
  memoAddOpenButton: document.querySelector("#memoAddOpenButton"),
  memoEditorSheet: document.querySelector("#memoEditorSheet"),
  memoEditorBackdrop: document.querySelector("#memoEditorBackdrop"),
  memoEditorClose: document.querySelector("#memoEditorClose"),
  memoEditorTitle: document.querySelector("#memoEditorTitle"),
  memoForm: document.querySelector("#memoForm"),
  memoTitle: document.querySelector("#memoTitle"),
  memoTag: document.querySelector("#memoTag"),
  memoCustomTag: document.querySelector("#memoCustomTag"),
  memoBody: document.querySelector("#memoBody"),
  memoSubmitButton: document.querySelector("#memoSubmitButton"),
  memoCancelEditButton: document.querySelector("#memoCancelEditButton"),
  memoDeleteButton: document.querySelector("#memoDeleteButton"),
  memoSearch: document.querySelector("#memoSearch"),
  memoTags: document.querySelector("#memoTags"),
  memoList: document.querySelector("#memoList"),
  memoExportOpenButton: document.querySelector("#memoExportOpenButton"),
  memoExportSheet: document.querySelector("#memoExportSheet"),
  memoExportBackdrop: document.querySelector("#memoExportBackdrop"),
  memoExportClose: document.querySelector("#memoExportClose"),
  memoExportTags: document.querySelector("#memoExportTags"),
  memoExportList: document.querySelector("#memoExportList"),
  memoExportSelectAll: document.querySelector("#memoExportSelectAll"),
  memoExportDownload: document.querySelector("#memoExportDownload"),
  memoExportJson: document.querySelector("#memoExportJson"),
  weekChart: document.querySelector("#weekChart"),
  weekChartTotal: document.querySelector("#weekChartTotal"),
  skinGrid: document.querySelector("#skinGrid"),
  skinFlameText: document.querySelector("#skinFlameText"),
  flowerGrid: document.querySelector("#flowerGrid"),
  flowerFlameText: document.querySelector("#flowerFlameText"),
  themeGrid: document.querySelector("#themeGrid"),
  themeFlameText: document.querySelector("#themeFlameText"),
  feedMemoToggle: document.querySelector("#feedMemoToggle"),
  feedTaskToggle: document.querySelector("#feedTaskToggle"),
  feedQuoteToggle: document.querySelector("#feedQuoteToggle"),
  focusFeed: document.querySelector("#focusFeed"),
  heatmapImageButton: document.querySelector("#heatmapImageButton"),
  heatmapImageResetButton: document.querySelector("#heatmapImageResetButton"),
  heatmapImageInput: document.querySelector("#heatmapImageInput"),
  quoteImportButton: document.querySelector("#quoteImportButton"),
  quoteImportInput: document.querySelector("#quoteImportInput"),
  backupExportButton: document.querySelector("#backupExportButton"),
  backupImportButton: document.querySelector("#backupImportButton"),
  backupImportInput: document.querySelector("#backupImportInput"),
  widgetTodayMinutes: document.querySelector("#widgetTodayMinutes"),
  widgetWeekMinutes: document.querySelector("#widgetWeekMinutes"),
  widgetTodayTasks: document.querySelector("#widgetTodayTasks"),
  widgetNextTask: document.querySelector("#widgetNextTask"),
  widgetTodayTaskDeck: document.querySelector("#widgetTodayTaskDeck"),
  widgetUpcomingTasks: document.querySelector("#widgetUpcomingTasks"),
  widgetUpcomingText: document.querySelector("#widgetUpcomingText"),
  widgetUpcomingTaskDeck: document.querySelector("#widgetUpcomingTaskDeck"),
  reminderToast: document.querySelector("#reminderToast"),
  reminderToastTitle: document.querySelector("#reminderToastTitle"),
  reminderToastBody: document.querySelector("#reminderToastBody"),
  eventSheet: document.querySelector("#eventSheet"),
  eventSheetBackdrop: document.querySelector("#eventSheetBackdrop"),
  eventSheetClose: document.querySelector("#eventSheetClose"),
  eventSheetType: document.querySelector("#eventSheetType"),
  eventSheetTitle: document.querySelector("#eventSheetTitle"),
  eventSheetMeta: document.querySelector("#eventSheetMeta"),
  eventSheetDescription: document.querySelector("#eventSheetDescription"),
  eventSheetDeleteButton: document.querySelector("#eventSheetDeleteButton"),
  skinPreviewSheet: document.querySelector("#skinPreviewSheet"),
  skinPreviewBackdrop: document.querySelector("#skinPreviewBackdrop"),
  skinPreviewClose: document.querySelector("#skinPreviewClose"),
  skinPreviewTitle: document.querySelector("#skinPreviewTitle"),
  skinPreviewScene: document.querySelector("#skinPreviewScene"),
  skinPreviewMeta: document.querySelector("#skinPreviewMeta"),
  completeSheet: document.querySelector("#completeSheet"),
  completeSheetBackdrop: document.querySelector("#completeSheetBackdrop"),
  completeCloseButton: document.querySelector("#completeCloseButton"),
  completeTitle: document.querySelector("#completeTitle"),
  completeBody: document.querySelector("#completeBody"),
  homeDate: document.querySelector("#homeDate"),
  homeTodayMinutes: document.querySelector("#homeTodayMinutes"),
  homeStreakDays: document.querySelector("#homeStreakDays"),
  homeTaskCount: document.querySelector("#homeTaskCount"),
  homeFlames: document.querySelector("#homeFlames"),
  homeNextItem: document.querySelector("#homeNextItem"),
  dailyPlanCard: document.querySelector("#dailyPlanCard"),
  dailyPlanStatus: document.querySelector("#dailyPlanStatus"),
  dailyPlanContent: document.querySelector("#dailyPlanContent"),
  dailyPlanGenerateButton: document.querySelector("#dailyPlanGenerateButton"),
  dailyPlanAdoptButton: document.querySelector("#dailyPlanAdoptButton"),
  dailyPlanNextStage: document.querySelector("#dailyPlanNextStage"),
  dailyPlanBalancedModeButton: document.querySelector("#dailyPlanBalancedModeButton"),
  dailyPlanSprintModeButton: document.querySelector("#dailyPlanSprintModeButton"),
  dailyPlanBalancedPanel: document.querySelector("#dailyPlanBalancedPanel"),
  deadlineSprintPanel: document.querySelector("#deadlineSprintPanel"),
  deadlineSprintTaskSelect: document.querySelector("#deadlineSprintTaskSelect"),
  deadlineSprintTaskMeta: document.querySelector("#deadlineSprintTaskMeta"),
  deadlineSprintGenerateButton: document.querySelector("#deadlineSprintGenerateButton"),
  deadlineSprintContent: document.querySelector("#deadlineSprintContent"),
  deadlineSprintSelection: document.querySelector("#deadlineSprintSelection"),
  deadlineSprintAdoptButton: document.querySelector("#deadlineSprintAdoptButton"),
  deadlineSprintAdoptionMessage: document.querySelector("#deadlineSprintAdoptionMessage"),
  profileFlames: document.querySelector("#profileFlames"),
  usagePermissionCard: document.querySelector("#usagePermissionCard"),
  usagePermissionButton: document.querySelector("#usagePermissionButton"),
  usageRefreshButton: document.querySelector("#usageRefreshButton"),
  usageDashboard: document.querySelector("#usageDashboard"),
  usageRing: document.querySelector("#usageRing"),
  usageTodayMinutes: document.querySelector("#usageTodayMinutes"),
  usageChangeText: document.querySelector("#usageChangeText"),
  usageYesterdayText: document.querySelector("#usageYesterdayText"),
  usageTrend: document.querySelector("#usageTrend"),
  usageAppList: document.querySelector("#usageAppList"),
  usageAppsTitle: document.querySelector("#usageAppsTitle"),
  financeMonthLabel: document.querySelector("#financeMonthLabel"),
  financeTotalCard: document.querySelector("#financeTotalCard"),
  financeTotalLabel: document.querySelector("#financeTotalLabel"),
  financeExpenseTotal: document.querySelector("#financeExpenseTotal"),
  financeIncomeTotal: document.querySelector("#financeIncomeTotal"),
  financeDailyLabel: document.querySelector("#financeDailyLabel"),
  financeDailyAverage: document.querySelector("#financeDailyAverage"),
  financeWeeklyLabel: document.querySelector("#financeWeeklyLabel"),
  financeWeeklyTotal: document.querySelector("#financeWeeklyTotal"),
  financeWeekRange: document.querySelector("#financeWeekRange"),
  financeYearlyLabel: document.querySelector("#financeYearlyLabel"),
  financeYearlyTotal: document.querySelector("#financeYearlyTotal"),
  financeYearLabel: document.querySelector("#financeYearLabel"),
  financeBudgetLeft: document.querySelector("#financeBudgetLeft"),
  financeBudgetBar: document.querySelector("#financeBudgetBar"),
  financeBudgetButton: document.querySelector("#financeBudgetButton"),
  financeRing: document.querySelector("#financeRing"),
  financeBreakdownTitle: document.querySelector("#financeBreakdownTitle"),
  financeRingTotal: document.querySelector("#financeRingTotal"),
  financeRingLabel: document.querySelector("#financeRingLabel"),
  financeLegend: document.querySelector("#financeLegend"),
  financeCategoryDetails: document.querySelector("#financeCategoryDetails"),
  financeCategoryDetailsEyebrow: document.querySelector("#financeCategoryDetailsEyebrow"),
  financeCategoryDetailsTitle: document.querySelector("#financeCategoryDetailsTitle"),
  financeCategoryDetailsClose: document.querySelector("#financeCategoryDetailsClose"),
  financeCategoryTopList: document.querySelector("#financeCategoryTopList"),
  financeInsight: document.querySelector("#financeInsight"),
  financeList: document.querySelector("#financeList"),
  financeAddButton: document.querySelector("#financeAddButton"),
  financeImportButton: document.querySelector("#financeImportButton"),
  financeImportInput: document.querySelector("#financeImportInput"),
  paymentAccessButton: document.querySelector("#paymentAccessButton"),
  paymentAccessStatus: document.querySelector("#paymentAccessStatus"),
  paymentTestButton: document.querySelector("#paymentTestButton"),
  financeEditorSheet: document.querySelector("#financeEditorSheet"),
  financeEditorBackdrop: document.querySelector("#financeEditorBackdrop"),
  financeEditorClose: document.querySelector("#financeEditorClose"),
  financeEditorTitle: document.querySelector("#financeEditorTitle"),
  financeForm: document.querySelector("#financeForm"),
  financeTypeButtons: [...document.querySelectorAll("[data-finance-type]")],
  financeAmount: document.querySelector("#financeAmount"),
  financeCategory: document.querySelector("#financeCategory"),
  financeNote: document.querySelector("#financeNote"),
  financeDate: document.querySelector("#financeDate"),
  financeDeleteButton: document.querySelector("#financeDeleteButton"),
  syncStatusBadge: document.querySelector("#syncStatusBadge"),
  syncDescription: document.querySelector("#syncDescription"),
  syncAuthForm: document.querySelector("#syncAuthForm"),
  syncEmail: document.querySelector("#syncEmail"),
  syncPassword: document.querySelector("#syncPassword"),
  syncLoginButton: document.querySelector("#syncLoginButton"),
  syncRegisterButton: document.querySelector("#syncRegisterButton"),
  syncAccountActions: document.querySelector("#syncAccountActions"),
  syncAccountEmail: document.querySelector("#syncAccountEmail"),
  syncNowButton: document.querySelector("#syncNowButton"),
  syncLogoutButton: document.querySelector("#syncLogoutButton"),
};

let activeView = "home";
let selectedTimelineDate = dateKey();
let selectedWeekDate = dateKey();
let selectedStatsWeekDate = dateKey();
let feedIndex = 0;
let previewSkinId = null;
let previewThemeId = null;
let skinPreviewTimer = null;
let themePreviewTimer = null;
let skinLongPressTimer = null;
let skinLongPressTriggered = false;
let memoExportTags = new Set();
let memoExportIds = new Set();
let editingMemoId = null;
let memoSearchQuery = "";
let usageStatsPlugin = null;
let systemBridgePlugin = null;
let usageOverviewData = null;
let selectedUsageDate = dateKey();
let editingTransactionId = null;
let financeEntryType = "expense";
let financeSummaryMode = "expense";
let pendingPaymentActive = false;
let selectedFinanceCategory = null;
let financeRingSegments = [];
let eventDetailTaskId = null;
let syncSession = loadSyncSession();
let syncUploadTimer = null;
let syncInFlight = false;
const widgetDeckIndexes = { today: 0, upcoming: 0 };
document.body.dataset.view = activeView;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return restoreTimerState({ ...defaultState, ...saved });

    for (const key of OLD_STORAGE_KEYS) {
      const old = JSON.parse(localStorage.getItem(key));
      if (old) {
        return {
          ...defaultState,
          selectedMinutes: old.selectedMinutes || 25,
          timerSecondsLeft: (old.selectedMinutes || 25) * MINUTE,
          timerTotalSeconds: (old.selectedMinutes || 25) * MINUTE,
          focusByDate: old.focusByDate || {},
          focusSessions: old.focusSessions || [],
          tasks: migrateTasks(old.tasks || []),
          selectedTaskColor: old.selectedTaskColor || "sage",
          heatmapPalette: old.heatmapPalette || "forest",
        };
      }
    }
  } catch {
    return { ...defaultState };
  }
  return { ...defaultState };
}

function normalizeDeletionMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized = {};
  Object.entries(value).forEach(([rawId, record]) => {
    const id = String(rawId);
    if (!id.trim() || ["__proto__", "prototype", "constructor"].includes(id)) return;
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    const deletedAt = record.deletedAt;
    if (typeof deletedAt !== "number" || !Number.isFinite(deletedAt)) return;
    normalized[id] = { deletedAt };
  });
  return normalized;
}

function normalizeDeletionRegistry(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    version: 1,
    tasks: normalizeDeletionMap(source.tasks),
    memos: normalizeDeletionMap(source.memos),
  };
}

function mergeDeletionMaps(localValue, remoteValue) {
  const local = normalizeDeletionMap(localValue);
  const remote = normalizeDeletionMap(remoteValue);
  const merged = { ...local };
  Object.entries(remote).forEach(([id, record]) => {
    if (!merged[id] || record.deletedAt > merged[id].deletedAt) merged[id] = { deletedAt: record.deletedAt };
  });
  return merged;
}

function mergeDeletionRegistries(localValue, remoteValue) {
  const local = normalizeDeletionRegistry(localValue);
  const remote = normalizeDeletionRegistry(remoteValue);
  return {
    version: 1,
    tasks: mergeDeletionMaps(local.tasks, remote.tasks),
    memos: mergeDeletionMaps(local.memos, remote.memos),
  };
}

function filterDeletedEntities(items, deletionMap) {
  const activeDeletions = normalizeDeletionMap(deletionMap);
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item || item.id === undefined || item.id === null) return true;
    return !Object.prototype.hasOwnProperty.call(activeDeletions, String(item.id));
  });
}

function normalizeState() {
  state.deletions = normalizeDeletionRegistry(state.deletions);
  state.tasks = filterDeletedEntities(state.tasks, state.deletions.tasks);
  state.flames = Number(state.flames || 0);
  state.flameLedger = Array.isArray(state.flameLedger) ? state.flameLedger : [];
  state.courses = Array.isArray(state.courses) ? state.courses : [];
  state.memos = Array.isArray(state.memos) ? state.memos : [];
  state.memos = state.memos.map((memo) => ({
    ...memo,
    tag: memo.tag === "片子" ? "影视音乐" : memo.tag,
    body: memo.body || "",
  }));
  state.memos = filterDeletedEntities(state.memos, state.deletions.memos);
  const savedTags = Array.isArray(state.memoTags) ? state.memoTags.map((tag) => tag === "片子" ? "影视音乐" : tag) : [];
  state.memoTags = [...new Set([...DEFAULT_MEMO_TAGS.slice(1), ...savedTags, ...state.memos.map((memo) => memo.tag)])].filter(Boolean);
  if (state.selectedMemoTag === "片子") state.selectedMemoTag = "影视音乐";
  if (!["全部", ...state.memoTags].includes(state.selectedMemoTag)) state.selectedMemoTag = "全部";
  state.ownedSkins = Array.isArray(state.ownedSkins) && state.ownedSkins.length > 0 ? state.ownedSkins : ["classic"];
  if (!state.ownedSkins.includes("classic")) state.ownedSkins.unshift("classic");
  if (!SKINS.some((skin) => skin.id === state.selectedSkin)) state.selectedSkin = "classic";
  if (!state.ownedSkins.includes(state.selectedSkin)) state.selectedSkin = "classic";
  state.ownedFlowers = Array.isArray(state.ownedFlowers) && state.ownedFlowers.length > 0 ? state.ownedFlowers : ["coral"];
  if (!state.ownedFlowers.includes("coral")) state.ownedFlowers.unshift("coral");
  if (!FLOWER_SKINS.some((flower) => flower.id === state.selectedFlower)) state.selectedFlower = "coral";
  if (!state.ownedFlowers.includes(state.selectedFlower)) state.selectedFlower = "coral";
  state.ownedThemes = Array.isArray(state.ownedThemes) && state.ownedThemes.length > 0 ? state.ownedThemes : ["paper"];
  if (!state.ownedThemes.includes("paper")) state.ownedThemes.unshift("paper");
  if (!THEMES.some((theme) => theme.id === state.selectedTheme)) state.selectedTheme = "paper";
  if (!state.ownedThemes.includes(state.selectedTheme)) state.selectedTheme = "paper";
  state.feedSources = {
    memos: state.feedSources?.memos !== false,
    tasks: state.feedSources?.tasks !== false,
    quotes: state.feedSources?.quotes !== false,
  };
  state.quotes = Array.isArray(state.quotes) ? state.quotes.filter(Boolean).map(String) : [];
  state.heatmapImage = typeof state.heatmapImage === "string" ? state.heatmapImage : "";
  state.transactions = Array.isArray(state.transactions) ? state.transactions : [];
  state.dailyPlans = state.dailyPlans && typeof state.dailyPlans === "object" && !Array.isArray(state.dailyPlans) ? state.dailyPlans : {};
  if (Number(state.financeRulesVersion || 0) < 4) {
    state.transactions = state.transactions.map((item) => {
      if (item.type === "expense" && /-import$/.test(item.source || "") && isSavingTransfer(item.note)) {
        return { ...item, type: "saving", category: "存钱", autoCategory: true };
      }
      if (item.type !== "expense" || item.category !== "其他" || !/-import$/.test(item.source || "")) return item;
      const category = guessFinanceCategory(item.note);
      return category === "其他" ? item : { ...item, category, autoCategory: true };
    });
    state.financeRulesVersion = 4;
  }
  state.monthlyBudget = Math.max(0, Number(state.monthlyBudget || 0));
  state.syncUpdatedAt = Math.max(0, Number(state.syncUpdatedAt || 0));
}

function restoreTimerState(nextState) {
  if (!nextState.isRunning || !nextState.endsAt) {
    return { ...nextState, isRunning: false, startedAt: null, endsAt: null };
  }

  const secondsLeft = Math.ceil((nextState.endsAt - Date.now()) / 1000);
  if (secondsLeft > 0) {
    return { ...nextState, timerSecondsLeft: secondsLeft };
  }

  const minutes = Math.round((nextState.timerTotalSeconds || nextState.selectedMinutes * MINUTE) / MINUTE);
  const earned = getFlameReward(minutes);
  const finishedAt = Number(nextState.endsAt) || Date.now();
  const startedAt = finishedAt - (nextState.timerTotalSeconds || minutes * MINUTE) * 1000;
  const finishedDate = dateKey(new Date(finishedAt));
  return {
    ...nextState,
    isRunning: false,
    startedAt: null,
    endsAt: null,
    timerSecondsLeft: nextState.selectedMinutes * MINUTE,
    timerTotalSeconds: nextState.selectedMinutes * MINUTE,
    flames: (nextState.flames || 0) + earned,
    flameLedger: [
      ...(nextState.flameLedger || []),
      ...(earned > 0 ? [{ id: crypto.randomUUID(), type: "earn", amount: earned, at: finishedAt, reason: "专注完成" }] : []),
    ],
    focusByDate: {
      ...(nextState.focusByDate || {}),
      [finishedDate]: ((nextState.focusByDate || {})[finishedDate] || 0) + minutes,
    },
    focusSessions: [
      ...(nextState.focusSessions || []),
      {
        id: crypto.randomUUID(),
        title: "专注",
        startAt: startedAt,
        endAt: finishedAt,
        minutes,
      },
    ],
  };
}

function migrateTasks(tasks) {
  return tasks.map((task) => {
    const startAt = task.startAt || task.createdAt || Date.now();
    const endAt = task.endAt || startAt + 2 * 60 * MINUTE * 1000;
    return {
      id: task.id || crypto.randomUUID(),
      title: task.title || "未命名任务",
      done: Boolean(task.done),
      createdAt: task.createdAt || Date.now(),
      startAt,
      endAt,
      reminderMode: task.reminderMode || "relative",
      remindBeforeMinutes: task.remindBeforeMinutes || 15,
      reminderAt: task.reminderAt || null,
      color: task.color || "sage",
      reminded: Boolean(task.reminded),
    };
  });
}

function saveState(touch = true) {
  if (touch) state.syncUpdatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (touch) scheduleCloudSync();
}

function loadSyncSession() {
  try { return JSON.parse(localStorage.getItem(SYNC_SESSION_KEY)) || null; } catch { return null; }
}

function storeSyncSession(session) {
  syncSession = session;
  if (session) localStorage.setItem(SYNC_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SYNC_SESSION_KEY);
  renderSyncAccount();
}

function authSessionFromResponse(data) {
  if (!data?.access_token || !data?.user) return null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
    user: { id: data.user.id, email: data.user.email },
  };
}

async function supabaseFetch(path, options = {}, retry = true) {
  const needsAuth = options.auth !== false;
  if (needsAuth) await ensureSyncAccessToken();
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(needsAuth && syncSession?.accessToken ? { Authorization: `Bearer ${syncSession.accessToken}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${SUPABASE_URL}${path}`, { method: options.method || "GET", headers, body: options.body ? JSON.stringify(options.body) : undefined });
  if (response.status === 401 && needsAuth && retry && syncSession?.refreshToken) {
    await refreshSyncSession();
    return supabaseFetch(path, options, false);
  }
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || `Supabase ${response.status}`);
  return data;
}

async function refreshSyncSession() {
  if (!syncSession?.refreshToken) throw new Error("请重新登录");
  const data = await supabaseFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", auth: false, body: { refresh_token: syncSession.refreshToken } }, false);
  const session = authSessionFromResponse(data);
  if (!session) throw new Error("登录已经过期");
  storeSyncSession(session);
}

async function ensureSyncAccessToken() {
  if (!syncSession?.accessToken) throw new Error("尚未登录");
  if (Date.now() > Number(syncSession.expiresAt || 0) - 60_000) await refreshSyncSession();
}

function mergeById(localItems = [], remoteItems = [], preferRemote = false) {
  const merged = new Map();
  const first = preferRemote ? localItems : remoteItems;
  const second = preferRemote ? remoteItems : localItems;
  [...first, ...second].forEach((item) => { if (item?.id) merged.set(item.id, item); });
  return [...merged.values()];
}

function dailyPlanRevision(plan) {
  const adoptedAt = Number(plan?.adopted_at);
  return Number.isFinite(adoptedAt) && adoptedAt > 0 ? adoptedAt : Number(plan?.generated_at || 0);
}

function mergeSyncedStates(local, remote) {
  const preferRemote = Number(remote?.syncUpdatedAt || 0) > Number(local?.syncUpdatedAt || 0);
  const preferred = preferRemote ? remote : local;
  const merged = { ...local, ...preferred };
  merged.deletions = mergeDeletionRegistries(local?.deletions, remote?.deletions);
  ["courses", "focusSessions", "flameLedger", "transactions"].forEach((key) => {
    merged[key] = mergeById(local?.[key], remote?.[key], preferRemote);
  });
  merged.tasks = filterDeletedEntities(
    mergeById(local?.tasks, remote?.tasks, preferRemote),
    merged.deletions.tasks
  );
  merged.memos = filterDeletedEntities(
    mergeById(local?.memos, remote?.memos, preferRemote),
    merged.deletions.memos
  );
  merged.memoTags = [...new Set([...(local.memoTags || []), ...(remote.memoTags || [])])];
  merged.ownedSkins = [...new Set([...(local.ownedSkins || []), ...(remote.ownedSkins || [])])];
  merged.ownedFlowers = [...new Set([...(local.ownedFlowers || []), ...(remote.ownedFlowers || [])])];
  merged.ownedThemes = [...new Set([...(local.ownedThemes || []), ...(remote.ownedThemes || [])])];
  merged.quotes = [...new Set([...(local.quotes || []), ...(remote.quotes || [])])];
  merged.focusByDate = { ...(local.focusByDate || {}) };
  Object.entries(remote.focusByDate || {}).forEach(([day, minutes]) => { merged.focusByDate[day] = Math.max(Number(merged.focusByDate[day] || 0), Number(minutes || 0)); });
  merged.dailyPlans = { ...(local.dailyPlans || {}), ...(remote.dailyPlans || {}) };
  Object.entries(local.dailyPlans || {}).forEach(([day, plan]) => {
    const remotePlan = remote.dailyPlans?.[day];
    if (!remotePlan || dailyPlanRevision(plan) >= dailyPlanRevision(remotePlan)) merged.dailyPlans[day] = plan;
  });
  merged.heatmapImage = local.heatmapImage || "";
  ["isRunning", "startedAt", "endsAt", "timerSecondsLeft", "timerTotalSeconds"].forEach((key) => { merged[key] = local[key]; });
  merged.syncUpdatedAt = Math.max(Number(local.syncUpdatedAt || 0), Number(remote.syncUpdatedAt || 0));
  return merged;
}

function cloudSafeState() {
  const snapshot = structuredClone(state);
  snapshot.deletions = normalizeDeletionRegistry(snapshot.deletions);
  snapshot.tasks = filterDeletedEntities(snapshot.tasks, snapshot.deletions.tasks);
  snapshot.memos = filterDeletedEntities(snapshot.memos, snapshot.deletions.memos);
  snapshot.heatmapImage = "";
  snapshot.isRunning = false;
  snapshot.startedAt = null;
  snapshot.endsAt = null;
  return snapshot;
}

function scheduleCloudSync() {
  if (!syncSession?.user?.id) return;
  clearTimeout(syncUploadTimer);
  syncUploadTimer = setTimeout(() => syncNow({ quiet: true }), 2200);
}

async function syncNow({ quiet = false } = {}) {
  if (!syncSession?.user?.id || syncInFlight) return;
  syncInFlight = true;
  renderSyncAccount("同步中");
  try {
    const rows = await supabaseFetch(`/rest/v1/user_states?user_id=eq.${encodeURIComponent(syncSession.user.id)}&select=state,updated_at`);
    if (rows?.[0]?.state) {
      state = restoreTimerState({ ...defaultState, ...mergeSyncedStates(state, rows[0].state) });
      normalizeState();
      saveState(false);
      render();
    }
    await supabaseFetch("/rest/v1/user_states?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: { user_id: syncSession.user.id, state: cloudSafeState(), updated_at: new Date().toISOString() },
    });
    localStorage.setItem("zijian-last-sync", String(Date.now()));
    renderSyncAccount("已同步");
    await schedulePendingTaskNotifications();
    if (!quiet) showReminderToast("同步完成", "两台设备的数据已经合并并保存到云端。");
  } catch (error) {
    console.error("Cloud sync failed:", error);
    renderSyncAccount("同步失败");
    if (!quiet) showReminderToast("同步失败", error.message || "请检查网络和 Supabase 数据表。");
  } finally { syncInFlight = false; }
}

function renderSyncAccount(status = null) {
  if (!els.syncStatusBadge) return;
  const loggedIn = Boolean(syncSession?.user?.id);
  els.syncAuthForm.hidden = loggedIn;
  els.syncAccountActions.hidden = !loggedIn;
  els.syncStatusBadge.textContent = status || (loggedIn ? "已登录" : "未登录");
  els.syncAccountEmail.textContent = syncSession?.user?.email || "";
  const lastSync = Number(localStorage.getItem("zijian-last-sync") || 0);
  els.syncDescription.textContent = loggedIn
    ? lastSync ? `上次同步：${new Date(lastSync).toLocaleString("zh-CN")}` : "账号已连接，点击立即同步完成首次上传。"
    : "登录后，任务、备忘、课程、专注记录和账本会在设备间同步。";
}

async function loginSyncAccount(register = false) {
  const email = els.syncEmail.value.trim();
  const password = els.syncPassword.value;
  const minimumLength = register ? 8 : 6;
  if (!email || password.length < minimumLength) {
    const message = register ? "新账号密码至少需要 8 位。" : "请输入邮箱和原账号密码（至少 6 位）。";
    return showReminderToast("账号信息不完整", message);
  }
  renderSyncAccount(register ? "注册中" : "登录中");
  try {
    const path = register ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const data = await supabaseFetch(path, { method: "POST", auth: false, body: { email, password } });
    const session = authSessionFromResponse(data);
    if (!session) {
      renderSyncAccount();
      showReminderToast("请查收确认邮件", "确认邮箱后回到自见，再使用相同邮箱和密码登录。");
      return;
    }
    storeSyncSession(session);
    els.syncPassword.value = "";
    await syncNow();
  } catch (error) {
    renderSyncAccount();
    showReminderToast(register ? "注册失败" : "登录失败", error.message || "请稍后重试。");
  }
}

function logoutSyncAccount() {
  storeSyncSession(null);
  localStorage.removeItem("zijian-last-sync");
  showReminderToast("已经退出", "本机数据仍然保留。登录后可以再次同步。");
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInputValue(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

function fromInputValue(value) {
  return value ? new Date(value).getTime() : NaN;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

function formatClock(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatMonthDay(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDuration(startAt, endAt) {
  const totalMinutes = Math.max(1, Math.round((endAt - startAt) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}分钟`;
  if (minutes === 0) return `${hours}小时`;
  return `${hours}时${minutes}分`;
}

function getWeekStart(date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getWeekMinutes() {
  const start = getWeekStart(new Date());
  let total = 0;
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    total += state.focusByDate[dateKey(day)] || 0;
  }
  return total;
}

function getFlameReward(minutes) {
  return Math.floor(minutes / 30);
}

function addFlameLedger(type, amount, reason, at = Date.now()) {
  if (amount <= 0) return;
  state.flameLedger.push({ id: crypto.randomUUID(), type, amount, reason, at });
  state.flames += type === "earn" ? amount : -amount;
  state.flames = Math.max(0, state.flames);
}

function getWeekFlameTotal(type) {
  const start = getWeekStart(new Date()).getTime();
  return (state.flameLedger || [])
    .filter((item) => item.type === type && item.at >= start)
    .reduce((sum, item) => sum + item.amount, 0);
}

function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) || SKINS[0];
}

function getFlower(id) {
  return FLOWER_SKINS.find((flower) => flower.id === id) || FLOWER_SKINS[0];
}

function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0];
}

function getTotalFocusMinutes() {
  return Object.values(state.focusByDate || {}).reduce((sum, minutes) => sum + minutes, 0);
}

function hasFocusHistory() {
  return getTotalFocusMinutes() > 0;
}

function getTodayOpenTasks() {
  const today = dateKey();
  return state.tasks
    .filter((task) => !task.done && dateKey(new Date(task.endAt)) === today)
    .sort((a, b) => a.endAt - b.endAt);
}

function getUpcomingTasks(limit = 3) {
  const now = Date.now();
  const today = dateKey();
  return state.tasks
    .filter((task) => !task.done && task.endAt >= now && dateKey(new Date(task.endAt)) > today)
    .sort((a, b) => a.endAt - b.endAt)
    .slice(0, limit);
}

function getDayCourses(dayKey) {
  return (state.courses || [])
    .filter((course) => dateKey(new Date(course.startAt)) === dayKey)
    .sort((a, b) => a.startAt - b.startAt);
}

function decodeIcsText(buffer) {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("�")) return utf8;
  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return utf8;
  }
}

function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function unescapeIcsValue(value = "") {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value) {
  const clean = value.replace(/Z$/, "");
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
  if (!match) return NaN;
  const [, year, month, day, hour = "00", minute = "00"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function parseIcsCourses(text) {
  const unfolded = unfoldIcs(text);
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  return blocks.map((block) => {
    const lines = block.split(/\r?\n/);
    const data = {};
    lines.forEach((line) => {
      const index = line.indexOf(":");
      if (index < 0) return;
      const rawKey = line.slice(0, index).split(";")[0].toUpperCase();
      const value = unescapeIcsValue(line.slice(index + 1));
      data[rawKey] = value;
    });
    const startAt = parseIcsDate(data.DTSTART || "");
    const endAt = parseIcsDate(data.DTEND || "");
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return null;
    return {
      id: data.UID || crypto.randomUUID(),
      title: data.SUMMARY || "未命名课程",
      location: (data.LOCATION || "").split("\n")[0],
      description: data.DESCRIPTION || "",
      startAt,
      endAt,
      source: "ics",
    };
  }).filter(Boolean);
}

async function importIcsFile(file) {
  if (!file) return;
  const text = decodeIcsText(await file.arrayBuffer());
  const nextCourses = parseIcsCourses(text);
  if (nextCourses.length === 0) {
    showReminderToast("没有读到课程", "这个文件里没有可导入的日程事件。");
    return;
  }
  const existing = new Map((state.courses || []).map((course) => [course.id, course]));
  nextCourses.forEach((course) => existing.set(course.id, course));
  state.courses = [...existing.values()].sort((a, b) => a.startAt - b.startAt);
  saveState();
  render();
  showReminderToast("课程表已导入", `导入 ${nextCourses.length} 条课程安排。`);
}

function parseFlexibleDate(value) {
  if (!value) return NaN;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  const parsed = Date.parse(text.replace(/\//g, "-"));
  if (Number.isFinite(parsed)) return parsed;
  return parseIcsDate(text);
}

function pickField(item, names) {
  for (const name of names) {
    if (item[name] !== undefined && item[name] !== "") return item[name];
  }
  return "";
}

function normalizeCourseRow(row, source = "file") {
  const title = pickField(row, ["title", "name", "summary", "course", "课程", "标题", "名称"]);
  const startAt = parseFlexibleDate(pickField(row, ["startAt", "start", "begin", "dtstart", "开始", "开始时间"]));
  const endAt = parseFlexibleDate(pickField(row, ["endAt", "end", "finish", "dtend", "结束", "结束时间"]));
  if (!title || !Number.isFinite(startAt) || !Number.isFinite(endAt)) return null;
  return {
    id: String(pickField(row, ["id", "uid"]) || `${source}-${title}-${startAt}`),
    title: String(title),
    location: String(pickField(row, ["location", "place", "room", "地点", "教室"]) || ""),
    description: String(pickField(row, ["description", "note", "备注", "说明"]) || ""),
    startAt,
    endAt,
    source,
  };
}

function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const split = (line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.trim().replace(/^"|"$/g, "").replace(/""/g, "\""));
  const headers = split(lines[0]);
  return lines.slice(1).map((line) => {
    const values = split(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function parseScheduleFile(text, fileName = "") {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".ics") || text.includes("BEGIN:VEVENT")) return parseIcsCourses(text);
  if (lower.endsWith(".json") || text.trim().startsWith("[") || text.trim().startsWith("{")) {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.courses || parsed.events || parsed.items || [];
    return rows.map((row) => normalizeCourseRow(row, "json")).filter(Boolean);
  }
  return parseCsvRows(text).map((row) => normalizeCourseRow(row, "csv")).filter(Boolean);
}

async function importScheduleFile(file) {
  if (!file) return;
  const text = decodeIcsText(await file.arrayBuffer());
  let nextCourses = [];
  try {
    nextCourses = parseScheduleFile(text, file.name || "");
  } catch {
    nextCourses = [];
  }
  if (nextCourses.length === 0) {
    showReminderToast("没有读到日程", "可以导入 ICS、CSV 或 JSON。CSV 需要 title/start/end 这类字段。");
    return;
  }
  const existing = new Map((state.courses || []).map((course) => [course.id, course]));
  nextCourses.forEach((course) => existing.set(course.id, course));
  state.courses = [...existing.values()].sort((a, b) => a.startAt - b.startAt);
  saveState();
  render();
  showReminderToast("日程已导入", `导入 ${nextCourses.length} 条安排。`);
}

function clampMinutes(minutes) {
  const rounded = Math.round(Number(minutes) / 5) * 5;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, rounded || 25));
}

function setTimerMinutes(minutes) {
  if (state.isRunning) return;
  const next = clampMinutes(minutes);
  state.selectedMinutes = next;
  state.timerTotalSeconds = next * MINUTE;
  state.timerSecondsLeft = state.timerTotalSeconds;
  saveState();
  renderTimer();
}

function minutesToAngle(minutes) {
  const progress = (minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES);
  return progress * 300 - 150;
}

function angleToMinutes(angle) {
  const normalized = Math.min(150, Math.max(-150, angle));
  const progress = (normalized + 150) / 300;
  return clampMinutes(MIN_MINUTES + progress * (MAX_MINUTES - MIN_MINUTES));
}

function setMinutesFromPointer(event) {
  if (state.isRunning) return;
  const rect = els.timerDial.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  setTimerMinutes(angleToMinutes(Math.atan2(dy, dx) * 180 / Math.PI + 90));
}

function startTimer() {
  state.isRunning = true;
  state.startedAt = Date.now();
  state.endsAt = Date.now() + state.timerSecondsLeft * 1000;
  tickHandle = window.setInterval(tick, 1000);
  saveState();
  render();
}

function pauseTimer() {
  if (state.isRunning && state.endsAt) {
    state.timerSecondsLeft = Math.max(1, Math.ceil((state.endsAt - Date.now()) / 1000));
  }
  state.isRunning = false;
  state.startedAt = null;
  state.endsAt = null;
  window.clearInterval(tickHandle);
  tickHandle = null;
  saveState();
  render();
}

function resetTimer() {
  pauseTimer();
  state.timerTotalSeconds = state.selectedMinutes * MINUTE;
  state.timerSecondsLeft = state.timerTotalSeconds;
  saveState();
  render();
}

function completeFocusSession(options = {}) {
  const minutes = options.minutes || Math.round(state.timerTotalSeconds / MINUTE);
  const today = dateKey();
  const finishedAt = Date.now();
  const startedAt = options.startedAt || finishedAt - minutes * MINUTE * 1000;
  const earned = options.skipReward ? 0 : getFlameReward(minutes);
  state.focusByDate[today] = (state.focusByDate[today] || 0) + minutes;
  state.focusSessions.push({
    id: crypto.randomUUID(),
    title: "专注",
    startAt: startedAt,
    endAt: finishedAt,
    minutes,
  });
  if (earned > 0) addFlameLedger("earn", earned, "专注完成", finishedAt);
  state.isRunning = false;
  state.startedAt = null;
  state.endsAt = null;
  state.timerTotalSeconds = state.selectedMinutes * MINUTE;
  state.timerSecondsLeft = state.timerTotalSeconds;
  window.clearInterval(tickHandle);
  tickHandle = null;
  saveState();
  render();
  els.timerNote.textContent = earned > 0
    ? `完成 ${minutes} 分钟专注，获得 ${earned} 个火苗。`
    : `完成 ${minutes} 分钟专注，小鸡长成了。`;
  showCompletionSheet(minutes, earned);
}

function fastFinishSession() {
  if (state.flames < FAST_FINISH_COST) {
    showReminderToast("火苗不够", `快速完成需要 ${FAST_FINISH_COST} 个火苗。`);
    return;
  }
  addFlameLedger("spend", FAST_FINISH_COST, "快速完成");
  const minutes = Math.max(1, Math.round(state.timerTotalSeconds / MINUTE));
  completeFocusSession({ minutes, skipReward: true });
  showReminderToast("已快速完成", `消耗 ${FAST_FINISH_COST} 个火苗完成本轮专注。`);
}

function tick() {
  state.timerSecondsLeft = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
  if (state.timerSecondsLeft <= 0) {
    completeFocusSession();
    return;
  }
  renderTimer();
}

function addTask(title, startAt, endAt, reminderMode, remindBeforeMinutes, reminderAt, color) {
  const task = {
    id: crypto.randomUUID(),
    title,
    done: false,
    createdAt: Date.now(),
    startAt,
    endAt,
    reminderMode,
    remindBeforeMinutes,
    reminderAt,
    color,
    reminded: false,
  };
  state.tasks.push(task);
  sortTasks();
  saveState();
  renderTasks();
  renderTimeline();
  renderWeekSchedule();
  renderDdl();
  renderWidgets();
  renderFocusFeed();
  updatePageBadge();
  scheduleTaskNotification(task).catch((error) => {
    console.error("Task notification scheduling failed:", error);
    showReminderToast("系统提醒未预约", "请点任务页的“测试”检查通知权限和系统设置。");
  });
  checkReminders();
}

function sortTasks() {
  state.tasks.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt);
}

function toggleTask(id) {
  const before = state.tasks.find((task) => task.id === id);
  state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
  saveState();
  const after = state.tasks.find((task) => task.id === id);
  if (before && after?.done) cancelTaskNotification(before).catch(() => {});
  if (after && !after.done) scheduleTaskNotification(after).catch(() => {});
  renderTasks();
  renderTimeline();
  renderWeekSchedule();
  renderDdl();
  renderWidgets();
  renderFocusFeed();
  updatePageBadge();
  checkReminders();
}

function dailyPlanReferencesAnyTask(plan, taskIds) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return false;
  const references = [
    ...(Array.isArray(plan.priorities) ? plan.priorities : []),
    ...(Array.isArray(plan.blocks) ? plan.blocks : []),
  ];
  return references.some((item) => item?.taskId !== undefined && item?.taskId !== null && taskIds.has(String(item.taskId)));
}

function removeDeletedTaskReferencesFromPlans(plans, taskIds, deletedAt, revisedAt = deletedAt) {
  const source = plans && typeof plans === "object" && !Array.isArray(plans) ? plans : {};
  const todayKey = dailyPlanDayKey(deletedAt);
  const nextPlans = { ...source };
  Object.entries(source).forEach(([dayKeyValue, plan]) => {
    if (dayKeyValue < todayKey || !dailyPlanReferencesAnyTask(plan, taskIds)) return;
    const priorities = Array.isArray(plan.priorities) ? plan.priorities : [];
    const blocks = Array.isArray(plan.blocks) ? plan.blocks : [];
    const affectedIds = new Set();
    [...priorities, ...blocks].forEach((item) => {
      const id = item?.taskId === undefined || item?.taskId === null ? "" : String(item.taskId);
      if (taskIds.has(id)) affectedIds.add(id);
    });
    const warnings = Array.isArray(plan.warnings) ? [...plan.warnings] : [];
    affectedIds.forEach((taskId) => {
      const exists = warnings.some((warning) => warning?.code === "TASK_DELETED"
        && Array.isArray(warning.sourceIds)
        && warning.sourceIds.some((sourceId) => String(sourceId) === taskId));
      if (!exists) {
        warnings.push({
          code: "TASK_DELETED",
          severity: "warning",
          message: "原重点任务已删除，相关专注时段已移除",
          sourceIds: [taskId],
        });
      }
    });
    const nextBlocks = blocks.filter((item) => !taskIds.has(String(item?.taskId)));
    const nextBlockModes = new Set(nextBlocks.map((block) => String(block?.planningMode || "").toLowerCase() === "deadline-sprint"
      ? "deadline-sprint"
      : "balanced"));
    const nextMode = nextBlockModes.has("deadline-sprint") && nextBlockModes.has("balanced")
      ? "mixed"
      : nextBlockModes.has("deadline-sprint") ? "deadline-sprint" : "balanced";
    nextPlans[dayKeyValue] = {
      ...plan,
      ...(Number(plan.version) === 2 ? { mode: nextMode } : {}),
      adopted_at: Math.max(Number.isFinite(Number(plan.adopted_at)) ? Number(plan.adopted_at) : 0, revisedAt),
      priorities: priorities.filter((item) => !taskIds.has(String(item?.taskId))),
      blocks: nextBlocks,
      warnings,
    };
  });
  return nextPlans;
}

function refreshAfterTaskDeletion() {
  renderTasks();
  renderTimeline();
  renderWeekSchedule();
  renderDdl();
  renderWidgets();
  renderFocusFeed();
  renderHome();
  renderNotificationButton();
  updatePageBadge();
}

function deleteTasksByIds(taskIds, deletedAt) {
  const timestamp = Number(deletedAt);
  const requestedIds = new Set((Array.isArray(taskIds) ? taskIds : [taskIds])
    .map((id) => id === undefined || id === null ? "" : String(id))
    .filter((id) => id.trim() && !["__proto__", "prototype", "constructor"].includes(id)));
  if (!requestedIds.size) return { ok: false, reason: "invalid-task-id", deletedIds: [] };
  if (!Number.isFinite(timestamp)) return { ok: false, reason: "invalid-deleted-at", deletedIds: [] };
  const deletedTasks = (Array.isArray(state.tasks) ? state.tasks : [])
    .filter((task) => requestedIds.has(String(task?.id)));
  if (!deletedTasks.length) return { ok: false, reason: "task-not-found", deletedIds: [] };

  const deletedIds = new Set(deletedTasks.map((task) => String(task.id)));
  const deletions = normalizeDeletionRegistry(state.deletions);
  deletedIds.forEach((taskId) => {
    const previous = Number(deletions.tasks[taskId]?.deletedAt);
    deletions.tasks[taskId] = {
      deletedAt: Number.isFinite(previous) ? Math.max(previous, timestamp) : timestamp,
    };
  });
  const revisionAt = Math.max(timestamp, ...[...deletedIds].map((taskId) => deletions.tasks[taskId].deletedAt));
  state.deletions = deletions;
  state.tasks = state.tasks.filter((task) => !deletedIds.has(String(task?.id)));
  state.dailyPlans = removeDeletedTaskReferencesFromPlans(state.dailyPlans, deletedIds, timestamp, revisionAt);
  if (dailyPlanReferencesAnyTask(dailyPlanPreview, deletedIds)) {
    dailyPlanPreview = null;
    dailyPlanPreviewError = null;
    dailyPlanAdoptionError = null;
    dailyPlanPreviewNeedsRegeneration = true;
  }
  saveState();
  deletedTasks.forEach((task) => {
    try {
      const cancellation = cancelTaskNotification(task);
      if (cancellation?.catch) cancellation.catch((error) => console.error("Task notification cancellation failed:", error));
    } catch (error) {
      console.error("Task notification cancellation failed:", error);
    }
  });
  refreshAfterTaskDeletion();
  return { ok: true, reason: null, deletedIds: [...deletedIds] };
}

function deleteTaskById(taskId, deletedAt) {
  return deleteTasksByIds([taskId], deletedAt);
}

function clearDoneTasks() {
  const doneTaskIds = state.tasks.filter((task) => task.done).map((task) => task.id);
  if (!doneTaskIds.length) return { ok: false, reason: "no-completed-tasks", deletedIds: [] };
  return deleteTasksByIds(doneTaskIds, Date.now());
}

function setDefaultTaskTimes() {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  els.taskStart.value = toInputValue(start);
  els.taskEnd.value = toInputValue(end);
  syncReminderAtFromRelative();
}

async function requestNotifications() {
  if (getLocalNotifications()) {
    const permission = await requestLocalNotificationPermission();
    if (permission) {
      await ensureTaskNotificationChannel();
      const exact = await ensureExactNotificationAccess(true);
      await schedulePendingTaskNotifications();
      showReminderToast(
        exact ? "系统提醒已完整开启" : "系统提醒已开启",
        exact
          ? "任务提醒已交给 Android 精确定时，切到其他应用或锁屏后也会提醒。"
          : "通知权限已开启；若需要准点提醒，请在系统页面允许“闹钟和提醒”。"
      );
    } else {
      showReminderToast("系统提醒未开启", "请在系统通知权限中允许自见发送通知。");
    }
    renderNotificationButton();
    return;
  }
  if (!("Notification" in window)) {
    showReminderToast("提醒已准备", "当前环境不支持系统通知，我会用应用内弹窗提醒。");
    return;
  }
  const permission = await Notification.requestPermission();
  renderNotificationButton();
  showReminderToast(
    permission === "granted" ? "通知已开启" : "通知未开启",
    permission === "granted" ? "任务快结束还没完成时，会弹出提醒。" : "我会先用应用内弹窗、页面标题和任务高亮提醒。"
  );
}

function renderNotificationButton() {
  if (getLocalNotifications()) {
    els.notifyButton.classList.add("is-on");
    return;
  }
  if (!("Notification" in window)) {
    els.notifyButton.classList.remove("is-on");
    return;
  }
  els.notifyButton.classList.toggle("is-on", Notification.permission === "granted");
}

function getTaskColor(id) {
  return TASK_COLORS.find((color) => color.id === id) || TASK_COLORS[0];
}

function getTaskReminderAt(task) {
  if (task.reminderMode === "absolute" && task.reminderAt) return task.reminderAt;
  return task.endAt - (task.remindBeforeMinutes || 15) * MINUTE * 1000;
}

let localNotificationsPlugin = null;

function getLocalNotifications() {
  if (localNotificationsPlugin) return localNotificationsPlugin;
  const capacitor = window.Capacitor;
  if (!capacitor) return null;
  const isNative = typeof capacitor.isNativePlatform !== "function" || capacitor.isNativePlatform();
  localNotificationsPlugin = capacitor.Plugins?.LocalNotifications
    || capacitor.plugins?.LocalNotifications
    || (isNative && typeof capacitor.registerPlugin === "function" ? capacitor.registerPlugin("LocalNotifications") : null);
  return localNotificationsPlugin;
}

function getSystemBridge() {
  if (systemBridgePlugin) return systemBridgePlugin;
  const capacitor = window.Capacitor;
  if (!capacitor || (typeof capacitor.isNativePlatform === "function" && !capacitor.isNativePlatform())) return null;
  systemBridgePlugin = capacitor.Plugins?.SystemBridge
    || capacitor.plugins?.SystemBridge
    || (typeof capacitor.registerPlugin === "function" ? capacitor.registerPlugin("SystemBridge") : null);
  return systemBridgePlugin;
}

async function openSystemNotificationSettings() {
  const bridge = getSystemBridge();
  if (!bridge) {
    showReminderToast("请在手机设置中打开", "进入应用、自见、通知，然后启用横幅通知。");
    return;
  }
  await bridge.openNotificationSettings();
}

async function ensureTaskNotificationChannel() {
  const localNotifications = getLocalNotifications();
  if (!localNotifications?.createChannel) return;
  const bridge = getSystemBridge();
  if (bridge?.ensureReminderChannel) await bridge.ensureReminderChannel();
  await localNotifications.createChannel({
    id: TASK_NOTIFICATION_CHANNEL_ID,
    name: "任务与 DDL 提醒",
    description: "在任务或 DDL 到期前显示醒目的系统提醒",
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: "#F2C96D",
  });
}

async function ensureExactNotificationAccess(shouldRequest = false) {
  const localNotifications = getLocalNotifications();
  if (!localNotifications?.checkExactNotificationSetting) return true;
  try {
    const current = await localNotifications.checkExactNotificationSetting();
    if (current.exact_alarm === "granted") return true;
    if (!shouldRequest || !localNotifications.changeExactNotificationSetting) return false;
    const next = await localNotifications.changeExactNotificationSetting();
    return next.exact_alarm === "granted";
  } catch (error) {
    console.error("Exact notification setting check failed:", error);
    return false;
  }
}

function notificationIdForTask(task) {
  let hash = 0;
  for (const char of task.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 100000 + (hash % 900000);
}

async function requestLocalNotificationPermission() {
  const localNotifications = getLocalNotifications();
  if (!localNotifications) return false;
  const current = await localNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const next = await localNotifications.requestPermissions();
  return next.display === "granted";
}

async function hasLocalNotificationPermission() {
  const localNotifications = getLocalNotifications();
  if (!localNotifications) return false;
  const current = await localNotifications.checkPermissions();
  return current.display === "granted";
}

async function scheduleTaskNotification(task, options = {}) {
  const localNotifications = getLocalNotifications();
  const remindAt = getTaskReminderAt(task);
  if (!localNotifications || task.done || remindAt <= Date.now() || remindAt > task.endAt) return;
  const granted = options.request
    ? await requestLocalNotificationPermission()
    : await hasLocalNotificationPermission();
  if (!granted) return;
  await ensureTaskNotificationChannel();
  const exact = await ensureExactNotificationAccess(false);
  const result = await localNotifications.schedule({
    notifications: [{
      id: notificationIdForTask(task),
      title: "任务快到时间了",
      body: `${task.title} 将在 ${formatDateTime(task.endAt)} 结束。`,
      channelId: TASK_NOTIFICATION_CHANNEL_ID,
      schedule: { at: new Date(remindAt), allowWhileIdle: exact },
      extra: { taskId: task.id, destination: "tasks" },
    }],
  });
  const scheduled = result?.notifications?.some((item) => item.id === notificationIdForTask(task));
  if (!scheduled) throw new Error("Android did not confirm the scheduled notification.");
}

async function cancelTaskNotification(task) {
  const localNotifications = getLocalNotifications();
  if (!localNotifications) return;
  await localNotifications.cancel({ notifications: [{ id: notificationIdForTask(task) }] });
}

async function schedulePendingTaskNotifications() {
  const tasks = state.tasks.filter((task) => !task.done && getTaskReminderAt(task) > Date.now());
  for (const task of tasks) await scheduleTaskNotification(task);
}

async function initializeNativeNotifications() {
  const localNotifications = getLocalNotifications();
  if (!localNotifications) return;
  await ensureTaskNotificationChannel();
  if (await hasLocalNotificationPermission()) await schedulePendingTaskNotifications();
  if (localNotifications.addListener) {
    await localNotifications.addListener("localNotificationActionPerformed", () => setActiveView("tasks"));
  }
}

async function testNativeNotification() {
  const localNotifications = getLocalNotifications();
  if (!localNotifications) {
    showReminderToast("原生通知不可用", "当前没有连接到 Android 本地通知插件，请确认安装的是最新 APK。");
    return;
  }
  try {
    const granted = await requestLocalNotificationPermission();
    if (!granted) {
      showReminderToast("没有通知权限", "请在系统设置中允许自见发送通知。");
      return;
    }
    await ensureTaskNotificationChannel();
    const exact = await ensureExactNotificationAccess(true);
    const testId = 990001;
    await localNotifications.cancel({ notifications: [{ id: testId }] });
    const result = await localNotifications.schedule({
      notifications: [{
        id: testId,
        title: "自见系统提醒测试",
        body: "如果你切到其他应用后看到这条横幅，后台提醒已经正常工作。",
        channelId: TASK_NOTIFICATION_CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 8000), allowWhileIdle: false },
        extra: { destination: "tasks", test: true },
      }],
    });
    const pending = await localNotifications.getPending();
    const confirmed = result?.notifications?.some((item) => item.id === testId)
      && pending?.notifications?.some((item) => item.id === testId);
    showReminderToast(
      confirmed ? "系统提醒已预约" : "系统没有确认提醒",
      confirmed ? "请现在切到其他应用，8 秒后应从屏幕顶部弹出测试通知。" : "请重新允许通知与“闹钟和提醒”权限。"
    );
  } catch (error) {
    console.error("Native notification test failed:", error);
    showReminderToast("系统提醒测试失败", error?.message || "请检查通知权限和闹钟权限。");
  }
}

function notifyTask(task) {
  const title = "任务快到时间了";
  const body = `${task.title} 将在 ${formatDateTime(task.endAt)} 结束，还没有完成。`;
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "./icon.svg", tag: task.id });
  }
  showReminderToast(title, body);
  state.tasks = state.tasks.map((item) => item.id === task.id ? { ...item, reminded: true } : item);
  saveState();
  renderTasks();
  updatePageBadge();
}

function showReminderToast(title, body) {
  els.reminderToastTitle.textContent = title;
  els.reminderToastBody.textContent = body;
  els.reminderToast.hidden = false;
  els.reminderToast.classList.remove("is-visible");
  window.requestAnimationFrame(() => els.reminderToast.classList.add("is-visible"));
  window.clearTimeout(showReminderToast.hideHandle);
  showReminderToast.hideHandle = window.setTimeout(() => {
    els.reminderToast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!els.reminderToast.classList.contains("is-visible")) els.reminderToast.hidden = true;
    }, 220);
  }, 5200);
}

function checkReminders() {
  const now = Date.now();
  for (const task of state.tasks) {
    const remindAt = getTaskReminderAt(task);
    const shouldRemind = !task.done && !task.reminded && now >= remindAt && now <= task.endAt;
    if (shouldRemind) notifyTask(task);
  }
  updatePageBadge();
}

function updatePageBadge() {
  const urgentCount = state.tasks.filter((task) => {
    const status = getTaskStatus(task);
    return status === "urgent" || status === "overdue";
  }).length;
  document.title = urgentCount > 0 ? `(${urgentCount}) ${BASE_TITLE}` : BASE_TITLE;
}

function setChickPosition(percent) {
  const next = Math.min(68, Math.max(8, percent));
  const last = Number(els.chick.dataset.lastLeft || 64);
  els.chick.style.setProperty("--chick-left", `${next}%`);
  els.chick.classList.toggle("is-facing-left", next < last);
  els.chick.dataset.lastLeft = String(next);
}

function playChickJump() {
  els.chick.classList.remove("is-hopping");
  window.requestAnimationFrame(() => {
    els.chick.classList.add("is-hopping");
    window.setTimeout(() => els.chick.classList.remove("is-hopping"), 720);
  });
}

function moveChickRandomly() {
  if (els.chick.classList.contains("stage-egg")) return;
  setChickPosition(10 + Math.random() * 52);
}

function playWind() {
  els.scene.classList.add("has-breeze");
  if (Math.random() > 0.35) releaseFlowerSeeds();
  window.setTimeout(() => els.scene.classList.remove("has-breeze"), 2200);
}

function scatterCloud(cloud) {
  const directions = [["-46px", "-22px"], ["48px", "-26px"], ["-34px", "26px"], ["42px", "24px"]];
  const [x, y] = directions[Math.floor(Math.random() * directions.length)];
  cloud.style.setProperty("--cloud-run-x", x);
  cloud.style.setProperty("--cloud-run-y", y);
  cloud.classList.remove("is-scared");
  window.requestAnimationFrame(() => {
    cloud.classList.add("is-scared");
    window.setTimeout(() => cloud.classList.remove("is-scared"), 900);
  });
}

function driftCloud(cloud) {
  cloud.style.setProperty("--cloud-drift-x", `${Math.round(-32 + Math.random() * 64)}px`);
  cloud.style.setProperty("--cloud-drift-y", `${Math.round(-18 + Math.random() * 36)}px`);
}

function setWeather(weather, announce = false) {
  state.weather = weather;
  els.scene.dataset.weather = weather;
  currentWeatherIndex = WEATHER_STATES.indexOf(weather);
  saveState();
  playWind();
  if (announce) {
    els.timerNote.textContent = {
      sunny: "适合开始一轮干净的专注。",
      cloudy: "界面安静了一点。",
      rainy: "慢一点也没关系。",
    }[weather];
  }
}

function toggleWeather() {
  const next = WEATHER_STATES[(currentWeatherIndex + 1) % WEATHER_STATES.length];
  setWeather(next, true);
}

function randomizeWeather() {
  setWeather(WEATHER_STATES[Math.floor(Math.random() * WEATHER_STATES.length)]);
}

function spawnSeed() {
  const seed = document.createElement("span");
  seed.className = "seed";
  seed.style.left = `${8 + Math.random() * 70}%`;
  seed.style.setProperty("--seed-drift", `${-60 + Math.random() * 90}px`);
  els.seedLayer.append(seed);
  window.setTimeout(() => {
    if (!seed.isConnected) return;
    if (Math.random() > 0.55) setChickPosition(Number.parseFloat(seed.style.left || "45"));
    if (Math.random() > 0.42) growGrassAtSeed(seed);
    seed.remove();
  }, 4200);
}

function releaseFlowerSeeds() {
  for (let index = 0; index < 4; index += 1) {
    const seed = document.createElement("span");
    seed.className = "flower-seed";
    seed.style.left = `${21 + Math.random() * 8}%`;
    seed.style.top = `${34 + Math.random() * 8}%`;
    seed.style.setProperty("--flower-seed-x", `${90 + Math.random() * 150}px`);
    seed.style.setProperty("--flower-seed-y", `${-18 + Math.random() * 70}px`);
    els.seedLayer.append(seed);
    window.setTimeout(() => seed.remove(), 2400);
  }
}

function toggleFlower() {
  els.plant.classList.add("is-shy");
  releaseFlowerSeeds();
  window.setTimeout(() => els.plant.classList.remove("is-shy"), 1300);
}

function growGrassAtSeed(seed) {
  const blade = document.createElement("span");
  blade.className = "wild-grass";
  blade.style.left = seed.style.left;
  blade.style.setProperty("--grass-height", `${28 + Math.random() * 38}px`);
  blade.style.setProperty("--grass-tilt", `${-14 + Math.random() * 28}deg`);
  els.grassPatch.append(blade);
}

function nibbleGrass() {
  const grasses = [...els.grassPatch.querySelectorAll(".wild-grass")];
  if (grasses.length === 0 || Math.random() > 0.55) return;
  const grass = grasses[Math.floor(Math.random() * grasses.length)];
  const grassLeft = Number.parseFloat(grass.style.left || "50");
  setChickPosition(Math.max(8, Math.min(78, grassLeft - 4)));
  grass.classList.add("is-eaten");
  window.setTimeout(() => grass.remove(), 520);
}

function scheduleLoop(callback, minDelay, maxExtraDelay) {
  window.setTimeout(() => {
    callback();
    scheduleLoop(callback, minDelay, maxExtraDelay);
  }, minDelay + Math.random() * maxExtraDelay);
}

function getTaskStatus(task) {
  if (task.done) return "done";
  const now = Date.now();
  if (now > task.endAt) return "overdue";
  if (now >= getTaskReminderAt(task)) return "urgent";
  if (now >= task.startAt) return "active";
  return "waiting";
}

function getHeatLevel(minutes) {
  if (!minutes) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function getStreak() {
  let streak = 0;
  const cursor = new Date();
  while ((state.focusByDate[dateKey(cursor)] || 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderTimer() {
  const elapsed = state.timerTotalSeconds - state.timerSecondsLeft;
  const progress = Math.min(100, Math.max(0, elapsed / state.timerTotalSeconds * 100));
  const growth = 0.36 + progress / 100 * 0.78;
  const angle = minutesToAngle(state.selectedMinutes);
  const stage = state.isRunning ? CHICK_STAGES[Math.min(3, Math.floor(progress / 25))] : "chick";

  els.timeDisplay.textContent = formatTime(state.timerSecondsLeft);
  els.flameBalanceText.textContent = `火苗 ${state.flames || 0}`;
  els.progressBar.style.width = `${progress}%`;
  els.plant.style.setProperty("--plant-scale", growth.toFixed(2));
  els.plant.style.setProperty("--flower-opacity", progress > 70 ? "1" : "0");
  els.scene.classList.toggle("is-running", state.isRunning);
  els.chick.classList.remove("stage-egg", "stage-hatching", "stage-chick", "stage-grown");
  els.chick.classList.add(`stage-${stage}`);
  els.chick.classList.toggle("is-proud", progress > 70);
  els.startPauseButton.textContent = state.isRunning ? "暂停" : "开始";
  els.minuteRange.value = state.selectedMinutes;
  els.dialMinutes.textContent = state.selectedMinutes;
  els.timerDial.style.setProperty("--dial-progress", `${((state.selectedMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES) * 100).toFixed(1)}%`);
  const knobRadius = Math.max(54, Math.round(els.timerDial.clientWidth * 0.37));
  els.dialKnob.style.transform = `rotate(${angle}deg) translateY(-${knobRadius}px)`;
  els.timerDial.setAttribute("aria-valuenow", state.selectedMinutes);
  els.fastFinishButton.disabled = (state.flames || 0) < FAST_FINISH_COST;

  if (state.isRunning) {
    els.timerNote.textContent = progress > 70 ? "快完成了，小鸡已经长成，草地也热闹起来。" : "专注中，小鸡会从破壳慢慢长大。";
  } else if (elapsed > 0) {
    els.timerNote.textContent = "这次专注已经开始发芽，可以继续，也可以重置。";
  } else {
    els.timerNote.textContent = "拖动横线选择时长，开始后会看到小鸡从破壳长成。";
  }

  els.chipButtons.forEach((button) => {
    const minutes = Number(button.dataset.minutes);
    button.classList.toggle("is-active", minutes === state.selectedMinutes);
    button.disabled = state.isRunning;
  });
  els.minuteRange.disabled = state.isRunning;
  els.timerDial.classList.toggle("is-disabled", state.isRunning);
}

function renderTasks() {
  sortTasks();
  els.taskList.innerHTML = "";
  els.emptyTasks.hidden = state.tasks.length > 0;

  for (const task of state.tasks) {
    const status = getTaskStatus(task);
    const color = getTaskColor(task.color);
    const item = document.createElement("li");
    item.className = `task-item is-${status}`;
    item.style.setProperty("--task-bg", color.bg);
    item.style.setProperty("--task-border", color.border);
    item.style.setProperty("--task-ink", color.ink);
    item.style.setProperty("--task-badge-bg", color.badge);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `完成 ${task.title}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-main";
    content.tabIndex = 0;
    content.setAttribute("role", "button");
    content.setAttribute("aria-label", `查看任务 ${task.title}`);
    content.addEventListener("click", () => showEventDetail({ ...task, type: "task" }));
    content.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showEventDetail({ ...task, type: "task" });
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("span");
    meta.className = "task-time";
    const reminderText = task.reminderMode === "absolute" && task.reminderAt
      ? `提醒 ${formatDateTime(task.reminderAt)}`
      : `提前 ${task.remindBeforeMinutes} 分钟提醒`;
    meta.textContent = `${formatDateTime(task.startAt)} 到 ${formatDateTime(task.endAt)} · ${reminderText}`;

    content.append(title, meta);

    const badge = document.createElement("span");
    badge.className = "task-badge";
    badge.textContent = { done: "完成", overdue: "已超时", urgent: "快结束", active: "进行中", waiting: "未开始" }[status];

    item.append(checkbox, content, badge);
    els.taskList.append(item);
  }
}

function renderTimeline() {
  const labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const selectedDate = new Date(`${selectedTimelineDate}T00:00:00`);
  const weekStart = getWeekStart(selectedDate);
  const todayKey = dateKey();

  els.weekStrip.innerHTML = "";
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const key = dateKey(day);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-day";
    button.classList.toggle("is-selected", key === selectedTimelineDate);
    button.classList.toggle("is-today", key === todayKey);
    const label = document.createElement("span");
    label.textContent = labels[index];
    const number = document.createElement("strong");
    number.textContent = String(day.getDate());
    const ddlCount = state.tasks.filter((task) => !task.done && dateKey(new Date(task.endAt)) === key).length;
    if (ddlCount > 0) {
      const badge = document.createElement("em");
      badge.className = "ddl-count";
      badge.textContent = ddlCount;
      button.append(badge);
    }
    button.append(label, number);
    button.addEventListener("click", () => {
      selectedTimelineDate = key;
      renderTimeline();
    });
    els.weekStrip.append(button);
  }

  const dayTasks = state.tasks
    .filter((task) => dateKey(new Date(task.startAt)) === selectedTimelineDate)
    .sort((a, b) => a.startAt - b.startAt);
  const dayCourses = getDayCourses(selectedTimelineDate)
    .map((course) => ({ ...course, type: "course", color: "sky", done: false }));
  const dayFocus = (state.focusSessions || [])
    .filter((session) => dateKey(new Date(session.startAt)) === selectedTimelineDate)
    .map((session) => ({ ...session, type: "focus", color: "lemon", done: true }));
  const dayPlannedFocus = getAdoptedFocusBlocksForDay(selectedTimelineDate);
  const timelineItems = [
    ...dayTasks.map((task) => ({ ...task, type: "task" })),
    ...dayCourses,
    ...dayFocus,
    ...dayPlannedFocus,
  ].sort((a, b) => a.startAt - b.startAt);
  const totalMinutes = timelineItems.reduce((sum, item) => sum + Math.max(1, Math.round((item.endAt - item.startAt) / 60000)), 0);
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const weekday = labels[(selectedDate.getDay() || 7) - 1];
  els.timelineDateTitle.textContent = `${month}月${day}日 ${weekday}`;
  els.timelineStats.textContent = `${timelineItems.length}次 · ${totalMinutes === 0 ? "0分钟" : formatDuration(0, totalMinutes * 60000)}`;

  els.timelineList.innerHTML = "";
  if (timelineItems.length === 0) {
    const empty = document.createElement("li");
    empty.className = "timeline-empty";
    empty.textContent = "这一天还没有安排。";
    els.timelineList.append(empty);
    return;
  }

  for (const entry of timelineItems) {
    const color = getTaskColor(entry.color);
    const item = document.createElement("li");
    const itemState = entry.type === "focus" || entry.type === "course"
      ? "done"
      : entry.type === "planned-focus" ? "planned" : getTaskStatus(entry);
    item.className = `timeline-item is-${itemState}`;
    item.style.setProperty("--task-bg", color.bg);
    item.style.setProperty("--task-border", color.border);
    item.style.setProperty("--task-ink", color.ink);

    const time = document.createElement("div");
    time.className = "timeline-time";
    const timeRange = document.createElement("strong");
    timeRange.textContent = `${formatClock(entry.startAt)}~${formatClock(entry.endAt)}`;
    const durationText = document.createElement("span");
    durationText.textContent = formatDuration(entry.startAt, entry.endAt);
    time.append(timeRange, durationText);

    const card = document.createElement(entry.type === "planned-focus" ? "button" : "div");
    card.className = "timeline-task-card";
    const icon = entry.type === "focus" ? "专" : entry.type === "planned-focus" ? "计" : entry.type === "course" ? "课" : entry.done ? "✓" : "◦";
    const meta = entry.type === "focus"
      ? "完成一次专注"
      : entry.type === "planned-focus"
        ? `计划专注${entry.orphaned ? " · 原任务已删除" : ""}`
      : entry.type === "course"
        ? (entry.location || "课程安排")
        : entry.done ? "已完成" : "进行计划中";
    const cardTitle = document.createElement("strong");
    cardTitle.textContent = `${icon} ${entry.title}`;
    const cardMeta = document.createElement("span");
    cardMeta.textContent = meta;
    card.append(cardTitle, cardMeta);
    if (entry.type === "planned-focus") {
      card.type = "button";
      card.classList.add("is-planned-focus");
      card.setAttribute("aria-label", `计划专注 ${entry.title}，${formatClock(entry.startAt)} 到 ${formatClock(entry.endAt)}`);
      card.addEventListener("click", () => showEventDetail(entry));
    }

    item.append(time, card);
    els.timelineList.append(item);
  }
}

function layoutOverlappingEvents(events) {
  const sorted = (Array.isArray(events) ? events : [])
    .filter((event) => event && typeof event === "object"
      && String(event.id || "").trim()
      && Number.isFinite(Number(event.startAt))
      && Number.isFinite(Number(event.endAt))
      && Number(event.endAt) > Number(event.startAt))
    .map((event) => ({ ...event, startAt: Number(event.startAt), endAt: Number(event.endAt) }))
    .sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt || String(a.id).localeCompare(String(b.id)));
  const groups = [];
  let current = [];
  let currentEndAt = -Infinity;
  sorted.forEach((event) => {
    if (current.length > 0 && event.startAt >= currentEndAt) {
      groups.push(current);
      current = [];
      currentEndAt = -Infinity;
    }
    current.push(event);
    currentEndAt = Math.max(currentEndAt, event.endAt);
  });
  if (current.length > 0) groups.push(current);

  return groups.flatMap((group, groupIndex) => {
    const laneEnds = [];
    const assigned = group.map((event) => {
      let laneIndex = laneEnds.findIndex((endAt) => endAt <= event.startAt);
      if (laneIndex < 0) {
        laneIndex = laneEnds.length;
        laneEnds.push(event.endAt);
      } else {
        laneEnds[laneIndex] = event.endAt;
      }
      return { ...event, laneIndex };
    });
    const laneCount = laneEnds.length;
    const visibleLaneCount = Math.min(3, laneCount);
    const gapPercent = visibleLaneCount > 1 ? 1.5 : 0;
    const widthPercent = (100 - gapPercent * (visibleLaneCount - 1)) / visibleLaneCount;
    const overlapGroupId = `week-overlap-${groupIndex}-${group[0].startAt}-${group.map((event) => String(event.id)).join("-")}`;
    return assigned.map((event) => ({
      ...event,
      laneCount,
      overlapGroupId,
      widthPercent,
      leftPercent: event.laneIndex * (widthPercent + gapPercent),
    }));
  });
}

function weekEventDisplayPriority(item) {
  if (item?.type === "course") return 0;
  if (item?.type === "task" && globalThis.DailyPlanner?.isFixedTimeTask?.(item)) return 1;
  if (item?.type === "planned-focus") return 2;
  return 3;
}

function showWeekOverlapSummary(events) {
  const items = (Array.isArray(events) ? events : [])
    .slice()
    .sort((a, b) => Number(a.startAt) - Number(b.startAt)
      || weekEventDisplayPriority(a) - weekEventDisplayPriority(b)
      || String(a.id).localeCompare(String(b.id)));
  if (!items.length) return;
  eventDetailTaskId = null;
  els.eventSheetType.textContent = "SCHEDULE";
  els.eventSheetTitle.textContent = `该时段共有 ${items.length} 项安排`;
  els.eventSheetMeta.textContent = "";
  const startAt = Math.min(...items.map((item) => Number(item.startAt)));
  const endAt = Math.max(...items.map((item) => Number(item.endAt)));
  const startText = document.createElement("span");
  const endText = document.createElement("span");
  const countText = document.createElement("strong");
  startText.textContent = formatDateTime(startAt);
  endText.textContent = formatDateTime(endAt);
  countText.textContent = `${items.length} 项`;
  els.eventSheetMeta.append(startText, endText, countText);
  els.eventSheetDescription.textContent = items.map((item) => {
    const type = item.type === "course"
      ? "课程"
      : item.type === "planned-focus" ? "计划专注" : globalThis.DailyPlanner?.isFixedTimeTask?.(item) ? "固定任务" : "任务";
    return `${formatClock(item.startAt)} ${type} · ${String(item.title || "未命名安排")}`;
  }).join("\n");
  if (els.eventSheetDeleteButton) els.eventSheetDeleteButton.hidden = true;
  els.eventSheet.hidden = false;
  document.body.classList.add("has-event-sheet");
}

function renderWeekSchedule() {
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  const dayStartHour = 7;
  const dayEndHour = 22;
  const totalMinutes = (dayEndHour - dayStartHour) * 60;
  const selectedDate = new Date(`${selectedWeekDate}T00:00:00`);
  const start = getWeekStart(selectedDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  els.weekRangeTitle.textContent = `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
  els.weekBoard.replaceChildren();
  let todayColumn = null;

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = dateKey(day);
    const column = document.createElement("article");
    column.className = "week-column";
    column.dataset.dayKey = key;
    column.classList.toggle("is-today", key === dateKey());
    if (key === dateKey()) todayColumn = column;
    const header = document.createElement("header");
    const headerLabel = document.createElement("span");
    headerLabel.textContent = `周${labels[index]}`;
    const headerDate = document.createElement("strong");
    headerDate.textContent = String(day.getDate());
    header.append(headerLabel, headerDate);
    column.append(header);

    const list = document.createElement("div");
    list.className = "week-course-list is-timed";
    const courses = getDayCourses(key).map((course) => ({ ...course, type: "course" }));
    const tasks = state.tasks
      .filter((task) => dateKey(new Date(task.startAt)) === key)
      .map((task) => ({ ...task, type: "task" }));
    const plannedFocus = getAdoptedFocusBlocksForDay(key);
    const dayWindowStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), dayStartHour).getTime();
    const dayWindowEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), dayEndHour).getTime();
    const calendarDayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const calendarDayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
    const items = [...courses, ...tasks, ...plannedFocus]
      .filter((item) => Number(item.startAt) < calendarDayEnd && Number(item.endAt) > calendarDayStart)
      .map((item) => {
        const originalStartAt = Math.max(Number(item.startAt), calendarDayStart);
        const originalEndAt = Math.min(Number(item.endAt), calendarDayEnd);
        const duration = Math.max(60000, originalEndAt - originalStartAt);
        const startAt = originalEndAt <= dayWindowStart
          ? dayWindowStart
          : originalStartAt >= dayWindowEnd ? Math.max(dayWindowStart, dayWindowEnd - duration) : Math.max(originalStartAt, dayWindowStart);
        const endAt = originalEndAt <= dayWindowStart
          ? Math.min(dayWindowEnd, dayWindowStart + duration)
          : originalStartAt >= dayWindowEnd ? dayWindowEnd : Math.min(originalEndAt, dayWindowEnd);
        return { ...item, detailItem: item, startAt, endAt };
      });
    const laidOutItems = layoutOverlappingEvents(items);
    column.classList.toggle("is-empty", items.length === 0);
    column.classList.toggle("is-light", items.length === 1);
    column.classList.toggle("is-normal", items.length > 1 && items.length <= 3);
    column.classList.toggle("is-busy", items.length > 3);

    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "week-empty";
      empty.textContent = "空";
      list.append(empty);
    } else {
      const groups = new Map();
      laidOutItems.forEach((item) => {
        if (!groups.has(item.overlapGroupId)) groups.set(item.overlapGroupId, []);
        groups.get(item.overlapGroupId).push(item);
      });
      const renderBlock = (item, laneIndex = item.laneIndex, laneCount = item.laneCount) => {
        const visibleStart = (item.startAt - dayWindowStart) / 60000;
        const visibleEnd = (item.endAt - dayWindowStart) / 60000;
        const top = visibleStart / totalMinutes * 100;
        const height = (visibleEnd - visibleStart) / totalMinutes * 100;
        const visibleLaneCount = Math.min(3, laneCount);
        const gapPercent = visibleLaneCount > 1 ? 1.5 : 0;
        const widthPercent = (100 - gapPercent * (visibleLaneCount - 1)) / visibleLaneCount;
        const block = document.createElement("button");
        block.type = "button";
        block.className = `week-block is-${item.type}`;
        if (visibleEnd - visibleStart < 30) block.classList.add("is-compact");
        const color = getTaskColor(item.color || (item.type === "course" ? "sky" : "sage"));
        block.style.setProperty("--week-block-bg", color.bg);
        block.style.setProperty("--week-block-border", color.border);
        block.style.setProperty("--week-block-ink", color.ink);
        block.style.setProperty("--event-top", `${Math.min(100, Math.max(0, top))}%`);
        block.style.setProperty("--event-height", `${Math.max(0.1, Math.min(100 - Math.min(100, Math.max(0, top)), height))}%`);
        block.style.setProperty("--event-left", `${laneIndex * (widthPercent + gapPercent)}%`);
        block.style.setProperty("--event-width", `${widthPercent}%`);
        const detailItem = item.detailItem || item;
        const blockTime = document.createElement("strong");
        blockTime.textContent = formatClock(detailItem.startAt);
        const blockTitle = document.createElement("span");
        blockTitle.textContent = item.title;
        block.append(blockTime, blockTitle);
        if (item.type === "planned-focus") {
          const blockType = document.createElement("small");
          const sprintLabel = item.planningMode === "deadline-sprint" ? " · 冲刺" : "";
          blockType.textContent = item.orphaned ? `计划专注${sprintLabel} · 原任务已删除` : `计划专注${sprintLabel}`;
          block.append(blockType);
          block.setAttribute("aria-label", `计划专注 ${item.title}，${formatClock(detailItem.startAt)} 到 ${formatClock(detailItem.endAt)}`);
        }
        block.addEventListener("click", () => showEventDetail(detailItem));
        list.append(block);
      };
      groups.forEach((group) => {
        const laneCount = Math.max(...group.map((item) => item.laneCount));
        if (laneCount <= 3) {
          group.forEach((item) => renderBlock(item));
          return;
        }
        const prioritized = group.slice().sort((a, b) => weekEventDisplayPriority(a) - weekEventDisplayPriority(b)
          || a.startAt - b.startAt || a.endAt - b.endAt || String(a.id).localeCompare(String(b.id)));
        prioritized.slice(0, 2).forEach((item, laneIndex) => renderBlock(item, laneIndex, 3));
        const hiddenCount = Math.max(1, group.length - 2);
        const summaryStartAt = Math.min(...group.map((item) => item.startAt));
        const summaryEndAt = Math.max(...group.map((item) => item.endAt));
        const visibleStart = (summaryStartAt - dayWindowStart) / 60000;
        const visibleEnd = (summaryEndAt - dayWindowStart) / 60000;
        const summaryBlock = document.createElement("button");
        summaryBlock.type = "button";
        summaryBlock.className = "week-block is-overlap-summary";
        summaryBlock.style.setProperty("--event-top", `${visibleStart / totalMinutes * 100}%`);
        summaryBlock.style.setProperty("--event-height", `${Math.max(0.1, (visibleEnd - visibleStart) / totalMinutes * 100)}%`);
        summaryBlock.style.setProperty("--event-left", `${2 * ((100 - 3) / 3 + 1.5)}%`);
        summaryBlock.style.setProperty("--event-width", `${(100 - 3) / 3}%`);
        const summaryTitle = document.createElement("strong");
        const summaryHint = document.createElement("span");
        summaryTitle.textContent = `+${hiddenCount} 项`;
        summaryHint.textContent = "查看全部";
        summaryBlock.append(summaryTitle, summaryHint);
        summaryBlock.setAttribute("aria-label", `${group.length} 项重叠安排，查看全部`);
        summaryBlock.addEventListener("click", () => showWeekOverlapSummary(group.map((item) => item.detailItem || item)));
        list.append(summaryBlock);
      });
    }

    column.append(list);
    els.weekBoard.append(column);
  }
  const mobileWeek = typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(max-width: 560px)").matches;
  if (mobileWeek && todayColumn && typeof todayColumn.scrollIntoView === "function") {
    todayColumn.scrollIntoView({ block: "nearest", inline: "center" });
  }
}

function showEventDetail(item) {
  const isCourse = item.type === "course";
  const isPlannedFocus = item.type === "planned-focus";
  eventDetailTaskId = isCourse || isPlannedFocus ? null : String(item.id);
  els.eventSheetType.textContent = isPlannedFocus ? "PLAN" : isCourse ? "Course" : "Task";
  els.eventSheetTitle.textContent = item.title;
  els.eventSheetMeta.textContent = "";
  const startText = document.createElement("span");
  startText.textContent = formatDateTime(item.startAt);
  const endText = document.createElement("span");
  endText.textContent = formatDateTime(item.endAt);
  const durationText = document.createElement("strong");
  durationText.textContent = formatDuration(item.startAt, item.endAt);
  els.eventSheetMeta.append(startText, endText, durationText);
  const details = [];
  if (isCourse && item.location) details.push(`地点：${item.location}`);
  if (isPlannedFocus) {
    details.push("来源：今日编排");
    if (item.orphaned) details.push("原任务已删除");
  } else if (!isCourse) details.push(item.done ? "状态：已完成" : "状态：未完成");
  if (item.description) details.push(item.description);
  els.eventSheetDescription.textContent = details.join("\n") || "点开这里就能看完整安排。";
  if (els.eventSheetDeleteButton) els.eventSheetDeleteButton.hidden = isCourse || isPlannedFocus;
  els.eventSheet.hidden = false;
  document.body.classList.add("has-event-sheet");
}

function hideEventDetail() {
  eventDetailTaskId = null;
  if (els.eventSheetDeleteButton) els.eventSheetDeleteButton.hidden = true;
  els.eventSheet.hidden = true;
  document.body.classList.remove("has-event-sheet");
}

function confirmDeleteEventTask() {
  const task = state.tasks.find((item) => String(item.id) === eventDetailTaskId);
  if (!task) return false;
  const confirmed = window.confirm(`确定删除任务“${String(task.title || "未命名任务")}”吗？删除后会从任务、DDL 和今日编排中移除。`);
  if (!confirmed) return false;
  const result = deleteTaskById(task.id, Date.now());
  if (!result.ok) return false;
  hideEventDetail();
  showReminderToast("任务已删除", "该任务已从任务、DDL 和今日编排中移除。");
  return true;
}

function showCompletionSheet(minutes, earned) {
  els.completeTitle.textContent = "恭喜完成专注";
  els.completeBody.textContent = earned > 0
    ? `小鸡已经长成。这次专注 ${minutes} 分钟，点亮 ${earned} 个火苗。`
    : `小鸡已经长成。这次专注 ${minutes} 分钟，专注记录已收好。`;
  els.chick.classList.add("stage-grown", "is-proud");
  els.completeSheet.hidden = false;
}

function hideCompletionSheet() {
  els.completeSheet.hidden = true;
}

function renderDdl() {
  const tasks = [...state.tasks].sort((a, b) => a.endAt - b.endAt);
  els.ddlList.innerHTML = "";
  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "timeline-empty";
    empty.textContent = "还没有 DDL。添加任务后会按截止日期出现在这里。";
    els.ddlList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const status = getTaskStatus(task);
    const color = getTaskColor(task.color);
    const now = Date.now();
    const remaining = task.done
      ? "已完成"
      : task.endAt < now
        ? "已超时"
        : `剩余 ${formatDuration(0, task.endAt - now)}`;
    const item = document.createElement("article");
    item.className = `ddl-item is-${status}`;
    item.style.setProperty("--task-bg", color.bg);
    item.style.setProperty("--task-border", color.border);
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = task.title;
    const end = document.createElement("span");
    end.textContent = `${formatDateTime(task.endAt)} 截止`;
    const remain = document.createElement("small");
    remain.textContent = remaining;
    content.append(title, end, remain);
    content.tabIndex = 0;
    content.setAttribute("role", "button");
    content.setAttribute("aria-label", `查看任务 ${task.title}`);
    content.addEventListener("click", () => showEventDetail({ ...task, type: "task" }));
    content.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showEventDetail({ ...task, type: "task" });
    });
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `完成 ${task.title}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));
    item.append(content, checkbox);
    els.ddlList.append(item);
  });
}

function addMemo(title, tag, body) {
  const normalizedTag = tag.trim() || "其他";
  if (!state.memoTags.includes(normalizedTag)) state.memoTags.push(normalizedTag);
  const memo = {
    id: crypto.randomUUID(),
    title,
    tag: normalizedTag,
    body,
    done: false,
    createdAt: Date.now(),
  };
  state.memos.unshift(memo);
  saveState();
  renderMemos();
  renderFocusFeed();
}

function updateMemo(id, title, tag, body) {
  const normalizedTag = tag.trim() || "其他";
  if (!state.memoTags.includes(normalizedTag)) state.memoTags.push(normalizedTag);
  state.memos = state.memos.map((memo) => memo.id === id
    ? { ...memo, title, tag: normalizedTag, body, updatedAt: Date.now() }
    : memo);
  saveState();
  renderMemos();
  renderFocusFeed();
}

function deleteMemoById(memoId, deletedAt) {
  const id = memoId === undefined || memoId === null ? "" : String(memoId);
  const timestamp = Number(deletedAt);
  if (!id.trim() || ["__proto__", "prototype", "constructor"].includes(id)) {
    return { ok: false, reason: "invalid-memo-id", deletedId: null };
  }
  if (!Number.isFinite(timestamp)) return { ok: false, reason: "invalid-deleted-at", deletedId: null };
  const memo = (Array.isArray(state.memos) ? state.memos : []).find((item) => String(item?.id) === id);
  if (!memo) return { ok: false, reason: "memo-not-found", deletedId: null };

  const deletions = normalizeDeletionRegistry(state.deletions);
  const previous = Number(deletions.memos[id]?.deletedAt);
  deletions.memos[id] = {
    deletedAt: Number.isFinite(previous) ? Math.max(previous, timestamp) : timestamp,
  };
  const previousDeletions = state.deletions;
  const previousMemos = state.memos;
  const previousSyncUpdatedAt = state.syncUpdatedAt;
  state.deletions = deletions;
  state.memos = filterDeletedEntities(state.memos, { [id]: deletions.memos[id] });
  try {
    const result = saveState();
    if (result === false) throw new Error("saveState returned false");
  } catch (error) {
    console.error("Memo deletion failed:", error);
    state.deletions = previousDeletions;
    state.memos = previousMemos;
    state.syncUpdatedAt = previousSyncUpdatedAt;
    return { ok: false, reason: "save-failed", deletedId: null };
  }
  memoExportIds.delete(memo.id);
  memoExportIds.delete(id);
  renderMemos();
  renderFocusFeed();
  if (els.memoExportSheet && !els.memoExportSheet.hidden) renderMemoExportSheet();
  return { ok: true, reason: null, deletedId: id };
}

function showMemoEditor(mode = "add") {
  els.memoEditorTitle.textContent = mode === "edit" ? "修改备忘" : "添加备忘";
  els.memoSubmitButton.textContent = mode === "edit" ? "保存修改" : "记下";
  els.memoCancelEditButton.hidden = mode !== "edit";
  els.memoDeleteButton.hidden = mode !== "edit";
  els.memoEditorSheet.hidden = false;
  requestAnimationFrame(() => els.memoTitle.focus());
}

function hideMemoEditor() {
  els.memoEditorSheet.hidden = true;
}

function openNewMemoEditor() {
  editingMemoId = null;
  els.memoTitle.value = "";
  els.memoCustomTag.value = "";
  els.memoBody.value = "";
  els.memoTag.value = state.selectedMemoTag !== "全部" && state.memoTags.includes(state.selectedMemoTag)
    ? state.selectedMemoTag
    : state.memoTags[0] || "其他";
  showMemoEditor("add");
}

function startEditMemo(memo) {
  editingMemoId = memo.id;
  els.memoTitle.value = memo.title;
  els.memoTag.value = state.memoTags.includes(memo.tag) ? memo.tag : "其他";
  els.memoCustomTag.value = state.memoTags.includes(memo.tag) ? "" : memo.tag;
  els.memoBody.value = memo.body || "";
  showMemoEditor("edit");
}

function cancelEditMemo() {
  editingMemoId = null;
  els.memoTitle.value = "";
  els.memoCustomTag.value = "";
  els.memoBody.value = "";
  els.memoTag.value = state.selectedMemoTag !== "全部" && state.memoTags.includes(state.selectedMemoTag)
    ? state.selectedMemoTag
    : state.memoTags[0] || "其他";
  els.memoSubmitButton.textContent = "记下";
  els.memoCancelEditButton.hidden = true;
  els.memoDeleteButton.hidden = true;
  hideMemoEditor();
}

function confirmDeleteEditingMemo() {
  const memo = state.memos.find((item) => String(item.id) === String(editingMemoId || ""));
  if (!memo) return false;
  const confirmed = window.confirm(`确定删除备忘“${String(memo.title || "未命名备忘")}”吗？删除后将不再出现在备忘和专注轮播中。`);
  if (!confirmed) return false;
  const result = deleteMemoById(memo.id, Date.now());
  if (!result.ok) {
    showReminderToast("删除失败", "请稍后重试。");
    return false;
  }
  cancelEditMemo();
  showReminderToast("备忘已删除", "该备忘已从备忘和专注轮播中移除。");
  return true;
}

function toggleMemo(id) {
  state.memos = state.memos.map((memo) => memo.id === id ? { ...memo, done: !memo.done } : memo);
  saveState();
  renderMemos();
  renderFocusFeed();
}

function getMemoExportCandidates() {
  if (memoExportTags.size === 0) return [];
  return state.memos
    .filter((memo) => memoExportTags.has(memo.tag))
    .sort((a, b) => a.tag.localeCompare(b.tag, "zh-Hans-CN") || b.createdAt - a.createdAt);
}

function renderMemoExportSheet() {
  els.memoExportTags.textContent = "";
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "memo-export-tag";
  allButton.classList.toggle("is-active", memoExportTags.size === state.memoTags.length);
  allButton.textContent = "全部分类";
  allButton.addEventListener("click", () => {
    memoExportTags = memoExportTags.size === state.memoTags.length ? new Set() : new Set(state.memoTags);
    memoExportIds = new Set(getMemoExportCandidates().map((memo) => memo.id));
    renderMemoExportSheet();
  });
  els.memoExportTags.append(allButton);

  state.memoTags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memo-export-tag";
    button.classList.toggle("is-active", memoExportTags.has(tag));
    const count = state.memos.filter((memo) => memo.tag === tag).length;
    button.textContent = `${tag} ${count}`;
    button.addEventListener("click", () => {
      if (memoExportTags.has(tag)) memoExportTags.delete(tag);
      else memoExportTags.add(tag);
      const visibleIds = new Set(getMemoExportCandidates().map((memo) => memo.id));
      memoExportIds = new Set([...memoExportIds].filter((id) => visibleIds.has(id)));
      if (!memoExportIds.size) memoExportIds = visibleIds;
      renderMemoExportSheet();
    });
    els.memoExportTags.append(button);
  });

  const candidates = getMemoExportCandidates();
  els.memoExportList.textContent = "";
  if (candidates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "timeline-empty";
    empty.textContent = "先选择一个有内容的分类。";
    els.memoExportList.append(empty);
    return;
  }

  candidates.forEach((memo) => {
    const label = document.createElement("label");
    label.className = "memo-export-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = memoExportIds.has(memo.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) memoExportIds.add(memo.id);
      else memoExportIds.delete(memo.id);
    });
    const content = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = memo.title;
    const meta = document.createElement("small");
    meta.textContent = `${memo.tag} · ${formatDateTime(memo.createdAt)}`;
    content.append(title, meta);
    if (memo.body) {
      const body = document.createElement("em");
      body.textContent = memo.body;
      content.append(body);
    }
    label.append(checkbox, content);
    els.memoExportList.append(label);
  });
}

function showMemoExportSheet() {
  const selectedTags = state.selectedMemoTag === "全部" ? state.memoTags : [state.selectedMemoTag];
  memoExportTags = new Set(selectedTags.filter((tag) => state.memoTags.includes(tag)));
  memoExportIds = new Set(getMemoExportCandidates().map((memo) => memo.id));
  renderMemoExportSheet();
  els.memoExportSheet.hidden = false;
}

function hideMemoExportSheet() {
  els.memoExportSheet.hidden = true;
}

function buildMemoExportText(memos) {
  const title = memoExportTags.size === 1 ? `${[...memoExportTags][0]}记录` : "自见备忘记录";
  const lines = [title, `导出时间：${formatDateTime(Date.now())}`, ""];
  let currentTag = "";
  memos.forEach((memo, index) => {
    if (memo.tag !== currentTag) {
      currentTag = memo.tag;
      lines.push(`【${currentTag}】`);
    }
    lines.push(`${index + 1}. ${memo.title}`);
    if (memo.body) lines.push(memo.body);
    lines.push(`记录于：${formatDateTime(memo.createdAt)}`, "");
  });
  return lines.join("\n");
}

function getCapacitorExportPlugins() {
  const plugins = window.Capacitor?.Plugins || window.Capacitor?.plugins || {};
  return {
    Filesystem: plugins.Filesystem || window.Filesystem,
    Share: plugins.Share || window.Share,
  };
}

function showDownloadLink(fileName, data, mimeType, successTitle = "导出完成") {
  const blob = new Blob([data], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.textContent = `打开或下载 ${fileName}`;
  link.className = "toast-download-link";
  link.addEventListener("click", () => {
    setTimeout(() => URL.revokeObjectURL(url), 45000);
  }, { once: true });
  els.reminderToastTitle.textContent = successTitle;
  els.reminderToastBody.textContent = "";
  els.reminderToastBody.append("文件已经生成：", link);
  els.reminderToast.hidden = false;
  els.reminderToast.classList.remove("is-visible");
  window.requestAnimationFrame(() => els.reminderToast.classList.add("is-visible"));
  return url;
}

async function exportNativeFile(fileName, data, mimeType, successTitle = "导出完成", options = {}) {
  if (options.requireMemos !== false && state.memos.length === 0) {
    showReminderToast("暂无可导出的备忘录", "先写下一条备忘，再导出文件。");
    return;
  }
  const { Filesystem, Share } = getCapacitorExportPlugins();
  if (!Filesystem || !Share) {
    console.warn("Capacitor export plugins are unavailable; falling back to browser download link.");
    showDownloadLink(fileName, data, mimeType, successTitle);
    return;
  }

  try {
    const result = await Filesystem.writeFile({
      path: `shared/${fileName}`,
      data,
      directory: "CACHE",
      encoding: "utf8",
      recursive: true,
    });
    await Share.share({
      title: fileName,
      text: "这是一份从自见导出的文件。",
      url: result.uri,
      dialogTitle: successTitle,
    });
    showReminderToast(successTitle, "系统分享面板已经打开，可以保存或发送这个文件。");
  } catch (error) {
    console.error("File export failed:", error);
    showDownloadLink(fileName, data, mimeType, successTitle);
  }
}

async function exportSelectedMemos() {
  const memos = getMemoExportCandidates().filter((memo) => memoExportIds.has(memo.id));
  if (memos.length === 0) {
    const message = state.memos.length === 0 ? "暂无可导出的备忘录" : "请至少勾选一条备忘再导出。";
    showReminderToast(state.memos.length === 0 ? "暂无可导出的备忘录" : "还没有选择内容", message);
    return;
  }
  const fileTitle = memoExportTags.size === 1 ? [...memoExportTags][0] : "自见备忘";
  const safeTitle = fileTitle.replace(/[\\/:*?"<>|]/g, "").slice(0, 24) || "自见备忘";
  await exportNativeFile(`${safeTitle}-${dateKey()}.txt`, buildMemoExportText(memos), "text/plain", "备忘已导出");
}

async function exportSelectedMemosJson() {
  const memos = getMemoExportCandidates().filter((memo) => memoExportIds.has(memo.id));
  if (memos.length === 0) {
    const message = state.memos.length === 0 ? "暂无可导出的备忘录" : "请至少勾选一条备忘再导出。";
    showReminderToast(state.memos.length === 0 ? "暂无可导出的备忘录" : "还没有选择内容", message);
    return;
  }
  const fileTitle = memoExportTags.size === 1 ? [...memoExportTags][0] : "自见备忘";
  const safeTitle = fileTitle.replace(/[\\/:*?"<>|]/g, "").slice(0, 24) || "自见备忘";
  await exportNativeFile(`${safeTitle}-${dateKey()}.json`, JSON.stringify(memos, null, 2), "application/json", "备忘 JSON 已导出");
}

function renderMemos() {
  els.memoTags.innerHTML = "";
  const tags = ["全部", ...state.memoTags];
  els.memoTag.innerHTML = "";
  state.memoTags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    els.memoTag.append(option);
  });

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memo-tag";
    button.classList.toggle("is-active", state.selectedMemoTag === tag);
    const count = tag === "全部" ? state.memos.length : state.memos.filter((memo) => memo.tag === tag).length;
    button.textContent = `${tag} ${count}`;
    button.addEventListener("click", () => {
      state.selectedMemoTag = tag;
      saveState();
      renderMemos();
    });
    els.memoTags.append(button);
  });

  const query = memoSearchQuery.trim().toLowerCase();
  const memos = state.memos
    .filter((memo) => state.selectedMemoTag === "全部" || memo.tag === state.selectedMemoTag)
    .filter((memo) => {
      if (!query) return true;
      return [memo.title, memo.tag, memo.body]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  els.memoList.innerHTML = "";
  if (memos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "timeline-empty";
    empty.textContent = query ? "没有搜到匹配的备忘。换个关键词试试。" : "这里还没有内容。点右上角 +，先记一部想看的电影，一本想读的书，或者一点灵感。";
    els.memoList.append(empty);
    return;
  }

  memos.forEach((memo) => {
    const item = document.createElement("article");
    item.className = `memo-item${memo.done ? " is-done" : ""}`;
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = memo.title;
    const meta = document.createElement("span");
    meta.textContent = `${memo.tag} · ${formatDateTime(memo.createdAt)}`;
    content.append(title, meta);
    if (memo.body) {
      const body = document.createElement("p");
      body.textContent = memo.body;
      content.append(body);
    }
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = memo.done;
    checkbox.setAttribute("aria-label", `完成 ${memo.title}`);
    checkbox.addEventListener("change", () => toggleMemo(memo.id));
    const actions = document.createElement("div");
    actions.className = "memo-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "memo-edit-button";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", () => startEditMemo(memo));
    actions.append(editButton, checkbox);
    item.append(content, actions);
    els.memoList.append(item);
  });
}

function renderHeatmap() {
  els.heatmap.innerHTML = "";
  els.heatmap.classList.toggle("has-image", Boolean(state.heatmapImage));
  if (state.heatmapImage) els.heatmap.style.setProperty("--heatmap-image", `url("${state.heatmapImage}")`);
  else els.heatmap.style.removeProperty("--heatmap-image");
  const paletteKeys = Object.keys(HEATMAP_PALETTES);
  const basePaletteIndex = Math.max(0, paletteKeys.indexOf(state.heatmapPalette));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 34);

  for (let index = 0; index < 35; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = dateKey(day);
    const minutes = state.focusByDate[key] || 0;
    const paletteSet = HEATMAP_PALETTES[paletteKeys[(basePaletteIndex + day.getMonth()) % paletteKeys.length]];
    const monthPalette = paletteSet[day.getMonth() % paletteSet.length];
    const level = getHeatLevel(minutes);
    const cell = document.createElement("div");
    cell.className = `day-cell level-${level}`;
    cell.style.background = monthPalette[level];
    cell.setAttribute("aria-label", `${key}: ${minutes} 分钟`);
    els.heatmap.append(cell);
  }

  els.todayMinutes.textContent = `${state.focusByDate[dateKey()] || 0} 分钟`;
  els.heatmapPalette.value = state.heatmapPalette;
  els.flameBalance.textContent = state.flames || 0;
  els.flameEarnedWeek.textContent = getWeekFlameTotal("earn");
  els.flameSpentWeek.textContent = getWeekFlameTotal("spend");
  renderHeatmapLegend();
  if (els.feedMemoToggle) els.feedMemoToggle.checked = state.feedSources?.memos !== false;
  if (els.feedTaskToggle) els.feedTaskToggle.checked = state.feedSources?.tasks !== false;
  if (els.feedQuoteToggle) els.feedQuoteToggle.checked = state.feedSources?.quotes !== false;
}

function renderStreak() {
  const streak = getStreak();
  els.streakDays.textContent = streak;
  els.streakPill.classList.toggle("is-hot", streak > 0);
  els.streakPill.classList.toggle("is-frozen", streak === 0 && hasFocusHistory());
  els.streakHint.textContent = streak > 0
    ? `火苗 ${state.flames || 0}，每 30 分钟 +1`
    : hasFocusHistory()
      ? `连续中断了，火苗 ${state.flames || 0}`
      : "完成一次专注后点亮火苗";
}

function renderHeatmapLegend() {
  const paletteSet = HEATMAP_PALETTES[state.heatmapPalette] || HEATMAP_PALETTES.forest;
  const palette = paletteSet[new Date().getMonth() % paletteSet.length];
  document.querySelectorAll(".heatmap-legend i").forEach((item, index) => {
    item.style.background = palette[index];
  });
}

function renderWidgetTaskDeck(deck, fallbackNode, tasks, emptyText, formatter, deckKey) {
  deck.textContent = "";
  if (tasks.length === 0) {
    widgetDeckIndexes[deckKey] = 0;
    const empty = document.createElement("small");
    empty.textContent = emptyText;
    deck.append(empty);
    if (fallbackNode) fallbackNode.textContent = emptyText;
    return;
  }

  widgetDeckIndexes[deckKey] = Math.min(widgetDeckIndexes[deckKey] || 0, tasks.length - 1);
  const activeIndex = widgetDeckIndexes[deckKey];
  const visibleTasks = tasks.slice(activeIndex, activeIndex + 3);
  visibleTasks.forEach((task, layer) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `widget-task-card is-layer-${layer}`;
    card.style.setProperty("--deck-layer", layer);
    card.disabled = layer !== 0;
    card.addEventListener("click", () => showEventDetail({ ...task, type: "task" }));
    const order = document.createElement("em");
    order.textContent = `${activeIndex + layer + 1}/${tasks.length}`;
    const title = document.createElement("strong");
    title.textContent = task.title;
    const meta = document.createElement("small");
    meta.textContent = formatter(task);
    card.append(title, order, meta);
    deck.append(card);
  });

  let startY = 0;
  const flipDeck = (direction) => {
    if (tasks.length <= 1) return;
    const nextIndex = Math.max(0, Math.min(tasks.length - 1, widgetDeckIndexes[deckKey] + direction));
    if (nextIndex === widgetDeckIndexes[deckKey]) return;
    widgetDeckIndexes[deckKey] = nextIndex;
    renderWidgets();
  };
  deck.ontouchstart = (event) => {
    startY = event.changedTouches[0]?.clientY || 0;
  };
  deck.ontouchend = (event) => {
    const endY = event.changedTouches[0]?.clientY || 0;
    const delta = startY - endY;
    if (Math.abs(delta) > 24) flipDeck(delta > 0 ? 1 : -1);
  };
  deck.onwheel = (event) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    flipDeck(event.deltaY > 0 ? 1 : -1);
  };

  if (fallbackNode) fallbackNode.textContent = formatter(tasks[activeIndex]);
}

function renderWidgets() {
  const todayMinutes = state.focusByDate[dateKey()] || 0;
  const weekMinutes = getWeekMinutes();
  const todayTasks = getTodayOpenTasks();
  const upcomingTasks = getUpcomingTasks();

  els.widgetTodayMinutes.textContent = todayMinutes;
  els.widgetWeekMinutes.textContent = weekMinutes;
  els.widgetTodayTasks.textContent = todayTasks.length;
  if (els.widgetUpcomingTasks) els.widgetUpcomingTasks.textContent = upcomingTasks.length;
  renderWidgetTaskDeck(
    els.widgetTodayTaskDeck,
    els.widgetNextTask,
    todayTasks,
    "现在没有待完成任务",
    (task) => `${formatClock(task.endAt)} 前完成`,
    "today"
  );
  if (els.widgetUpcomingTaskDeck) {
    renderWidgetTaskDeck(
      els.widgetUpcomingTaskDeck,
      els.widgetUpcomingText,
      upcomingTasks,
      "接下来没有任务",
      (task) => `${formatDateTime(task.endAt)} 截止`,
      "upcoming"
    );
  }
  renderWeekChart();
  renderSkins();
}

function renderSkins() {
  els.skinFlameText.textContent = `火苗 ${state.flames || 0}`;
  els.skinGrid.textContent = "";
  SKINS.forEach((skin) => {
    const owned = state.ownedSkins.includes(skin.id);
    const active = state.selectedSkin === skin.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skin-option";
    button.style.setProperty("--skin-chick", skin.chick);
    button.style.setProperty("--skin-wing", skin.wing);
    button.classList.toggle("is-active", active);
    button.classList.toggle("is-preview", previewSkinId === skin.id);
    const swatch = document.createElement("span");
    const name = document.createElement("strong");
    const price = document.createElement("small");
    name.textContent = skin.name;
    price.textContent = owned ? active ? "使用中" : "切换" : `${skin.cost} 火苗`;
    button.append(swatch, name, price);

    button.addEventListener("pointerdown", () => {
      skinLongPressTriggered = false;
      window.clearTimeout(skinLongPressTimer);
      previewSkin(skin.id);
      skinLongPressTimer = window.setTimeout(() => {
        skinLongPressTriggered = true;
        showSkinPreview(skin);
      }, 480);
    });
    const endPreviewPress = () => {
      window.clearTimeout(skinLongPressTimer);
      stopPreviewSkin(skinLongPressTriggered ? 120 : 900);
    };
    button.addEventListener("pointerup", endPreviewPress);
    button.addEventListener("pointerleave", endPreviewPress);
    button.addEventListener("pointercancel", endPreviewPress);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      if (skinLongPressTriggered) {
        event.preventDefault();
        skinLongPressTriggered = false;
        return;
      }
      cancelSkinPreview();
      if (owned) {
        state.selectedSkin = skin.id;
        saveState();
        applySkin();
        renderSkins();
        return;
      }
      if ((state.flames || 0) < skin.cost) {
        showReminderToast("火苗不够", `${skin.name} 需要 ${skin.cost} 个火苗。`);
        return;
      }
      addFlameLedger("spend", skin.cost, `兑换${skin.name}`);
      state.ownedSkins.push(skin.id);
      state.selectedSkin = skin.id;
      saveState();
      applySkin();
      render();
      showReminderToast("兑换成功", `${skin.name} 小鸡已经换上。`);
    });
    els.skinGrid.append(button);
  });
}

function renderFlowerSkins() {
  if (!els.flowerGrid) return;
  els.flowerFlameText.textContent = `火苗 ${state.flames || 0}`;
  els.flowerGrid.textContent = "";
  FLOWER_SKINS.forEach((flower) => {
    const owned = state.ownedFlowers.includes(flower.id);
    const active = state.selectedFlower === flower.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flower-option skin-option";
    button.style.setProperty("--flower-core-preview", flower.core);
    button.style.setProperty("--flower-petal-preview", flower.petal);
    button.classList.toggle("is-active", active);
    const swatch = document.createElement("span");
    const name = document.createElement("strong");
    const price = document.createElement("small");
    name.textContent = flower.name;
    price.textContent = owned ? active ? "使用中" : "切换" : `${flower.cost} 火苗`;
    button.append(swatch, name, price);
    button.addEventListener("click", () => {
      if (owned) {
        state.selectedFlower = flower.id;
        saveState();
        applyFlower();
        renderFlowerSkins();
        return;
      }
      if ((state.flames || 0) < flower.cost) {
        showReminderToast("火苗不够", `${flower.name} 需要 ${flower.cost} 个火苗。`);
        return;
      }
      addFlameLedger("spend", flower.cost, `兑换${flower.name}`);
      state.ownedFlowers.push(flower.id);
      state.selectedFlower = flower.id;
      saveState();
      applyFlower();
      render();
      showReminderToast("兑换成功", `${flower.name} 小花已经种上。`);
    });
    els.flowerGrid.append(button);
  });
}

function applySkin() {
  const skin = getSkin(previewSkinId || state.selectedSkin);
  document.body.dataset.skin = skin.scene;
  document.documentElement.style.setProperty("--chick", skin.chick);
  document.documentElement.style.setProperty("--chick-wing", skin.wing);
}

function applyFlower() {
  const flower = getFlower(state.selectedFlower);
  document.documentElement.style.setProperty("--flower-core", flower.core);
  document.documentElement.style.setProperty("--flower-petal", flower.petal);
}

function applyTheme() {
  const theme = getTheme(previewThemeId || state.selectedTheme);
  const isMoon = theme.id === "moon";
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface", theme.panel);
  root.style.setProperty("--ink", theme.ink);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--on-primary", isMoon ? "#121513" : "#ffffff");
  root.style.setProperty("--primary-dark", isMoon ? "#f7f7f2" : "#000000");
  root.style.setProperty("--muted", isMoon ? "#b9c8bc" : "#666666");
  root.style.setProperty("--soft", theme.soft);
  root.style.setProperty("--line", isMoon ? "#4a554c" : "#dddddd");
  document.body.dataset.theme = theme.id;
}

function previewSkin(id) {
  window.clearTimeout(skinPreviewTimer);
  previewSkinId = id;
  document.body.classList.add("is-previewing-skin");
  applySkin();
}

function stopPreviewSkin(delay = 900) {
  window.clearTimeout(skinPreviewTimer);
  skinPreviewTimer = window.setTimeout(() => {
    previewSkinId = null;
    document.body.classList.remove("is-previewing-skin");
    applySkin();
  }, delay);
}

function cancelSkinPreview() {
  window.clearTimeout(skinPreviewTimer);
  previewSkinId = null;
  document.body.classList.remove("is-previewing-skin");
  applySkin();
}

function showSkinPreview(skin) {
  if (!els.skinPreviewSheet) return;
  els.skinPreviewTitle.textContent = `${skin.name}小鸡`;
  els.skinPreviewMeta.textContent = skin.cost === 0 ? "默认皮肤，可以直接使用。" : `${skin.cost} 火苗兑换，长按只预览不消耗。`;
  els.skinPreviewScene.style.setProperty("--preview-chick", skin.chick);
  els.skinPreviewScene.style.setProperty("--preview-wing", skin.wing);
  els.skinPreviewScene.dataset.scene = skin.scene;
  els.skinPreviewSheet.hidden = false;
}

function hideSkinPreview() {
  if (!els.skinPreviewSheet) return;
  els.skinPreviewSheet.hidden = true;
  skinLongPressTriggered = false;
  cancelSkinPreview();
}

function previewTheme(id) {
  window.clearTimeout(themePreviewTimer);
  previewThemeId = id;
  document.body.classList.add("is-previewing-theme");
  applyTheme();
}

function stopPreviewTheme(delay = 1100) {
  window.clearTimeout(themePreviewTimer);
  themePreviewTimer = window.setTimeout(() => {
    previewThemeId = null;
    document.body.classList.remove("is-previewing-theme");
    applyTheme();
  }, delay);
}

function cancelThemePreview() {
  window.clearTimeout(themePreviewTimer);
  previewThemeId = null;
  document.body.classList.remove("is-previewing-theme");
  applyTheme();
}

function renderThemes() {
  els.themeFlameText.textContent = `火苗 ${state.flames || 0}`;
  els.themeGrid.textContent = "";
  THEMES.forEach((theme) => {
    const owned = state.ownedThemes.includes(theme.id);
    const active = state.selectedTheme === theme.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-option";
    button.classList.toggle("is-active", active);
    button.classList.toggle("is-preview", previewThemeId === theme.id);
    button.style.setProperty("--theme-bg", theme.bg);
    button.style.setProperty("--theme-ink", theme.ink);
    button.style.setProperty("--theme-primary", theme.primary);
    const swatch = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = theme.name;
    const cost = document.createElement("small");
    cost.textContent = owned ? active ? "使用中" : "切换" : `${theme.cost} 火苗`;
    button.append(swatch, name, cost);
    button.addEventListener("pointerdown", () => previewTheme(theme.id));
    button.addEventListener("pointerup", stopPreviewTheme);
    button.addEventListener("pointerleave", stopPreviewTheme);
    button.addEventListener("pointercancel", stopPreviewTheme);
    button.addEventListener("click", () => {
      cancelThemePreview();
      if (owned) {
        state.selectedTheme = theme.id;
        saveState();
        applyTheme();
        renderThemes();
        return;
      }
      if ((state.flames || 0) < theme.cost) {
        showReminderToast("火苗不够", `${theme.name} 需要 ${theme.cost} 个火苗。`);
        return;
      }
      addFlameLedger("spend", theme.cost, `兑换${theme.name}`);
      state.ownedThemes.push(theme.id);
      state.selectedTheme = theme.id;
      saveState();
      applyTheme();
      render();
      showReminderToast("主题已兑换", `${theme.name} 已经换上。`);
    });
    els.themeGrid.append(button);
  });
}

function formatFeedItem(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 88)}…` : clean;
}

function renderFocusFeed() {
  const items = [];
  if (state.feedSources?.memos) {
    state.memos
      .filter((memo) => memo.body || memo.title)
      .slice(0, 8)
      .forEach((memo) => items.push(memo.body || memo.title));
  }
  if (state.feedSources?.tasks) {
    getTodayOpenTasks().slice(0, 8).forEach((task) => items.push(`待办：${task.title}`));
  }
  if (state.feedSources?.quotes) {
    state.quotes.slice(0, 24).forEach((quote) => items.push(quote));
  }
  if (items.length === 0) {
    els.focusFeed.textContent = "写下的感想和待办，会在这里慢慢轮播。";
    return;
  }
  feedIndex %= items.length;
  els.focusFeed.textContent = formatFeedItem(items[feedIndex]);
}

function nextFocusFeed() {
  feedIndex += 1;
  renderFocusFeed();
}

async function exportBackup() {
  const backup = {
    app: "zijian",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
  const json = JSON.stringify(backup, null, 2);
  await exportNativeFile(`zijian-backup-${dateKey()}.json`, json, "application/json", "备份已导出", { requireMemos: false });
}

async function importBackupFile(file) {
  if (!file) return;
  await importBackupContent(await file.text());
}

async function importBackupContent(content) {
  try {
    const backup = JSON.parse(content);
    const nextState = backup.state || backup;
    state = restoreTimerState({ ...defaultState, ...nextState });
    normalizeState();
    saveState();
    applySkin();
    applyFlower();
    applyTheme();
    render();
    showReminderToast("备份已导入", "本地数据已经恢复。");
  } catch {
    showReminderToast("导入失败", "这个备份文件没有读成功。");
  }
}

async function chooseAndImportBackup() {
  const bridge = getSystemBridge();
  if (!bridge) {
    els.backupImportInput.click();
    return;
  }
  try {
    const result = await bridge.pickBackup();
    if (result?.content) await importBackupContent(result.content);
  } catch (error) {
    if (!String(error?.message || error).includes("No backup file selected")) {
      console.error("Native backup import failed:", error);
      showReminderToast("导入失败", "没有读到所选的备份文件，请重新选择。");
    }
  }
}

async function importHeatmapImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showReminderToast("图片格式不对", "请选择一张图片。");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.heatmapImage = String(reader.result || "");
    saveState();
    renderHeatmap();
    showReminderToast("热力图图片已导入", "格子会用这张图做混合底纹。");
  });
  reader.readAsDataURL(file);
}

function resetHeatmapImage() {
  state.heatmapImage = "";
  saveState();
  renderHeatmap();
  showReminderToast("热力图图片已重置", "已经恢复到没有导入图片的样子。");
}

function readUInt16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function inflateRawZipEntry(bytes) {
  if (!("DecompressionStream" in window)) {
    throw new Error("This WebView does not support docx decompression.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeXmlEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractDocxTextFromXml(xmlText) {
  const paragraphs = xmlText.match(/<w:p[\s\S]*?<\/w:p>/g) || [xmlText];
  return paragraphs
    .map((paragraph) => {
      const runs = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
      return runs.map((match) => decodeXmlEntities(match[1])).join("");
    })
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

async function readDocxText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let eocdOffset = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32LE(bytes, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Cannot find docx directory.");
  const entryCount = readUInt16LE(bytes, eocdOffset + 10);
  let centralOffset = readUInt32LE(bytes, eocdOffset + 16);
  const decoder = new TextDecoder("utf-8");

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32LE(bytes, centralOffset) !== 0x02014b50) break;
    const method = readUInt16LE(bytes, centralOffset + 10);
    const compressedSize = readUInt32LE(bytes, centralOffset + 20);
    const fileNameLength = readUInt16LE(bytes, centralOffset + 28);
    const extraLength = readUInt16LE(bytes, centralOffset + 30);
    const commentLength = readUInt16LE(bytes, centralOffset + 32);
    const localOffset = readUInt32LE(bytes, centralOffset + 42);
    const fileName = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + fileNameLength));

    if (fileName === "word/document.xml") {
      const localNameLength = readUInt16LE(bytes, localOffset + 26);
      const localExtraLength = readUInt16LE(bytes, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const xmlBytes = method === 0 ? compressed : method === 8 ? await inflateRawZipEntry(compressed) : null;
      if (!xmlBytes) throw new Error("Unsupported docx compression.");
      return extractDocxTextFromXml(decoder.decode(xmlBytes));
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error("Cannot find word/document.xml.");
}

function getDecodedTextScore(text) {
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const mojibakeCount = (text.match(/锟|�|Ã|Â/g) || []).length;
  const controlCount = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  return replacementCount * 8 + mojibakeCount * 5 + controlCount * 3;
}

function decodeImportedText(buffer) {
  const candidates = ["utf-8", "gb18030", "gbk", "big5"]
    .map((encoding) => {
      try {
        const text = new TextDecoder(encoding, { fatal: false }).decode(buffer);
        return { text, score: getDecodedTextScore(text) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0]?.text || "";
}

function normalizeImportedQuotes(text) {
  return text
    .replace(/\u0000/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) => line.length > 120 ? `${line.slice(0, 118)}…` : line)
    .slice(0, 200);
}

async function importQuoteFile(file) {
  if (!file) return;
  try {
    const isDocx = file.name.toLowerCase().endsWith(".docx") || file.type.includes("wordprocessingml");
    const text = isDocx ? await readDocxText(file) : decodeImportedText(await file.arrayBuffer());
    const quotes = normalizeImportedQuotes(text);
    if (quotes.length === 0) {
      showReminderToast("没有读到语录", "文本里每一行可以是一条语录。");
      return;
    }
    state.quotes = quotes;
    state.feedSources.quotes = true;
    saveState();
    renderHeatmap();
    renderFocusFeed();
    showReminderToast("语录已导入", `已经收下 ${quotes.length} 条。`);
  } catch {
    showReminderToast("导入失败", "这个文本文件没有读成功。");
  }
}

function renderWeekChart() {
  const start = getWeekStart(new Date(`${selectedStatsWeekDate}T00:00:00`));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  const values = days.map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return state.focusByDate[dateKey(day)] || 0;
  });
  const total = values.reduce((sum, minutes) => sum + minutes, 0);
  const max = Math.max(30, ...values);

  els.weekChartTotal.textContent = `${total === 0 ? "0分钟" : formatDuration(0, total * 60000)} · ${formatMonthDay(start)}-${formatMonthDay(end)}`;
  els.weekChart.innerHTML = "";
  values.forEach((minutes, index) => {
    const item = document.createElement("div");
    item.className = "week-bar-item";
    const bar = document.createElement("span");
    bar.className = "week-bar";
    bar.style.height = `${Math.max(8, minutes / max * 100)}%`;
    bar.dataset.minutes = `${minutes} 分钟`;
    const label = document.createElement("small");
    label.textContent = days[index];
    item.append(bar, label);
    els.weekChart.append(item);
  });
}

function renderTaskColorPicker() {
  els.taskColorPicker.innerHTML = "";
  for (const color of TASK_COLORS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-color-swatch";
    button.title = color.name;
    button.setAttribute("aria-label", color.name);
    button.style.background = color.bg;
    button.style.borderColor = color.border;
    button.classList.toggle("is-active", state.selectedTaskColor === color.id);
    button.addEventListener("click", () => {
      state.selectedTaskColor = color.id;
      saveState();
      renderTaskColorPicker();
    });
    els.taskColorPicker.append(button);
  }
}

function renderReminderFields() {
  const isAbsolute = els.taskReminderMode.value === "absolute";
  els.relativeReminderField.hidden = isAbsolute;
  els.absoluteReminderField.hidden = !isAbsolute;
  els.taskReminder.disabled = isAbsolute;
  els.taskReminderAt.disabled = !isAbsolute;
  if (isAbsolute && !els.taskReminderAt.value) syncReminderAtFromRelative();
}

function syncReminderAtFromRelative() {
  const endAt = fromInputValue(els.taskEnd.value);
  const reminder = Number(els.taskReminder.value || 15);
  if (!Number.isFinite(endAt) || !Number.isFinite(reminder)) return;
  els.taskReminderAt.value = toInputValue(new Date(endAt - reminder * MINUTE * 1000));
}

function money(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function openFinanceEditor(transaction = null, detected = null) {
  editingTransactionId = transaction?.id || null;
  financeEntryType = transaction?.type || (detected?.note && isSavingTransfer(detected.note) ? "saving" : detected?.type) || "expense";
  pendingPaymentActive = Boolean(detected);
  els.financeEditorTitle.textContent = transaction ? "修改记录" : detected ? "确认付款记录" : "记一笔";
  els.financeAmount.value = transaction?.amount || detected?.amount || "";
  els.financeCategory.value = financeEntryType === "saving" ? "存钱" : transaction?.category || detected?.category || (detected?.note ? guessFinanceCategory(detected.note) : "餐饮");
  els.financeNote.value = transaction?.note || detected?.note || "";
  els.financeDate.value = toInputValue(new Date(transaction?.at || detected?.at || Date.now()));
  els.financeDeleteButton.hidden = !transaction;
  els.financeTypeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.financeType === financeEntryType));
  els.financeEditorSheet.hidden = false;
  requestAnimationFrame(() => els.financeAmount.focus());
}

function closeFinanceEditor() {
  els.financeEditorSheet.hidden = true;
  editingTransactionId = null;
  pendingPaymentActive = false;
}

async function refreshPaymentAccess() {
  const bridge = getSystemBridge();
  if (!bridge?.hasPaymentNotificationAccess) return;
  try {
    const access = await bridge.hasPaymentNotificationAccess();
    els.paymentAccessButton.textContent = access.granted ? "管理授权" : "开启识别";
    els.paymentAccessStatus.textContent = access.granted ? "通知读取已授权" : "尚未授权";
    if (access.granted) await consumePendingPayment();
  } catch (error) { console.error("Payment access check failed:", error); }
}

async function requestPaymentAccess() {
  const bridge = getSystemBridge();
  if (!bridge?.openPaymentNotificationAccess) {
    showReminderToast("仅支持 Android", "付款通知识别需要安装最新 APK。手动记账仍可正常使用。");
    return;
  }
  await bridge.openPaymentNotificationAccess();
}

async function testPaymentDetection() {
  const bridge = getSystemBridge();
  if (!bridge?.testPaymentDetection) {
    showReminderToast("请安装最新 APK", "浏览器预览无法模拟 Android 付款横幅。");
    return;
  }
  try {
    await bridge.testPaymentDetection();
    showReminderToast("模拟付款已发出", "请切到其他应用观察横幅，或点击通知进入编辑。");
  } catch (error) {
    console.error("Payment detection test failed:", error);
    showReminderToast("测试失败", "请先允许自见发送通知，再重新测试。");
  }
}

async function consumePendingPayment() {
  const bridge = getSystemBridge();
  if (!bridge?.getPendingPayment || !els.financeEditorSheet.hidden) return;
  const result = await bridge.getPendingPayment();
  if (!result?.payment) return;
  setActiveView("finance");
  openFinanceEditor(null, result.payment);
  await bridge.clearPendingPayment();
}

function decodeBillBuffer(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    try { return new TextDecoder("gb18030").decode(buffer); }
    catch { return new TextDecoder("utf-8").decode(buffer); }
  }
}

function excelColumnIndex(reference) {
  const letters = String(reference || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "";
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function excelSerialToText(value) {
  const timestamp = (Number(value) - 25569) * 86400000;
  if (!Number.isFinite(timestamp)) return String(value ?? "");
  const date = new Date(timestamp);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function xlsxDateStyleIndexes(stylesDocument) {
  if (!stylesDocument) return new Set();
  const builtInDateFormats = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
  const customDateFormats = new Set();
  [...stylesDocument.getElementsByTagNameNS("*", "numFmt")].forEach((format) => {
    const id = Number(format.getAttribute("numFmtId"));
    const code = String(format.getAttribute("formatCode") || "").replace(/\[[^\]]*]/g, "").replace(/"[^"]*"/g, "");
    if (/[ymdhis]/i.test(code)) customDateFormats.add(id);
  });
  const indexes = new Set();
  const cellXfs = stylesDocument.getElementsByTagNameNS("*", "cellXfs")[0];
  [...(cellXfs?.children || [])].filter((node) => node.localName === "xf").forEach((format, index) => {
    const id = Number(format.getAttribute("numFmtId"));
    if (builtInDateFormats.has(id) || customDateFormats.has(id)) indexes.add(index);
  });
  return indexes;
}

function parseXlsxBill(buffer) {
  if (!globalThis.fflate?.unzipSync) throw new Error("XLSX 解析组件没有加载");
  if (buffer.byteLength > 20 * 1024 * 1024) throw new Error("账单文件不能超过 20 MB");
  const archive = globalThis.fflate.unzipSync(new Uint8Array(buffer));
  const worksheetPath = Object.keys(archive).filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(path)).sort()[0];
  if (!worksheetPath) throw new Error("工作簿中没有找到工作表");
  const decode = (path) => archive[path] ? new TextDecoder("utf-8").decode(archive[path]) : "";
  const parseXml = (xml, label) => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.getElementsByTagName("parsererror").length) throw new Error(`${label}内容损坏`);
    return document;
  };
  const sharedDocument = archive["xl/sharedStrings.xml"] ? parseXml(decode("xl/sharedStrings.xml"), "共享文本") : null;
  const sharedStrings = sharedDocument ? [...sharedDocument.getElementsByTagNameNS("*", "si")].map((item) => item.textContent || "") : [];
  const stylesDocument = archive["xl/styles.xml"] ? parseXml(decode("xl/styles.xml"), "样式表") : null;
  const dateStyles = xlsxDateStyleIndexes(stylesDocument);
  const sheet = parseXml(decode(worksheetPath), "工作表");
  const rows = [];
  const rowNodes = [...sheet.getElementsByTagNameNS("*", "row")];
  if (rowNodes.length > 100000) throw new Error("账单超过 10 万行，请拆分后导入");
  rowNodes.forEach((rowNode) => {
    const row = [];
    [...rowNode.children].filter((node) => node.localName === "c").forEach((cell) => {
      const column = excelColumnIndex(cell.getAttribute("r"));
      if (column < 0 || column >= 100) return;
      const type = cell.getAttribute("t") || "n";
      const raw = [...cell.children].find((node) => node.localName === "v")?.textContent ?? "";
      let value = raw;
      if (type === "s") value = sharedStrings[Number(raw)] ?? "";
      else if (type === "inlineStr") value = [...cell.children].find((node) => node.localName === "is")?.textContent || "";
      else if (type === "b") value = raw === "1" ? "是" : "否";
      else if (dateStyles.has(Number(cell.getAttribute("s"))) && raw !== "") value = excelSerialToText(raw);
      row[column] = value;
    });
    if (row.some((value) => String(value ?? "").trim())) rows.push(row.map((value) => value ?? ""));
  });
  return rows;
}

function parseDelimitedBill(text) {
  const clean = String(text || "").replace(/^\uFEFF/, "");
  const sample = clean.split(/\r?\n/).slice(0, 20).join("\n");
  const delimiter = (sample.match(/\t/g) || []).length > (sample.match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (char === '"') {
      if (quoted && clean[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && clean[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
}

function cleanBillCell(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").replace(/^`+/, "").trim();
}

function normalizeBillHeader(value) {
  return cleanBillCell(value).replace(/[\s（）()【】\[\]：:、/]/g, "").toLowerCase();
}

function billColumn(headers, patterns, excluded = []) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)) && !excluded.some((pattern) => pattern.test(header)));
}

function parseBillTime(value) {
  const clean = cleanBillCell(value);
  const match = clean.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:\s+(\d{1,2}):?(\d{2})?(?::?(\d{2}))?)?/);
  if (!match) return NaN;
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)).getTime();
}

function parseBillAmount(value) {
  const clean = cleanBillCell(value).replace(/[¥￥,，\s]/g, "");
  const match = clean.match(/-?\d+(?:\.\d+)?/);
  return match ? Math.abs(Number(match[0])) : NaN;
}

function guessFinanceCategory(text) {
  const value = String(text || "").replace(/\s+/g, "");
  const merchantRules = [
    ["餐饮", /美团|大众点评|饿了么|肯德基|麦当劳|星巴克|瑞幸|蜜雪冰城|多点新鲜|餐厅|饭店|食堂|外卖|咖啡|奶茶|餐饮|桃酥|烘焙|甜品|蛋糕|面包|生鲜/],
    ["购物", /京东|淘宝|天猫|拼多多|唯品会|苏宁易购|得物|商场|商城|服饰|百货|购物/],
    ["交通", /滴滴|高德打车|曹操出行|哈啰|地铁|公交|铁路|火车|机票|航空|加油|停车|交通/],
    ["游戏", /深圳市腾讯计算机系统有限公司|杭州网易雷火科技有限公司|米哈游|叠纸|莉莉丝|鹰角|网易游戏|腾讯游戏|完美世界|心动网络|游族|巨人网络|三七互娱|盛趣游戏|祖龙娱乐|库洛游戏|灵犀互娱|4399|Steam|TapTap/],
  ];
  const merchantMatch = merchantRules.find(([, pattern]) => pattern.test(value));
  if (merchantMatch) return merchantMatch[0];
  if (/(科技|网络|信息技术|文化传播|数字娱乐).*(游戏|手游|充值|点券|钻石|魂玉|长鸣珠|月卡|战令|通行证)|(游戏|手游|充值|点券|钻石|魂玉|长鸣珠|月卡|战令|通行证).*(科技|网络|信息技术|文化传播|数字娱乐)/.test(value)) return "游戏";
  if (/阴阳师|魂玉|燕云十六声|长鸣珠|笺叶裁香|游戏|手游|主机|电竞|点券|钻石|月卡|战令|通行证/.test(value)) return "游戏";
  if (/餐|饭|食品|超市|便利店|水果/.test(value)) return "餐饮";
  if (/电影|影院|视频|音乐|演出|娱乐|会员|票务/.test(value)) return "娱乐";
  if (/医院|诊所|药|医疗|体检/.test(value)) return "医疗";
  if (/书|课程|学费|教育|考试|打印|文具|学习/.test(value)) return "学习";
  if (/房租|物业|水费|电费|燃气|宽带|家居|居住/.test(value)) return "居住";
  if (/红包|礼金|转账|人情/.test(value)) return "人情";
  return "其他";
}

function isSavingTransfer(text, direction = "") {
  const value = `${text || ""} ${direction || ""}`.replace(/\s+/g, "");
  return /招商银行|招行|ChinaMerchantsBank|CMB/i.test(value)
    && !/商户消费|快捷支付|信用卡|还款|购买商品/.test(value);
}

function selectFinanceCategory(category) {
  selectedFinanceCategory = category || null;
  renderFinance();
}

function selectFinanceRingSegment(event) {
  if (!financeRingSegments.length) return;
  const rect = els.financeRing.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const radius = Math.hypot(x, y);
  if (radius < rect.width * .33 || radius > rect.width * .52) return;
  const percent = ((Math.atan2(x, -y) * 180 / Math.PI + 360) % 360) / 3.6;
  const segment = financeRingSegments.find((item) => percent >= item.start && percent < item.end);
  if (segment) selectFinanceCategory(segment.category);
}

function billSignature(transaction) {
  const minute = Math.floor(Number(transaction.at || 0) / 60000);
  return `${minute}|${transaction.type}|${Number(transaction.amount || 0).toFixed(2)}|${String(transaction.note || "").trim()}`;
}

function billRowsToTransactions(rows, fileName = "") {
  const headerIndex = rows.findIndex((candidate) => {
    const headers = candidate.map(normalizeBillHeader);
    return headers.some((header) => /交易时间|交易创建时间|付款时间|^时间$/.test(header))
      && headers.some((header) => /金额|订单金额|实收金额/.test(header));
  });
  if (headerIndex < 0) throw new Error("没有找到交易时间和金额表头");
  const headers = rows[headerIndex].map(normalizeBillHeader);
  const timeIndex = billColumn(headers, [/^交易时间$/, /^交易创建时间$/, /^付款时间$/, /^时间$/]);
  const amountIndex = billColumn(headers, [/^金额元?$/, /订单金额/, /实收金额/, /^金额$/], [/退款/, /手续费/, /优惠/]);
  const directionIndex = billColumn(headers, [/^收支$/, /^收支类型$/, /^资金方向$/, /^类型$/]);
  const counterpartyIndex = billColumn(headers, [/交易对方/, /商户名称/, /^对方$/]);
  const productIndex = billColumn(headers, [/商品名称/, /^商品$/, /交易内容/, /^用途$/]);
  const noteIndex = billColumn(headers, [/^备注$/, /备注信息/]);
  const statusIndex = billColumn(headers, [/当前状态/, /交易状态/, /^状态$/]);
  const idIndex = billColumn(headers, [/交易单号/, /^交易号$/, /订单号/]);
  const platform = /支付宝|alipay/i.test(`${fileName}\n${rows.slice(0, headerIndex).flat().join(" ")}`) ? "支付宝" : "微信";
  const imported = [];
  let skipped = 0;
  rows.slice(headerIndex + 1).forEach((cells) => {
    const at = parseBillTime(cells[timeIndex]);
    const amount = parseBillAmount(cells[amountIndex]);
    const direction = cleanBillCell(cells[directionIndex]);
    const status = cleanBillCell(cells[statusIndex]);
    if (!Number.isFinite(at) || !Number.isFinite(amount) || amount <= 0 || /失败|关闭|已撤销/.test(status)) { skipped += 1; return; }
    const counterparty = cleanBillCell(cells[counterpartyIndex]);
    const product = cleanBillCell(cells[productIndex]);
    const memo = cleanBillCell(cells[noteIndex]);
    const noteParts = [counterparty, product, memo].filter((value, index, values) => value && values.indexOf(value) === index);
    const note = noteParts.join(" · ") || `${platform}账单`;
    let type = /收入|收款|退款/.test(direction) ? "income" : /支出|付款/.test(direction) ? "expense" : null;
    if (isSavingTransfer(note, direction)) type = "saving";
    if (!type && /不计收支|中性|转账/.test(direction)) { skipped += 1; return; }
    if (!type) type = "expense";
    const externalId = cleanBillCell(cells[idIndex]);
    const transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      category: type === "income" ? "收入" : type === "saving" ? "存钱" : guessFinanceCategory(note),
      note,
      at,
      source: `${platform}-import`,
      externalId,
      importedAt: Date.now(),
      createdAt: Date.now(),
    };
    transaction.importKey = externalId ? `${platform}:${externalId}` : billSignature(transaction);
    imported.push(transaction);
  });
  return { imported, skipped, platform };
}

async function importFinanceBill(file) {
  if (!file) return;
  try {
    const buffer = await file.arrayBuffer();
    const isXlsx = /\.xlsx$/i.test(file.name) || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const rows = isXlsx ? parseXlsxBill(buffer) : parseDelimitedBill(decodeBillBuffer(buffer));
    const result = billRowsToTransactions(rows, file.name);
    const existingKeys = new Set();
    state.transactions.forEach((item) => {
      if (item.importKey) existingKeys.add(item.importKey);
      existingKeys.add(billSignature(item));
    });
    const fresh = result.imported.filter((item) => {
      const duplicate = existingKeys.has(item.importKey) || existingKeys.has(billSignature(item));
      existingKeys.add(item.importKey);
      existingKeys.add(billSignature(item));
      return !duplicate;
    });
    const duplicateCount = result.imported.length - fresh.length;
    if (!fresh.length) {
      showReminderToast("没有新增流水", duplicateCount ? `识别到的 ${duplicateCount} 笔都已经导入过。` : "没有识别到可导入的收入或支出。");
      return;
    }
    const confirmed = confirm(`识别到 ${fresh.length} 笔${result.platform}流水${duplicateCount ? `，另有 ${duplicateCount} 笔重复` : ""}。确认导入吗？`);
    if (!confirmed) return;
    state.transactions = [...state.transactions, ...fresh];
    saveState();
    renderFinance();
    showReminderToast("账单导入完成", `新增 ${fresh.length} 笔，已自动分类并纳入统计。`);
  } catch (error) {
    console.error("Bill import failed:", error);
    showReminderToast("账单没有读成功", `${error.message || "请确认文件格式"}。支持微信或支付宝导出的 XLSX、CSV 和 TXT 账单。`);
  }
}

function renderFinance() {
  if (!els.financeList) return;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const weekStartDate = new Date(now);
  weekStartDate.setHours(0, 0, 0, 0);
  weekStartDate.setDate(weekStartDate.getDate() - ((weekStartDate.getDay() + 6) % 7));
  const weekStart = weekStartDate.getTime();
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const monthly = state.transactions.filter((item) => item.at >= monthStart && item.at < monthEnd);
  const expenses = monthly.filter((item) => item.type === "expense");
  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const incomeTotal = monthly.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savingTotal = monthly.filter((item) => item.type === "saving").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const modeMeta = {
    expense: { label: "支出", month: "花费", next: "收入", breakdown: "花到哪里了", empty: "还没有本月支出" },
    income: { label: "收入", month: "收入", next: "存钱", breakdown: "收入来自哪里", empty: "还没有本月收入" },
    saving: { label: "存钱", month: "存钱", next: "支出", breakdown: "这个月存下了", empty: "还没有本月存钱记录" },
  }[financeSummaryMode];
  const activeItems = monthly.filter((item) => item.type === financeSummaryMode);
  const activeTotal = activeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const weeklyTotal = state.transactions.filter((item) => item.type === financeSummaryMode && item.at >= weekStart && item.at < weekEnd).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const yearlyTotal = state.transactions.filter((item) => item.type === financeSummaryMode && item.at >= yearStart && item.at < yearEnd).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const budget = state.monthlyBudget;
  const byCategory = new Map();
  activeItems.forEach((item) => byCategory.set(item.category, (byCategory.get(item.category) || 0) + Number(item.amount || 0)));
  const ranked = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  els.financeMonthLabel.textContent = `${now.getMonth() + 1}月${modeMeta.month}`;
  els.financeTotalCard.dataset.mode = financeSummaryMode;
  els.financeTotalLabel.textContent = `本月${modeMeta.label}`;
  els.financeExpenseTotal.textContent = money(activeTotal);
  els.financeIncomeTotal.textContent = `点击查看本月${modeMeta.next} · 支出 ${money(total)} / 收入 ${money(incomeTotal)} / 存钱 ${money(savingTotal)}`;
  els.financeDailyLabel.textContent = `本月日均${modeMeta.label}`;
  els.financeDailyAverage.textContent = money(activeTotal / Math.max(1, now.getDate()));
  els.financeWeeklyLabel.textContent = `本周${modeMeta.label}`;
  els.financeWeeklyTotal.textContent = money(weeklyTotal);
  els.financeWeekRange.textContent = `${weekStartDate.getMonth() + 1}.${weekStartDate.getDate()}－${new Date(weekEnd - 1).getMonth() + 1}.${new Date(weekEnd - 1).getDate()}`;
  els.financeYearlyLabel.textContent = `本年${modeMeta.label}`;
  els.financeYearlyTotal.textContent = money(yearlyTotal);
  els.financeYearLabel.textContent = `${now.getFullYear()}年`;
  els.financeBudgetLeft.textContent = budget ? `剩余 ${money(Math.max(0, budget - total))}` : "未设置";
  els.financeBudgetBar.style.width = budget ? `${Math.min(100, total / budget * 100)}%` : "0%";
  els.financeBudgetBar.style.background = budget && total > budget ? "#c35f55" : "var(--primary)";
  if (selectedFinanceCategory && !byCategory.has(selectedFinanceCategory)) selectedFinanceCategory = null;
  const selectedCategoryTotal = selectedFinanceCategory ? byCategory.get(selectedFinanceCategory) || 0 : activeTotal;
  els.financeRingTotal.textContent = money(selectedCategoryTotal).replace(".00", "");
  els.financeRingLabel.textContent = selectedFinanceCategory || "本月";
  els.financeRing.classList.toggle("has-selection", Boolean(selectedFinanceCategory));
  let cursor = 0;
  financeRingSegments = ranked.map(([category, amount]) => {
    const start = cursor;
    cursor += activeTotal ? amount / activeTotal * 100 : 0;
    return { category, amount, start, end: cursor };
  });
  const ringParts = financeRingSegments.map(({ category, start, end }) => `${FINANCE_CATEGORIES[category] || FINANCE_CATEGORIES.其他} ${start}% ${end}%`);
  if (cursor < 100) ringParts.push(`var(--soft) ${cursor}% 100%`);
  els.financeRing.style.background = `conic-gradient(${ringParts.join(", ")})`;
  els.financeLegend.textContent = "";
  ranked.forEach(([category, amount]) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = selectedFinanceCategory === category ? "is-selected" : "";
    const dot = document.createElement("i");
    const name = document.createElement("span");
    const value = document.createElement("strong");
    dot.style.background = FINANCE_CATEGORIES[category] || FINANCE_CATEGORIES.其他;
    name.textContent = category;
    value.textContent = money(amount);
    row.append(dot, name, value);
    row.addEventListener("click", () => selectFinanceCategory(category));
    els.financeLegend.append(row);
  });
  if (!ranked.length) els.financeLegend.textContent = modeMeta.empty;
  els.financeBreakdownTitle.textContent = modeMeta.breakdown;
  els.financeRing.setAttribute("aria-label", `点击圆环中的分类，查看本月${modeMeta.label}明细`);
  els.financeCategoryDetails.hidden = !selectedFinanceCategory;
  els.financeCategoryTopList.textContent = "";
  if (selectedFinanceCategory) {
    const categoryItems = activeItems.filter((item) => item.category === selectedFinanceCategory).sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    els.financeCategoryDetailsEyebrow.textContent = `${selectedFinanceCategory} · 本月 ${categoryItems.length} 笔`;
    els.financeCategoryDetailsTitle.textContent = `数额最大的几笔${modeMeta.label}`;
    categoryItems.slice(0, 5).forEach((item, index) => {
      const row = document.createElement("button"); row.type = "button"; row.className = "finance-category-top-row";
      const rank = document.createElement("span"); rank.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("span");
      const title = document.createElement("strong"); title.textContent = item.note || selectedFinanceCategory;
      const date = document.createElement("small"); date.textContent = new Date(item.at).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
      const amount = document.createElement("strong"); amount.textContent = money(item.amount);
      copy.append(title, date); row.append(rank, copy, amount);
      row.addEventListener("click", () => openFinanceEditor(item));
      els.financeCategoryTopList.append(row);
    });
  }
  const top = ranked[0];
  let advice = "记下第一笔开销后，这里会给出温和、具体的消费提示。";
  if (budget && total > budget) advice = `本月已经超过预算 ${money(total - budget)}。可以先看看 ${top?.[0] || "非必要"} 类支出，给剩下的日子留一点余量。`;
  else if (budget && total > budget * .8) advice = `已使用月预算的 ${Math.round(total / budget * 100)}%。接下来每笔非必要消费，可以先停十秒再决定。`;
  else if (top && total > 0) advice = `${top[0]}是本月最大支出，占 ${Math.round(top[1] / total * 100)}%。这不是评判，只是帮你看见钱主要去了哪里。`;
  els.financeInsight.querySelector("p").textContent = advice;
  els.financeList.textContent = "";
  const recent = [...state.transactions].sort((a, b) => b.at - a.at).slice(0, 40);
  if (!recent.length) {
    const empty = document.createElement("div"); empty.className = "timeline-empty"; empty.textContent = "还没有流水。点右上角加号，记下第一笔。"; els.financeList.append(empty); return;
  }
  recent.forEach((item) => {
    const row = document.createElement("button"); row.type = "button"; row.className = "finance-row";
    const icon = document.createElement("span"); icon.className = "finance-row-icon"; icon.style.background = `${FINANCE_CATEGORIES[item.category] || FINANCE_CATEGORIES.其他}28`; icon.style.color = FINANCE_CATEGORIES[item.category] || FINANCE_CATEGORIES.其他; icon.textContent = item.category.slice(0, 1);
    const copy = document.createElement("span"); const title = document.createElement("strong"); const meta = document.createElement("small");
    const sourceLabel = item.source === "notification" ? " · 自动识别" : /-import$/.test(item.source || "") ? ` · ${item.source.replace("-import", "")}导入` : "";
    title.textContent = item.note || item.category; meta.textContent = `${item.category} · ${new Date(item.at).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}${sourceLabel}`; copy.append(title, meta);
    const amount = document.createElement("strong"); amount.textContent = `${item.type === "expense" ? "−" : item.type === "saving" ? "→" : "+"}${money(item.amount)}`; amount.style.color = item.type === "expense" ? "var(--ink)" : item.type === "saving" ? FINANCE_CATEGORIES.存钱 : FINANCE_CATEGORIES.收入;
    row.append(icon, copy, amount); row.addEventListener("click", () => openFinanceEditor(item)); els.financeList.append(row);
  });
}

function render() {
  renderTimer();
  renderTasks();
  renderTimeline();
  renderWeekSchedule();
  renderDdl();
  renderMemos();
  renderHeatmap();
  renderStreak();
  renderWidgets();
  renderFlowerSkins();
  renderThemes();
  renderFocusFeed();
  renderTaskColorPicker();
  renderReminderFields();
  renderNotificationButton();
  updatePageBadge();
  renderHome();
  renderFinance();
}

function cloneDailyPlanInputItem(item) {
  return item && typeof item === "object" ? { ...item } : item;
}

function getDailyPlanPreviewInput(now) {
  const timestamp = Number(now);
  if (!Number.isFinite(timestamp)) throw new TypeError("今日编排需要有效的当前时间");
  const current = new Date(timestamp);
  const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const nextDayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1).getTime();
  const recentStart = timestamp - 7 * 24 * 60 * 60 * 1000;
  const tasks = (state.tasks || [])
    .filter((task) => task && task.done !== true)
    .map(cloneDailyPlanInputItem);
  const courses = (state.courses || [])
    .filter((course) => Number(course?.startAt) < nextDayStart && Number(course?.endAt) > dayStart)
    .map(cloneDailyPlanInputItem);
  const focusSessions = (state.focusSessions || [])
    .filter((session) => Number(session?.endAt) >= recentStart && Number(session?.endAt) <= timestamp)
    .map(cloneDailyPlanInputItem);
  const fixedTaskIds = tasks
    .filter((task) => globalThis.DailyPlanner.isFixedTimeTask(task))
    .map((task) => String(task.id));
  return { now: timestamp, tasks, courses, focusSessions, fixedTaskIds };
}

function getDeadlineSprintEligibleTasks(now) {
  const timestamp = Number(now);
  const planner = globalThis.DailyPlanner;
  if (!Number.isFinite(timestamp) || !planner || typeof planner.getTaskDeadlineAt !== "function") return [];
  return (Array.isArray(state.tasks) ? state.tasks : [])
    .filter((task) => task && task.done !== true)
    .map((task) => ({ task, deadlineAt: planner.getTaskDeadlineAt(task, timestamp) }))
    .filter(({ deadlineAt }) => Number.isFinite(deadlineAt))
    .sort((a, b) => a.deadlineAt - b.deadlineAt
      || String(a.task.title || "").localeCompare(String(b.task.title || ""))
      || String(a.task.id || "").localeCompare(String(b.task.id || "")));
}

function deadlineSprintRemainingText(deadlineAt, now) {
  const minutes = Math.max(0, Math.ceil((Number(deadlineAt) - Number(now)) / 60000));
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainder = minutes % 60;
  if (days > 0) return `${days} 天 ${hours} 小时`;
  if (hours > 0) return `${hours} 小时 ${remainder} 分钟`;
  return `${remainder} 分钟`;
}

function deadlineSprintDateTime(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function resetDeadlineSprintMemory(clearTask = false) {
  deadlineSprintPreview = null;
  deadlineSprintSelectedIds = new Set();
  deadlineSprintGenerating = false;
  deadlineSprintError = null;
  deadlineSprintAdopting = false;
  deadlineSprintAdoptionError = null;
  deadlineSprintAdoptionNotice = null;
  deadlineSprintConflictIds = new Set();
  if (clearTask) deadlineSprintTaskId = null;
}

function getDeadlineSprintCandidateInput(now, taskId) {
  const timestamp = Number(now);
  if (!Number.isFinite(timestamp)) throw new TypeError("截止前冲刺需要有效的当前时间");
  const planner = globalThis.DailyPlanner;
  if (!planner || typeof planner.getTaskDeadlineAt !== "function"
    || typeof planner.buildDeadlineSprintCandidates !== "function"
    || typeof planner.isFixedTimeTask !== "function") {
    throw new Error("本地冲刺编排引擎未加载");
  }
  const selectedTask = (Array.isArray(state.tasks) ? state.tasks : [])
    .find((task) => String(task?.id) === String(taskId) && task?.done !== true);
  if (!selectedTask) return null;
  const deadlineAt = planner.getTaskDeadlineAt(selectedTask, timestamp);
  const rangeEndAt = Number.isFinite(deadlineAt) ? deadlineAt : timestamp;
  const courses = (Array.isArray(state.courses) ? state.courses : [])
    .filter((course) => Number(course?.startAt) < rangeEndAt && Number(course?.endAt) > timestamp)
    .map(cloneDailyPlanInputItem);
  const fixedTasks = (Array.isArray(state.tasks) ? state.tasks : [])
    .filter((task) => task && task.done !== true && planner.isFixedTimeTask(task)
      && Number(task.startAt) < rangeEndAt && Number(task.endAt) > timestamp)
    .map(cloneDailyPlanInputItem);
  const adoptedBlocks = [];
  const seenBlocks = new Set();
  Object.keys(state.dailyPlans && typeof state.dailyPlans === "object" ? state.dailyPlans : {})
    .sort()
    .forEach((dayKeyValue) => {
      const plan = getAdoptedDailyPlan(dayKeyValue);
      if (!plan) return;
      plan.blocks.forEach((block) => {
        if (Number(block.startAt) >= rangeEndAt || Number(block.endAt) <= timestamp) return;
        const identity = `${String(block.id)}:${Number(block.startAt)}:${Number(block.endAt)}`;
        if (seenBlocks.has(identity)) return;
        seenBlocks.add(identity);
        adoptedBlocks.push(cloneDailyPlanInputItem(block));
      });
    });
  return {
    now: timestamp,
    task: cloneDailyPlanInputItem(selectedTask),
    deadlineAt,
    courses,
    fixedTasks,
    adoptedBlocks,
  };
}

function appendDeadlineSprintEmpty(titleText, bodyText, className = "") {
  if (!els.deadlineSprintContent) return;
  const empty = document.createElement("div");
  empty.className = `daily-plan-empty deadline-sprint-empty${className ? ` ${className}` : ""}`;
  const title = document.createElement("strong");
  const body = document.createElement("p");
  title.textContent = titleText;
  body.textContent = bodyText;
  empty.append(title, body);
  els.deadlineSprintContent.append(empty);
}

function appendDeadlineSprintWarnings(warnings) {
  if (!els.deadlineSprintContent || !Array.isArray(warnings) || warnings.length === 0) return;
  const list = document.createElement("ul");
  list.className = "daily-plan-warnings deadline-sprint-warnings";
  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.className = "daily-plan-warning";
    item.dataset.warningCode = String(warning?.code || "SPRINT_WARNING");
    const label = document.createElement("strong");
    const message = document.createElement("span");
    label.textContent = warning?.severity === "error" ? "错误" : warning?.severity === "info" ? "提示" : "提醒";
    message.textContent = String(warning?.message || "请检查当前冲刺安排");
    item.append(label, message);
    list.append(item);
  });
  els.deadlineSprintContent.append(list);
}

function deadlineSprintSelectionStats() {
  const candidates = Array.isArray(deadlineSprintPreview?.candidates) ? deadlineSprintPreview.candidates : [];
  const selected = candidates.filter((candidate) => deadlineSprintSelectedIds.has(String(candidate.id)));
  const minutes = selected.reduce((sum, candidate) => sum + Math.max(0, Number(candidate.minutes) || 0), 0);
  const days = new Set(selected.map((candidate) => dailyPlanDayKey(candidate.startAt))).size;
  return {
    count: selected.length,
    minutes,
    days,
    intensityLevel: minutes <= 90 ? "low" : minutes <= 180 ? "moderate" : "high",
  };
}

function renderDeadlineSprintCandidates() {
  if (!els.deadlineSprintContent || !els.deadlineSprintSelection) return;
  els.deadlineSprintContent.replaceChildren();
  const candidates = Array.isArray(deadlineSprintPreview?.candidates)
    ? deadlineSprintPreview.candidates.slice(0, 8)
    : [];

  if (deadlineSprintError) {
    appendDeadlineSprintEmpty("暂时无法生成冲刺时段", deadlineSprintError, "daily-plan-error");
  } else if (deadlineSprintGenerating) {
    appendDeadlineSprintEmpty("正在寻找截止前的空闲时间…", "所有计算都在本机完成。", "deadline-sprint-loading");
  } else if (deadlineSprintAdoptionNotice && !deadlineSprintPreview) {
    appendDeadlineSprintEmpty("冲刺时段已加入日程", "可以在时间轴和周日程中查看已采用的计划专注。", "deadline-sprint-success");
  } else if (!deadlineSprintPreview) {
    appendDeadlineSprintEmpty("选择一个任务开始冲刺", "生成后可以逐个选择想采用的专注时段。");
  } else {
    const summary = document.createElement("div");
    summary.className = "deadline-sprint-summary";
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = `${deadlineSprintPreview.candidateCount || candidates.length} 个候选时段`;
    meta.textContent = `截止 ${deadlineSprintDateTime(deadlineSprintPreview.deadlineAt)} · 共 ${Number(deadlineSprintPreview.totalCandidateMinutes) || 0} 分钟`;
    summary.append(title, meta);
    els.deadlineSprintContent.append(summary);

    if (candidates.length > 0) {
      const list = document.createElement("div");
      list.className = "deadline-sprint-candidates";
      candidates.forEach((candidate) => {
        const row = document.createElement("label");
        row.className = "deadline-sprint-candidate";
        if (deadlineSprintConflictIds.has(String(candidate.id))) row.classList.add("is-conflict");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = String(candidate.id);
        checkbox.checked = deadlineSprintSelectedIds.has(String(candidate.id));
        checkbox.disabled = deadlineSprintAdopting;
        checkbox.setAttribute("aria-label", `选择第 ${candidate.sequence} 轮，${deadlineSprintDateTime(candidate.startAt)}`);
        checkbox.addEventListener("change", () => toggleDeadlineSprintCandidate(candidate.id, checkbox.checked));
        const copy = document.createElement("span");
        const heading = document.createElement("strong");
        const timing = document.createElement("span");
        const detail = document.createElement("small");
        heading.textContent = `第 ${candidate.sequence} 轮 · ${String(deadlineSprintPreview.title || candidate.title || "冲刺任务")}`;
        timing.textContent = `${deadlineSprintDateTime(candidate.startAt)}–${dailyPlanClock(candidate.endAt)}`;
        detail.textContent = `${candidate.minutes} 分钟${Number(candidate.minutes) < Number(deadlineSprintPreview.focusMinutes) ? " · 灵活时段" : ""}`;
        copy.append(heading, timing, detail);
        row.append(checkbox, copy);
        list.append(row);
      });
      els.deadlineSprintContent.append(list);
    } else {
      appendDeadlineSprintEmpty("没有可用的冲刺时段", "可以调整固定安排，或选择其他截止任务。");
    }
    appendDeadlineSprintWarnings(deadlineSprintPreview.warnings);
    if (deadlineSprintAdoptionError) {
      appendDeadlineSprintEmpty("暂时无法采用冲刺时段", deadlineSprintAdoptionError, "daily-plan-error");
    }
  }

  const stats = deadlineSprintSelectionStats();
  els.deadlineSprintSelection.hidden = !deadlineSprintPreview;
  els.deadlineSprintSelection.replaceChildren();
  if (deadlineSprintPreview) {
    const summary = document.createElement("strong");
    summary.textContent = `已选择 ${stats.count} 轮，共 ${stats.minutes} 分钟 · 涉及 ${stats.days} 天`;
    const intensity = document.createElement("span");
    intensity.textContent = `强度：${stats.intensityLevel === "high" ? "高" : stats.intensityLevel === "moderate" ? "适中" : "低"}`;
    els.deadlineSprintSelection.append(summary, intensity);
    if (stats.intensityLevel === "high") {
      const reminder = document.createElement("p");
      reminder.textContent = "冲刺强度较高，记得为自己留出休息时间";
      els.deadlineSprintSelection.append(reminder);
    }
  }
  if (els.deadlineSprintAdoptButton) {
    const canAdopt = Boolean(deadlineSprintPreview) && stats.count > 0 && !deadlineSprintGenerating && !deadlineSprintAdopting;
    els.deadlineSprintAdoptButton.disabled = !canAdopt;
    els.deadlineSprintAdoptButton.setAttribute("aria-disabled", String(!canAdopt));
    els.deadlineSprintAdoptButton.setAttribute("aria-busy", String(deadlineSprintAdopting));
    els.deadlineSprintAdoptButton.textContent = deadlineSprintAdopting ? "保存中…" : "采用到日程";
  }
  if (els.deadlineSprintAdoptionMessage) {
    const message = deadlineSprintAdoptionError || deadlineSprintAdoptionNotice || "";
    els.deadlineSprintAdoptionMessage.hidden = !message;
    els.deadlineSprintAdoptionMessage.textContent = message;
  }
}

function renderDeadlineSprintInterface(now = Date.now()) {
  if (!els.deadlineSprintPanel || !els.deadlineSprintTaskSelect || !els.deadlineSprintGenerateButton) return;
  const timestamp = Number(now);
  const eligible = getDeadlineSprintEligibleTasks(timestamp);
  const previousTaskId = deadlineSprintTaskId;
  const selected = eligible.find(({ task }) => String(task.id) === String(deadlineSprintTaskId));
  if (deadlineSprintTaskId && !selected) {
    deadlineSprintTaskId = null;
    deadlineSprintSelectedIds = new Set();
    if (!deadlineSprintPreview) deadlineSprintError = "原先选择的任务已不可用，请重新选择";
  }

  els.deadlineSprintTaskSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = eligible.length > 0 ? "请选择具有未来截止时间的任务" : "没有可用于冲刺的任务";
  els.deadlineSprintTaskSelect.append(placeholder);
  eligible.forEach(({ task, deadlineAt }) => {
    const option = document.createElement("option");
    option.value = String(task.id);
    option.textContent = `${String(task.title || "未命名任务")} · ${deadlineSprintDateTime(deadlineAt)} 截止 · 剩余 ${deadlineSprintRemainingText(deadlineAt, timestamp)}`;
    els.deadlineSprintTaskSelect.append(option);
  });
  els.deadlineSprintTaskSelect.value = deadlineSprintTaskId || "";
  els.deadlineSprintTaskSelect.disabled = deadlineSprintGenerating || deadlineSprintAdopting || eligible.length === 0;

  const active = eligible.find(({ task }) => String(task.id) === String(deadlineSprintTaskId));
  els.deadlineSprintTaskMeta.textContent = active
    ? `${String(active.task.title || "未命名任务")} · ${deadlineSprintDateTime(active.deadlineAt)} 截止 · 剩余 ${deadlineSprintRemainingText(active.deadlineAt, timestamp)}`
    : eligible.length === 0 ? "当前没有未完成且具有未来截止时间的任务。" : "先选择一个任务，再生成候选冲刺时段。";
  els.deadlineSprintGenerateButton.disabled = !active || deadlineSprintGenerating || deadlineSprintAdopting;
  els.deadlineSprintGenerateButton.setAttribute("aria-disabled", String(els.deadlineSprintGenerateButton.disabled));
  els.deadlineSprintGenerateButton.textContent = deadlineSprintGenerating ? "生成中…" : deadlineSprintPreview ? "重新生成冲刺时段" : "生成冲刺时段";
  els.dailyPlanCard?.setAttribute("aria-busy", String(deadlineSprintGenerating || deadlineSprintAdopting));
  els.dailyPlanCard?.classList.toggle("is-loading", deadlineSprintGenerating || deadlineSprintAdopting);
  els.dailyPlanCard?.classList.toggle("is-error", Boolean(deadlineSprintError || deadlineSprintAdoptionError));
  if (dailyPlanMode === "deadline-sprint" && els.dailyPlanStatus) {
    els.dailyPlanStatus.textContent = deadlineSprintAdopting
      ? "保存中"
      : deadlineSprintGenerating
      ? "生成中"
      : deadlineSprintAdoptionError ? "采用失败"
      : deadlineSprintAdoptionNotice ? "已加入日程"
      : deadlineSprintError ? "生成失败" : deadlineSprintPreview ? "候选已生成" : "尚未生成";
  }
  renderDeadlineSprintCandidates();
  return { eligible, invalidatedTaskId: previousTaskId && !selected ? previousTaskId : null };
}

function renderDailyPlanMode(now = Date.now()) {
  const sprintMode = dailyPlanMode === "deadline-sprint";
  if (els.dailyPlanBalancedModeButton) els.dailyPlanBalancedModeButton.setAttribute("aria-selected", String(!sprintMode));
  if (els.dailyPlanSprintModeButton) els.dailyPlanSprintModeButton.setAttribute("aria-selected", String(sprintMode));
  if (els.dailyPlanBalancedPanel) els.dailyPlanBalancedPanel.hidden = sprintMode;
  if (els.deadlineSprintPanel) els.deadlineSprintPanel.hidden = !sprintMode;
  if (sprintMode) renderDeadlineSprintInterface(now);
  else renderDailyPlanPreview(now);
}

function setDailyPlanMode(mode, now = Date.now()) {
  const nextMode = mode === "deadline-sprint" ? "deadline-sprint" : "balanced";
  if (dailyPlanMode === nextMode) {
    renderDailyPlanMode(now);
    return false;
  }
  dailyPlanMode = nextMode;
  if (nextMode === "balanced") resetDeadlineSprintMemory(true);
  renderDailyPlanMode(now);
  return true;
}

function selectDeadlineSprintTask(taskId, now = Date.now()) {
  deadlineSprintTaskId = taskId === undefined || taskId === null || String(taskId) === "" ? null : String(taskId);
  deadlineSprintPreview = null;
  deadlineSprintSelectedIds = new Set();
  deadlineSprintError = null;
  deadlineSprintAdoptionError = null;
  deadlineSprintAdoptionNotice = null;
  deadlineSprintConflictIds = new Set();
  renderDeadlineSprintInterface(now);
}

function toggleDeadlineSprintCandidate(candidateId, selected) {
  const id = String(candidateId || "");
  if (deadlineSprintAdopting) return false;
  const exists = Array.isArray(deadlineSprintPreview?.candidates)
    && deadlineSprintPreview.candidates.some((candidate) => String(candidate.id) === id);
  if (!exists) return false;
  if (selected) deadlineSprintSelectedIds.add(id);
  else deadlineSprintSelectedIds.delete(id);
  deadlineSprintConflictIds.delete(id);
  deadlineSprintAdoptionError = null;
  renderDeadlineSprintCandidates();
  return true;
}

async function generateDeadlineSprintPreview(now) {
  const timestamp = Number(now);
  if (deadlineSprintGenerating || deadlineSprintAdopting || dailyPlanGenerating || dailyPlanAdopting) return false;
  deadlineSprintGenerating = true;
  deadlineSprintPreview = null;
  deadlineSprintSelectedIds = new Set();
  deadlineSprintError = null;
  deadlineSprintAdoptionError = null;
  deadlineSprintAdoptionNotice = null;
  deadlineSprintConflictIds = new Set();
  if (els.deadlineSprintTaskSelect) els.deadlineSprintTaskSelect.disabled = true;
  if (els.deadlineSprintGenerateButton) {
    els.deadlineSprintGenerateButton.disabled = true;
    els.deadlineSprintGenerateButton.setAttribute("aria-disabled", "true");
    els.deadlineSprintGenerateButton.textContent = "生成中…";
  }
  if (els.dailyPlanCard) els.dailyPlanCard.setAttribute("aria-busy", "true");
  if (els.dailyPlanStatus) els.dailyPlanStatus.textContent = "生成中";
  renderDeadlineSprintCandidates();
  try {
    await Promise.resolve();
    const input = getDeadlineSprintCandidateInput(timestamp, deadlineSprintTaskId);
    if (!input) {
      deadlineSprintTaskId = null;
      deadlineSprintError = "选择的任务已被删除或完成，请重新选择";
      return false;
    }
    deadlineSprintPreview = globalThis.DailyPlanner.buildDeadlineSprintCandidates(input);
    return true;
  } catch (error) {
    console.error("Deadline sprint preview failed:", error);
    deadlineSprintError = "生成冲刺时段失败，请稍后重试";
    return false;
  } finally {
    deadlineSprintGenerating = false;
    renderDeadlineSprintInterface(timestamp);
  }
}

function deadlineSprintIntervalsOverlap(left, right) {
  return Number(left?.startAt) < Number(right?.endAt) && Number(left?.endAt) > Number(right?.startAt);
}

function deadlineSprintBlockMatchesCandidate(block, candidate) {
  return String(block?.id || "") === String(candidate?.id || "")
    && String(block?.taskId || "") === String(candidate?.taskId || "")
    && Number(block?.startAt) === Number(candidate?.startAt)
    && Number(block?.endAt) === Number(candidate?.endAt)
    && Number(block?.minutes) === Number(candidate?.minutes)
    && normalizeDailyPlanBlockMode(block?.planningMode) === "deadline-sprint"
    && String(block?.sprintId || "") === String(candidate?.sprintId || "")
    && Number(block?.deadlineAt) === Number(candidate?.deadlineAt)
    && Number(block?.sequence) === Number(candidate?.sequence);
}

function getCurrentAdoptedDailyPlanBlocks() {
  const blocks = [];
  Object.keys(state.dailyPlans && typeof state.dailyPlans === "object" && !Array.isArray(state.dailyPlans) ? state.dailyPlans : {})
    .sort()
    .forEach((dayKeyValue) => {
      const plan = getAdoptedDailyPlan(dayKeyValue);
      if (!plan) return;
      plan.blocks.forEach((block) => blocks.push({ ...block, planDayKey: dayKeyValue }));
    });
  return blocks;
}

function validateDeadlineSprintSelection(now) {
  const timestamp = Number(now);
  const preview = deadlineSprintPreview;
  const candidates = Array.isArray(preview?.candidates) ? preview.candidates : [];
  const candidateById = new Map(candidates.map((candidate) => [String(candidate?.id || ""), candidate]));
  const selected = [...deadlineSprintSelectedIds]
    .map((id) => candidateById.get(String(id)))
    .filter(Boolean);
  const conflictIds = new Set();
  const duplicateIds = new Set();
  if (!Number.isFinite(timestamp) || !preview || selected.length === 0) {
    return { ok: false, reason: "no-selection", selected: [], conflictIds, duplicateIds };
  }

  const taskId = String(preview.taskId || "");
  const task = (Array.isArray(state.tasks) ? state.tasks : [])
    .find((item) => String(item?.id || "") === taskId);
  const planner = globalThis.DailyPlanner;
  const currentDeadlineAt = task && task.done !== true && planner && typeof planner.getTaskDeadlineAt === "function"
    ? planner.getTaskDeadlineAt(task, timestamp)
    : null;
  if (!task || task.done === true || !Number.isFinite(currentDeadlineAt)
    || Number(currentDeadlineAt) !== Number(preview.deadlineAt)) {
    selected.forEach((candidate) => conflictIds.add(String(candidate.id)));
    return { ok: false, reason: "task-changed", selected, conflictIds, duplicateIds };
  }

  const adoptedBlocks = getCurrentAdoptedDailyPlanBlocks();
  const adoptedById = new Map(adoptedBlocks.map((block) => [String(block.id), block]));
  const courses = Array.isArray(state.courses) ? state.courses : [];
  const breakMinutes = Math.max(0, Number(preview.breakMinutes) || 0);
  const fixedTasks = (Array.isArray(state.tasks) ? state.tasks : [])
    .filter((item) => item && item.done !== true && planner.isFixedTimeTask(item));
  selected.forEach((candidate) => {
    const id = String(candidate?.id || "");
    const startAt = Number(candidate?.startAt);
    const endAt = Number(candidate?.endAt);
    const minutes = Number(candidate?.minutes);
    const internallyValid = id
      && String(candidate?.taskId || "") === taskId
      && String(candidate?.sprintId || "") === String(preview.sprintId || "")
      && Number(candidate?.deadlineAt) === Number(preview.deadlineAt)
      && Number.isFinite(startAt) && Number.isFinite(endAt) && endAt > startAt
      && Number.isFinite(minutes) && minutes > 0
      && minutes === Math.round((endAt - startAt) / 60000)
      && Number.isFinite(Number(candidate?.sequence)) && Number(candidate.sequence) > 0
      && startAt > timestamp && endAt <= currentDeadlineAt;
    if (!internallyValid) {
      conflictIds.add(id);
      return;
    }
    const sameIdBlock = adoptedById.get(id);
    if (sameIdBlock) {
      if (deadlineSprintBlockMatchesCandidate(sameIdBlock, candidate)) duplicateIds.add(id);
      else conflictIds.add(id);
      return;
    }
    const conflictsWithAdopted = adoptedBlocks.some((block) => {
      if (deadlineSprintIntervalsOverlap(candidate, block)) return true;
      if (String(block.planningMode) !== "deadline-sprint" || String(block.sprintId) !== String(candidate.sprintId)) return false;
      const gap = Math.max(Number(candidate.startAt), Number(block.startAt))
        - Math.min(Number(candidate.endAt), Number(block.endAt));
      return gap < breakMinutes * 60000;
    });
    if (courses.some((course) => deadlineSprintIntervalsOverlap(candidate, course))
      || fixedTasks.some((fixedTask) => deadlineSprintIntervalsOverlap(candidate, fixedTask))
      || conflictsWithAdopted) {
      conflictIds.add(id);
    }
  });

  const selectedNew = selected
    .filter((candidate) => !duplicateIds.has(String(candidate.id)) && !conflictIds.has(String(candidate.id)))
    .sort((a, b) => Number(a.startAt) - Number(b.startAt) || Number(a.endAt) - Number(b.endAt) || String(a.id).localeCompare(String(b.id)));
  for (let index = 1; index < selectedNew.length; index += 1) {
    const previous = selectedNew[index - 1];
    const current = selectedNew[index];
    if (deadlineSprintIntervalsOverlap(previous, current)
      || (String(previous.sprintId) === String(current.sprintId)
        && Number(current.startAt) - Number(previous.endAt) < breakMinutes * 60000)) {
      conflictIds.add(String(previous.id));
      conflictIds.add(String(current.id));
    }
  }
  return {
    ok: conflictIds.size === 0,
    reason: conflictIds.size ? "schedule-changed" : null,
    selected,
    conflictIds,
    duplicateIds,
  };
}

function cloneDailyPlanValue(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function deadlineSprintPlanWindow(dayKeyValue, blocks, existingWindow = null) {
  const bounds = getDayBounds(dayKeyValue);
  if (!bounds) return null;
  const dayStart = new Date(bounds.startAt);
  const defaultStartAt = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 7).getTime();
  const defaultEndAt = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 22).getTime();
  const blockStartAt = Math.min(...blocks.map((block) => Number(block.startAt)));
  const blockEndAt = Math.max(...blocks.map((block) => Number(block.endAt)));
  const oldStartAt = Number(existingWindow?.startAt);
  const oldEndAt = Number(existingWindow?.endAt);
  const oldPlanningStartAt = Number(existingWindow?.planningStartAt);
  const hasExisting = Number.isFinite(oldStartAt) && Number.isFinite(oldEndAt) && oldEndAt > oldStartAt
    && Number.isFinite(oldPlanningStartAt);
  return {
    startAt: hasExisting ? Math.min(oldStartAt, blockStartAt) : defaultStartAt,
    endAt: hasExisting ? Math.max(oldEndAt, blockEndAt) : defaultEndAt,
    planningStartAt: hasExisting ? Math.min(oldPlanningStartAt, blockStartAt) : blockStartAt,
  };
}

function mergeDeadlineSprintBlocksIntoPlans(validation, adoptedAt) {
  const timestamp = Number(adoptedAt);
  const preview = deadlineSprintPreview;
  if (!validation?.ok || !Number.isFinite(timestamp) || !preview) return { ok: false, changed: false };
  const selectedNew = validation.selected.filter((candidate) => !validation.duplicateIds.has(String(candidate.id)));
  if (selectedNew.length === 0) return { ok: true, changed: false, plans: state.dailyPlans };
  const grouped = new Map();
  selectedNew.forEach((candidate) => {
    const dayKeyValue = dailyPlanDayKey(candidate.startAt);
    if (!grouped.has(dayKeyValue)) grouped.set(dayKeyValue, []);
    grouped.get(dayKeyValue).push(candidate);
  });
  const nextPlans = { ...(state.dailyPlans && typeof state.dailyPlans === "object" ? state.dailyPlans : {}) };
  grouped.forEach((candidates, dayKeyValue) => {
    const existing = getAdoptedDailyPlan(dayKeyValue);
    const existingBlocks = existing ? existing.blocks.map(cloneDailyPlanValue) : [];
    const byId = new Map(existingBlocks.map((block) => [String(block.id), block]));
    candidates.forEach((candidate) => {
      if (byId.has(String(candidate.id))) return;
      byId.set(String(candidate.id), {
        id: String(candidate.id),
        taskId: String(candidate.taskId),
        title: String(candidate.title || preview.title || "冲刺任务"),
        startAt: Number(candidate.startAt),
        endAt: Number(candidate.endAt),
        minutes: Number(candidate.minutes),
        planningMode: "deadline-sprint",
        sprintId: String(candidate.sprintId),
        deadlineAt: Number(candidate.deadlineAt),
        sequence: Number(candidate.sequence),
      });
    });
    const blocks = [...byId.values()]
      .sort((a, b) => Number(a.startAt) - Number(b.startAt) || Number(a.endAt) - Number(b.endAt) || String(a.id).localeCompare(String(b.id)));
    const priorities = [];
    const priorityTaskIds = new Set();
    (existing?.priorities || []).forEach((priority) => {
      const id = priority?.taskId === null || priority?.taskId === undefined ? "" : String(priority.taskId);
      if (id && priorityTaskIds.has(id)) return;
      if (id) priorityTaskIds.add(id);
      priorities.push(cloneDailyPlanValue(priority));
    });
    if (!priorityTaskIds.has(String(preview.taskId))) {
      if (priorities.length >= 5) priorities.length = 4;
      priorities.push({
        rank: priorities.length + 1,
        taskId: String(preview.taskId),
        title: String(preview.title || "冲刺任务"),
        startAt: null,
        deadlineAt: Number(preview.deadlineAt),
        overdue: false,
        reasons: ["截止前冲刺"],
        planningMode: "deadline-sprint",
      });
    }
    const warnings = [];
    const warningKeys = new Set();
    (existing?.warnings || []).forEach((warning) => {
      const key = `${String(warning.code)}:${(warning.sourceIds || []).map(String).sort().join(",")}:${String(warning.message)}`;
      if (warningKeys.has(key)) return;
      warningKeys.add(key);
      warnings.push(cloneDailyPlanValue(warning));
    });
    const window = deadlineSprintPlanWindow(dayKeyValue, blocks, existing?.window);
    nextPlans[dayKeyValue] = {
      version: 2,
      mode: dailyPlanModeFromBlocks(blocks),
      dayKey: dayKeyValue,
      generated_at: existing ? existing.generated_at : Number(preview.generated_at),
      adopted_at: timestamp,
      window,
      focusTargetMinutes: existing ? existing.focusTargetMinutes : Number(preview.focusMinutes),
      priorities: priorities.slice(0, 5),
      blocks,
      warnings,
    };
  });
  return { ok: true, changed: true, plans: nextPlans, dayKeys: [...grouped.keys()].sort() };
}

async function adoptDeadlineSprintSelection(adoptedAt) {
  const timestamp = Number(adoptedAt);
  if (deadlineSprintAdopting || deadlineSprintGenerating || dailyPlanAdopting || dailyPlanGenerating
    || !Number.isFinite(timestamp) || deadlineSprintSelectedIds.size === 0) return false;
  deadlineSprintAdopting = true;
  deadlineSprintAdoptionError = null;
  deadlineSprintAdoptionNotice = null;
  deadlineSprintConflictIds = new Set();
  renderDeadlineSprintCandidates();
  if (els.dailyPlanCard) els.dailyPlanCard.setAttribute("aria-busy", "true");
  if (els.dailyPlanStatus) els.dailyPlanStatus.textContent = "保存中";
  await Promise.resolve();
  try {
    const validation = validateDeadlineSprintSelection(timestamp);
    if (!validation.ok) {
      deadlineSprintConflictIds = validation.conflictIds;
      validation.conflictIds.forEach((id) => deadlineSprintSelectedIds.delete(String(id)));
      deadlineSprintAdoptionError = validation.reason === "no-selection"
        ? "请先选择至少一个冲刺时段"
        : "部分时段已发生变化，请重新确认或重新生成";
      return false;
    }
    const merged = mergeDeadlineSprintBlocksIntoPlans(validation, timestamp);
    if (!merged.ok) {
      deadlineSprintAdoptionError = "保存失败，请稍后重试";
      return false;
    }
    if (merged.changed) {
      const previousDailyPlans = state.dailyPlans;
      const previousSyncUpdatedAt = state.syncUpdatedAt;
      const previousAffectedPlans = Object.fromEntries((merged.dayKeys || []).map((dayKeyValue) => [
        dayKeyValue,
        Object.prototype.hasOwnProperty.call(previousDailyPlans, dayKeyValue)
          ? cloneDailyPlanValue(previousDailyPlans[dayKeyValue])
          : undefined,
      ]));
      try {
        state.dailyPlans = merged.plans;
        const result = saveState();
        if (result === false) throw new Error("saveState returned false");
      } catch (error) {
        console.error("Deadline sprint adoption failed:", error);
        const restoredPlans = { ...previousDailyPlans };
        Object.entries(previousAffectedPlans).forEach(([dayKeyValue, plan]) => {
          if (plan === undefined) delete restoredPlans[dayKeyValue];
          else restoredPlans[dayKeyValue] = plan;
        });
        state.dailyPlans = restoredPlans;
        state.syncUpdatedAt = previousSyncUpdatedAt;
        deadlineSprintAdoptionError = "保存失败，请稍后重试";
        return false;
      }
    }
    resetDeadlineSprintMemory(true);
    deadlineSprintAdoptionNotice = "冲刺时段已加入日程";
    if (typeof renderTimeline === "function") renderTimeline();
    if (typeof renderWeekSchedule === "function") renderWeekSchedule();
    return true;
  } finally {
    deadlineSprintAdopting = false;
    renderDeadlineSprintInterface(timestamp);
  }
}

function dailyPlanClock(timestamp) {
  const value = new Date(timestamp);
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function dailyPlanDayKey(timestamp = Date.now()) {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDailyPlanBlockMode(value) {
  return String(value || "").toLowerCase() === "deadline-sprint" ? "deadline-sprint" : "balanced";
}

function dailyPlanModeFromBlocks(blocks) {
  const modes = new Set((Array.isArray(blocks) ? blocks : []).map((block) => normalizeDailyPlanBlockMode(block?.planningMode)));
  if (modes.has("deadline-sprint") && modes.has("balanced")) return "mixed";
  if (modes.has("deadline-sprint")) return "deadline-sprint";
  return "balanced";
}

function normalizeDailyPlanForDisplay(plan, expectedDayKey = null, requireAdopted = false) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return null;
  const version = Number(plan.version) === 2 ? 2 : 1;
  const dayKeyValue = typeof plan.dayKey === "string" ? plan.dayKey : "";
  const generatedAt = Number(plan.generated_at);
  const adoptedAt = Number(plan.adopted_at);
  if (!dayKeyValue || (expectedDayKey && dayKeyValue !== expectedDayKey) || !Number.isFinite(generatedAt)) return null;
  if (requireAdopted && !Number.isFinite(adoptedAt)) return null;
  if (!plan.window || typeof plan.window !== "object" || Array.isArray(plan.window)) return null;
  const windowStartAt = Number(plan.window.startAt);
  const windowEndAt = Number(plan.window.endAt);
  const planningStartAt = Number(plan.window.planningStartAt);
  if (!Number.isFinite(windowStartAt) || !Number.isFinite(windowEndAt) || windowEndAt <= windowStartAt
    || !Number.isFinite(planningStartAt)) return null;
  const focusTargetMinutes = Number(plan.focusTargetMinutes);
  if (!Number.isFinite(focusTargetMinutes) || focusTargetMinutes <= 0) return null;
  const priorityLimit = version === 2 ? 5 : 3;
  const priorities = Array.isArray(plan.priorities) ? plan.priorities
    .filter((priority) => priority && typeof priority === "object")
    .slice(0, priorityLimit)
    .map((priority, index) => ({
      rank: Number(priority.rank) || index + 1,
      taskId: priority.taskId === null || priority.taskId === undefined ? null : String(priority.taskId),
      title: String(priority.title || "未命名任务"),
      startAt: Number.isFinite(Number(priority.startAt)) ? Number(priority.startAt) : null,
      deadlineAt: Number.isFinite(Number(priority.deadlineAt)) ? Number(priority.deadlineAt) : null,
      overdue: Boolean(priority.overdue),
      reasons: Array.isArray(priority.reasons) ? priority.reasons.map(String) : [],
      planningMode: normalizeDailyPlanBlockMode(priority.planningMode),
    })) : [];
  const rawBlocks = Array.isArray(plan.blocks) ? plan.blocks
    .filter((block) => block && typeof block === "object"
      && String(block.id || "").trim()
      && block.taskId !== null && block.taskId !== undefined && String(block.taskId).trim()
      && Number.isFinite(Number(block.startAt))
      && Number.isFinite(Number(block.endAt))
      && Number(block.endAt) > Number(block.startAt)
      && Number.isFinite(Number(block.minutes))
      && Number(block.minutes) > 0
      && (String(block.planningMode || "").toLowerCase() !== "deadline-sprint"
        || (String(block.sprintId || "").trim()
          && Number.isFinite(Number(block.deadlineAt))
          && Number.isFinite(Number(block.sequence))
          && Number(block.sequence) > 0)))
    : [];
  const blocks = rawBlocks
    .slice(0, version === 2 ? rawBlocks.length : 3)
    .map((block) => ({
      id: String(block.id),
      taskId: String(block.taskId),
      title: String(block.title || "专注时段"),
      startAt: Number(block.startAt),
      endAt: Number(block.endAt),
      minutes: Number(block.minutes),
      planningMode: normalizeDailyPlanBlockMode(block.planningMode),
      ...(String(block.planningMode || "").toLowerCase() === "deadline-sprint" ? {
        sprintId: String(block.sprintId || ""),
        deadlineAt: Number(block.deadlineAt),
        sequence: Number(block.sequence),
      } : {}),
    }));
  const warnings = Array.isArray(plan.warnings) ? plan.warnings
    .filter((warning) => warning && typeof warning === "object")
    .map((warning) => ({
      code: String(warning.code || "PLAN_WARNING"),
      severity: String(warning.severity || "warning"),
      message: String(warning.message || "需要检查当前安排"),
      sourceIds: Array.isArray(warning.sourceIds) ? warning.sourceIds.map(String) : [],
    })) : [];
  return {
    version,
    mode: version === 2 ? dailyPlanModeFromBlocks(blocks) : "balanced",
    dayKey: dayKeyValue,
    generated_at: generatedAt,
    ...(Number.isFinite(adoptedAt) ? { adopted_at: adoptedAt } : {}),
    window: {
      startAt: windowStartAt,
      endAt: windowEndAt,
      planningStartAt,
    },
    focusTargetMinutes,
    priorities,
    blocks,
    warnings,
  };
}

function hasDailyPlanContent(plan) {
  return Boolean(plan && (plan.priorities.length > 0 || plan.blocks.length > 0));
}

function getAdoptedDailyPlan(dayKeyValue) {
  const saved = state.dailyPlans && typeof state.dailyPlans === "object" && !Array.isArray(state.dailyPlans)
    ? state.dailyPlans[dayKeyValue]
    : null;
  const normalized = normalizeDailyPlanForDisplay(saved, dayKeyValue, true);
  return normalized && (hasDailyPlanContent(normalized) || normalized.warnings.length > 0) ? normalized : null;
}

function getDayBounds(dayKeyValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dayKeyValue || ""))) return null;
  const start = new Date(`${dayKeyValue}T00:00:00`);
  if (!Number.isFinite(start.getTime()) || dailyPlanDayKey(start.getTime()) !== dayKeyValue) return null;
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { startAt: start.getTime(), endAt: end.getTime() };
}

function getAdoptedFocusBlocksForDay(dayKeyValue) {
  const bounds = getDayBounds(dayKeyValue);
  if (!bounds) return [];
  const previousDate = new Date(bounds.startAt);
  previousDate.setDate(previousDate.getDate() - 1);
  const candidatePlanKeys = [dayKeyValue, dailyPlanDayKey(previousDate.getTime())];
  const activeTaskIds = new Set((Array.isArray(state.tasks) ? state.tasks : [])
    .filter((task) => task?.id !== undefined && task?.id !== null)
    .map((task) => String(task.id)));
  const seenBlockIds = new Set();
  const blocks = [];

  candidatePlanKeys.forEach((planKey) => {
    const plan = getAdoptedDailyPlan(planKey);
    if (!plan) return;
    const windowStartAt = Number(plan.window?.startAt);
    const windowEndAt = Number(plan.window?.endAt);
    const planningStartAt = Number(plan.window?.planningStartAt);
    if (!Number.isFinite(windowStartAt) || !Number.isFinite(windowEndAt) || windowEndAt <= windowStartAt
      || !Number.isFinite(planningStartAt)) return;
    plan.blocks.forEach((block) => {
      const id = String(block.id || "").trim();
      const taskId = block.taskId === null || block.taskId === undefined ? "" : String(block.taskId);
      if (!id || !taskId || seenBlockIds.has(id)) return;
      if (!Number.isFinite(block.startAt) || !Number.isFinite(block.endAt) || block.endAt <= block.startAt) return;
      if (!Number.isFinite(block.minutes) || block.minutes <= 0) return;
      const startAt = Math.max(block.startAt, bounds.startAt);
      const endAt = Math.min(block.endAt, bounds.endAt);
      if (endAt <= startAt) return;
      seenBlockIds.add(id);
      blocks.push({
        id,
        taskId,
        title: String(block.title || "计划专注"),
        startAt,
        endAt,
        minutes: Math.max(1, Math.round((endAt - startAt) / 60000)),
        originalStartAt: block.startAt,
        originalEndAt: block.endAt,
        planDayKey: plan.dayKey,
        type: "planned-focus",
        planningMode: block.planningMode,
        sprintId: block.sprintId || "",
        color: "lavender",
        orphaned: !activeTaskIds.has(taskId),
      });
    });
  });

  return blocks.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt || a.id.localeCompare(b.id));
}

function createAdoptedDailyPlan(preview, adoptedAt) {
  const timestamp = Number(adoptedAt);
  const normalized = normalizeDailyPlanForDisplay(preview, dailyPlanDayKey(timestamp), false);
  if (!Number.isFinite(timestamp) || !hasDailyPlanContent(normalized)) return null;
  const completePlan = {
    ...normalized,
    adopted_at: timestamp,
  };
  if (completePlan.version !== 2) delete completePlan.mode;
  return typeof structuredClone === "function"
    ? structuredClone(completePlan)
    : JSON.parse(JSON.stringify(completePlan));
}

function appendDailyPlanEmpty(titleText, bodyText, className = "") {
  const empty = document.createElement("div");
  empty.className = `daily-plan-empty${className ? ` ${className}` : ""}`;
  const title = document.createElement("strong");
  const body = document.createElement("p");
  title.textContent = titleText;
  body.textContent = bodyText;
  empty.append(title, body);
  els.dailyPlanContent.append(empty);
}

function appendDailyPlanSummary(plan) {
  const summary = document.createElement("div");
  summary.className = "daily-plan-summary";
  const title = document.createElement("h3");
  const detail = document.createElement("p");
  const generatedAt = new Date(plan.generated_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  title.textContent = plan.priorities.length > 0
    ? `${plan.priorities.length} 个重点 · ${plan.blocks.length} 个建议时段`
    : "今天还没有待编排任务";
  detail.textContent = `建议单次专注 ${plan.focusTargetMinutes} 分钟 · 生成于 ${generatedAt}`;
  summary.append(title, detail);
  els.dailyPlanContent.append(summary);
}

function appendDailyPlanPriorities(priorities) {
  if (priorities.length === 0) return;
  const section = document.createElement("section");
  section.className = "daily-plan-section";
  const heading = document.createElement("h4");
  heading.textContent = "今日重点";
  const list = document.createElement("div");
  list.className = "daily-plan-priorities";
  priorities.slice(0, 3).forEach((priority) => {
    const item = document.createElement("article");
    item.className = "daily-plan-priority";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const reasons = document.createElement("small");
    const deadline = document.createElement("b");
    title.textContent = String(priority.title || "未命名任务");
    reasons.textContent = (priority.reasons || []).map(String).join(" · ") || "等待安排";
    deadline.textContent = priority.overdue
      ? "已逾期"
      : Number.isFinite(Number(priority.deadlineAt)) ? `${dailyPlanClock(priority.deadlineAt)} 截止` : "未设截止";
    copy.append(title, reasons);
    item.append(copy, deadline);
    list.append(item);
  });
  section.append(heading, list);
  els.dailyPlanContent.append(section);
}

function appendDailyPlanBlocks(blocks) {
  if (blocks.length === 0) return;
  const section = document.createElement("section");
  section.className = "daily-plan-section";
  const heading = document.createElement("h4");
  heading.textContent = "建议专注时段";
  const list = document.createElement("div");
  list.className = "daily-plan-blocks";
  blocks.slice(0, 3).forEach((block) => {
    const item = document.createElement("article");
    item.className = "daily-plan-block";
    const time = document.createElement("span");
    const title = document.createElement("strong");
    const duration = document.createElement("small");
    time.textContent = `${dailyPlanClock(block.startAt)}–${dailyPlanClock(block.endAt)}`;
    title.textContent = String(block.title || "专注时段");
    duration.textContent = `${Number(block.minutes) || 0} 分钟`;
    item.append(time, title, duration);
    list.append(item);
  });
  section.append(heading, list);
  els.dailyPlanContent.append(section);
}

function appendDailyPlanWarnings(warnings) {
  if (warnings.length === 0) return;
  const section = document.createElement("section");
  section.className = "daily-plan-section";
  const heading = document.createElement("h4");
  heading.textContent = `提醒（${warnings.length}）`;
  const list = document.createElement("ul");
  list.className = "daily-plan-warnings";
  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.className = "daily-plan-warning";
    const label = document.createElement("strong");
    const message = document.createElement("span");
    label.textContent = warning.severity === "error" ? "错误" : "提醒";
    message.textContent = String(warning.message || "需要检查当前安排");
    item.append(label, message);
    list.append(item);
  });
  section.append(heading, list);
  els.dailyPlanContent.append(section);
}

function renderDailyPlanPreview(now = Date.now()) {
  if (!els.dailyPlanCard || !els.dailyPlanContent || !els.dailyPlanGenerateButton) return;
  const todayKey = dailyPlanDayKey(now);
  const preview = normalizeDailyPlanForDisplay(dailyPlanPreview, null, false);
  const adoptedPlan = getAdoptedDailyPlan(todayKey);
  const displayPlan = preview || adoptedPlan;
  const hasValidPreview = hasDailyPlanContent(preview) && preview.dayKey === todayKey;
  const isBusy = dailyPlanGenerating || dailyPlanAdopting;
  els.dailyPlanCard.classList.toggle("is-loading", isBusy);
  els.dailyPlanCard.classList.toggle("is-error", Boolean(dailyPlanPreviewError || dailyPlanAdoptionError));
  els.dailyPlanCard.setAttribute("aria-busy", String(isBusy));
  els.dailyPlanGenerateButton.disabled = isBusy;
  els.dailyPlanGenerateButton.setAttribute("aria-disabled", String(isBusy));
  els.dailyPlanGenerateButton.textContent = displayPlan ? "重新编排" : "为我编排今天";
  if (els.dailyPlanAdoptButton) {
    els.dailyPlanAdoptButton.hidden = !hasValidPreview;
    els.dailyPlanAdoptButton.disabled = !hasValidPreview || isBusy || Boolean(dailyPlanPreviewError);
    els.dailyPlanAdoptButton.setAttribute("aria-disabled", String(els.dailyPlanAdoptButton.disabled));
    els.dailyPlanAdoptButton.textContent = dailyPlanAdopting ? "保存中…" : "采用到日程";
  }
  if (els.dailyPlanNextStage) {
    const showReplacement = hasValidPreview && Boolean(adoptedPlan);
    const showSaved = !preview && Boolean(adoptedPlan);
    els.dailyPlanNextStage.hidden = !(showReplacement || showSaved);
    els.dailyPlanNextStage.textContent = showReplacement
      ? "采用后将替换今天已保存的编排"
      : showSaved ? "今日编排已保存" : "";
  }
  els.dailyPlanContent.replaceChildren();

  if (dailyPlanPreviewNeedsRegeneration) {
    appendDailyPlanEmpty("需要重新编排", "原预览引用的任务已删除，请重新编排今天。", "daily-plan-warning-state");
  }

  if (dailyPlanAdoptionError) {
    els.dailyPlanStatus.textContent = "保存失败";
    appendDailyPlanEmpty("保存失败，请稍后重试", "当前预览仍保留在本机内存中。", "daily-plan-error");
  } else if (dailyPlanPreviewError) {
    els.dailyPlanStatus.textContent = "生成失败";
    appendDailyPlanEmpty("暂时无法完成编排", "本地编排遇到问题，请稍后重新编排。", "daily-plan-error");
  }
  if (!displayPlan) {
    if (dailyPlanAdoptionError || dailyPlanPreviewError) return;
    if (dailyPlanPreviewNeedsRegeneration) {
      els.dailyPlanStatus.textContent = "需要重新编排";
      return;
    }
    if (!dailyPlanAdoptionError && !dailyPlanPreviewError) {
      els.dailyPlanStatus.textContent = dailyPlanGenerating ? "编排中" : "尚未生成";
    }
    appendDailyPlanEmpty(
      dailyPlanGenerating ? "正在整理今天的安排…" : "把散落的一天，轻轻排成可以完成的样子。",
      dailyPlanGenerating ? "所有计算都在本机完成。" : "本地读取任务、课程、DDL 与近期专注节奏，生成三个重点和合适的专注时段。"
    );
    return;
  }

  if (!dailyPlanAdoptionError && !dailyPlanPreviewError) {
    els.dailyPlanStatus.textContent = dailyPlanAdopting
      ? "保存中"
      : dailyPlanGenerating ? "重新编排中" : preview ? "预览已生成" : "已采用";
  }
  appendDailyPlanSummary(displayPlan);
  appendDailyPlanPriorities(displayPlan.priorities.slice(0, 3));
  appendDailyPlanBlocks(displayPlan.blocks.slice(0, 3));
  if (displayPlan.priorities.length > 0 && displayPlan.blocks.length === 0) {
    appendDailyPlanEmpty("暂时没有可用时段", "当前空闲段不足 20 分钟，可以先调整固定安排后重新编排。", "daily-plan-no-slots");
  }
  appendDailyPlanWarnings(displayPlan.warnings);
}

async function generateDailyPlanPreview(now) {
  if (dailyPlanGenerating || dailyPlanAdopting) return false;
  dailyPlanGenerating = true;
  dailyPlanPreviewError = null;
  dailyPlanAdoptionError = null;
  dailyPlanPreviewNeedsRegeneration = false;
  renderDailyPlanPreview(now);
  try {
    await Promise.resolve();
    const planner = globalThis.DailyPlanner;
    if (!planner || typeof planner.buildDailyPlan !== "function") throw new Error("本地编排引擎未加载");
    const input = getDailyPlanPreviewInput(now);
    dailyPlanPreview = planner.buildDailyPlan(input);
    return true;
  } catch (error) {
    console.error("Daily plan preview failed:", error);
    dailyPlanPreviewError = error instanceof Error ? error.message : "本地编排失败";
    return false;
  } finally {
    dailyPlanGenerating = false;
    renderDailyPlanPreview(now);
  }
}

async function adoptDailyPlanPreview(adoptedAt) {
  const timestamp = Number(adoptedAt);
  const plan = createAdoptedDailyPlan(dailyPlanPreview, timestamp);
  if (dailyPlanAdopting || dailyPlanGenerating || dailyPlanPreviewError || !plan) return false;
  dailyPlanAdopting = true;
  dailyPlanAdoptionError = null;
  renderDailyPlanPreview(timestamp);
  await Promise.resolve();
  const dayKeyValue = plan.dayKey;
  const plans = state.dailyPlans;
  const hadPrevious = Object.prototype.hasOwnProperty.call(plans, dayKeyValue);
  const previousPlan = plans[dayKeyValue];
  const previousSyncUpdatedAt = state.syncUpdatedAt;
  try {
    state.dailyPlans[dayKeyValue] = plan;
    const result = saveState();
    if (result === false) throw new Error("saveState returned false");
    dailyPlanPreview = null;
    return true;
  } catch (error) {
    console.error("Daily plan adoption failed:", error);
    if (hadPrevious) state.dailyPlans[dayKeyValue] = previousPlan;
    else delete state.dailyPlans[dayKeyValue];
    state.syncUpdatedAt = previousSyncUpdatedAt;
    dailyPlanAdoptionError = "保存失败，请稍后重试";
    return false;
  } finally {
    dailyPlanAdopting = false;
    renderDailyPlanPreview(timestamp);
  }
}

function renderHome() {
  if (!els.homeTodayMinutes) return;
  renderDailyPlanMode();
  const now = new Date();
  const todayKey = dateKey(now);
  const todayTasks = getTodayOpenTasks();
  const openTasks = [...todayTasks, ...getUpcomingTasks(50)];
  const candidates = [
    ...openTasks.map((item) => ({ ...item, kind: "任务" })),
    ...(state.courses || [])
      .filter((item) => item.endAt >= Date.now())
      .map((item) => ({ ...item, kind: "课程" })),
  ].sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt);
  const next = candidates[0];
  els.homeDate.textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" })
    .format(now)
    .replace("日", "日 ");
  els.homeTodayMinutes.textContent = state.focusByDate[todayKey] || 0;
  els.homeStreakDays.textContent = getStreak();
  els.homeTaskCount.textContent = todayTasks.length;
  els.homeFlames.textContent = state.flames || 0;
  if (els.profileFlames) els.profileFlames.textContent = state.flames || 0;
  els.homeNextItem.textContent = "";
  if (!next) {
    const empty = document.createElement("div");
    empty.className = "home-empty";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const subtitle = document.createElement("span");
    title.textContent = "今天还留有一片空白";
    subtitle.textContent = "给自己安排一件小事，或者安静地专注一会儿。";
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = "添加任务";
    action.addEventListener("click", () => setActiveView("tasks"));
    copy.append(title, subtitle);
    empty.append(copy, action);
    els.homeNextItem.append(empty);
    return;
  }
  const card = document.createElement("button");
  card.type = "button";
  card.className = "home-next-event";
  const time = document.createElement("span");
  const content = document.createElement("span");
  const kind = document.createElement("small");
  const title = document.createElement("strong");
  const meta = document.createElement("small");
  time.textContent = formatClock(next.startAt);
  kind.textContent = next.kind;
  title.textContent = next.title;
  meta.textContent = `${formatMonthDay(next.startAt)} · ${formatDuration(next.startAt, next.endAt)}`;
  content.append(kind, title, meta);
  card.append(time, content);
  card.addEventListener("click", () => showEventDetail({ ...next, type: next.kind === "课程" ? "course" : "task" }));
  els.homeNextItem.append(card);
}

function getUsageStatsPlugin() {
  if (usageStatsPlugin) return usageStatsPlugin;
  const capacitor = window.Capacitor;
  if (!capacitor || (typeof capacitor.isNativePlatform === "function" && !capacitor.isNativePlatform())) return null;
  usageStatsPlugin = capacitor.Plugins?.UsageStats
    || capacitor.plugins?.UsageStats
    || (typeof capacitor.registerPlugin === "function" ? capacitor.registerPlugin("UsageStats") : null);
  return usageStatsPlugin;
}

function formatUsageMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  if (hours === 0) return `${rest}分钟`;
  if (rest === 0) return `${hours}小时`;
  return `${hours}时${rest}分`;
}

function usageColor(index) {
  return ["#668b6a", "#e7b95f", "#7ba4c7", "#c58aa6", "#8d83bd", "#a7b17b"][index % 6];
}

function renderUsageDay(date, minutes, apps) {
  selectedUsageDate = date;
  const isToday = date === dateKey();
  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(`${date}T00:00:00`));
  els.usageTodayMinutes.textContent = formatUsageMinutes(minutes);
  els.usageRing.querySelector("span").textContent = isToday ? "今日屏幕" : dateLabel;
  els.usageAppsTitle.textContent = isToday ? "今天用在哪里" : `${dateLabel} 用在哪里`;

  let cursor = 0;
  const segments = apps.slice(0, 6).map((app, index) => {
    const start = cursor;
    cursor = Math.min(100, cursor + Number(app.percent || 0));
    return `${usageColor(index)} ${start}% ${cursor}%`;
  });
  if (cursor < 100) segments.push(`var(--soft) ${cursor}% 100%`);
  els.usageRing.style.background = `conic-gradient(${segments.join(", ") || "var(--soft) 0 100%"})`;

  els.usageTrend.querySelectorAll("[data-usage-date]").forEach((item) => {
    item.classList.toggle("is-selected", item.dataset.usageDate === date);
  });
  els.usageAppList.textContent = "";
  if (apps.length === 0) {
    const empty = document.createElement("p");
    empty.className = "timeline-empty";
    empty.textContent = "这一天还没有可统计的应用使用记录。";
    els.usageAppList.append(empty);
    return;
  }
  apps.forEach((app, index) => {
    const row = document.createElement("article");
    const icon = document.createElement("span");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    const progress = document.createElement("i");
    const fill = document.createElement("b");
    icon.className = "usage-app-icon";
    icon.style.background = usageColor(index);
    icon.textContent = (app.label || "应用").slice(0, 1);
    title.textContent = app.label || app.packageName;
    meta.textContent = `${formatUsageMinutes(app.minutes)} · ${app.percent || 0}%`;
    fill.style.width = `${Math.max(2, Math.min(100, Number(app.percent || 0)))}%`;
    fill.style.background = usageColor(index);
    progress.append(fill);
    copy.append(title, meta, progress);
    row.append(icon, copy);
    els.usageAppList.append(row);
  });
}

async function selectUsageDate(date) {
  if (date === selectedUsageDate) return;
  const summary = usageOverviewData?.daily?.find((day) => day.date === date);
  try {
    const data = date === dateKey()
      ? { date, minutes: usageOverviewData.todayMinutes, apps: usageOverviewData.apps || [] }
      : await getUsageStatsPlugin().getDayStats({ date });
    renderUsageDay(date, data.minutes ?? summary?.minutes ?? 0, Array.isArray(data.apps) ? data.apps : []);
  } catch (error) {
    console.error("Usage day loading failed:", error);
    showReminderToast("读取失败", "这一天的应用使用情况暂时没有读到。");
  }
}

function renderUsageStats(data) {
  const granted = Boolean(data?.granted);
  els.usagePermissionCard.hidden = granted;
  els.usageDashboard.hidden = !granted;
  if (!granted) return;

  usageOverviewData = data;

  const today = Number(data.todayMinutes || 0);
  const yesterday = Number(data.yesterdayMinutes || 0);
  const change = Number(data.changeMinutes || 0);
  const apps = Array.isArray(data.apps) ? data.apps : [];
  const daily = Array.isArray(data.daily) ? data.daily : [];
  els.usageTodayMinutes.textContent = formatUsageMinutes(today);
  els.usageYesterdayText.textContent = `昨天 ${formatUsageMinutes(yesterday)}`;
  els.usageChangeText.textContent = change === 0 ? "和昨天持平" : change > 0 ? `多用 ${formatUsageMinutes(change)}` : `少用 ${formatUsageMinutes(Math.abs(change))}`;
  els.usageChangeText.classList.toggle("is-up", change > 0);
  els.usageChangeText.classList.toggle("is-down", change < 0);

  let cursor = 0;
  const segments = apps.slice(0, 6).map((app, index) => {
    const start = cursor;
    cursor = Math.min(100, cursor + Number(app.percent || 0));
    return `${usageColor(index)} ${start}% ${cursor}%`;
  });
  if (cursor < 100) segments.push(`var(--soft) ${cursor}% 100%`);
  els.usageRing.style.background = `conic-gradient(${segments.join(", ") || "var(--soft) 0 100%"})`;

  els.usageTrend.textContent = "";
  const maxMinutes = Math.max(1, ...daily.map((day) => Number(day.minutes || 0)));
  daily.forEach((day, index) => {
    const item = document.createElement("div");
    item.dataset.usageDate = day.date;
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    const value = document.createElement("span");
    const barTrack = document.createElement("i");
    const bar = document.createElement("b");
    const label = document.createElement("small");
    value.textContent = formatUsageMinutes(day.minutes);
    bar.style.height = `${Math.max(5, Number(day.minutes || 0) / maxMinutes * 100)}%`;
    barTrack.append(bar);
    const date = new Date(`${day.date}T00:00:00`);
    label.textContent = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    item.classList.toggle("is-today", index === daily.length - 1);
    item.classList.toggle("is-selected", index === daily.length - 1);
    item.addEventListener("click", () => selectUsageDate(day.date));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") selectUsageDate(day.date);
    });
    item.append(value, barTrack, label);
    els.usageTrend.append(item);
  });

  selectedUsageDate = daily.at(-1)?.date || dateKey();

  els.usageAppList.textContent = "";
  if (apps.length === 0) {
    const empty = document.createElement("p");
    empty.className = "timeline-empty";
    empty.textContent = "今天还没有可统计的应用使用记录。";
    els.usageAppList.append(empty);
    return;
  }
  apps.forEach((app, index) => {
    const row = document.createElement("article");
    const icon = document.createElement("span");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    const progress = document.createElement("i");
    const fill = document.createElement("b");
    icon.className = "usage-app-icon";
    icon.style.background = usageColor(index);
    icon.textContent = (app.label || "应").slice(0, 1);
    title.textContent = app.label || app.packageName;
    meta.textContent = `${formatUsageMinutes(app.minutes)} · ${app.percent || 0}%`;
    fill.style.width = `${Math.max(2, Math.min(100, Number(app.percent || 0)))}%`;
    fill.style.background = usageColor(index);
    progress.append(fill);
    copy.append(title, meta, progress);
    row.append(icon, copy);
    els.usageAppList.append(row);
  });
}

async function loadUsageStats() {
  const plugin = getUsageStatsPlugin();
  if (!plugin) {
    renderUsageStats({ granted: false });
    return;
  }
  try {
    const permission = await plugin.hasPermission();
    if (!permission.granted) {
      renderUsageStats({ granted: false });
      return;
    }
    renderUsageStats(await plugin.getStats({ days: 7 }));
  } catch (error) {
    console.error("Usage stats loading failed:", error);
    showReminderToast("屏幕使用数据读取失败", "请重新授予使用情况访问权限后再试。");
  }
}

async function requestUsageStatsPermission() {
  const plugin = getUsageStatsPlugin();
  if (!plugin) {
    showReminderToast("仅支持 Android", "应用使用时长需要安装 Android APK 后读取。");
    return;
  }
  await plugin.openSettings();
}

function setActiveView(viewName) {
  activeView = viewName;
  document.body.dataset.view = viewName;
  els.views.forEach((view) => view.classList.toggle("is-active", view.dataset.view === viewName));
  const primaryView = ["tasks", "timeline", "week", "ddl", "stats", "screenTime", "finance", "heatmap", "settings"].includes(viewName)
    ? "profile"
    : viewName;
  els.navButtons.forEach((button) => {
    if (!button.classList.contains("nav-button")) return;
    button.classList.toggle("is-active", button.dataset.viewTarget === primaryView);
  });
  if (viewName === "timeline") renderTimeline();
  if (viewName === "week") renderWeekSchedule();
  if (viewName === "ddl") renderDdl();
  if (viewName === "memo") renderMemos();
  if (viewName === "settings") renderThemes();
  if (viewName === "screenTime") loadUsageStats();
  if (viewName === "finance") refreshPaymentAccess();
  if (viewName === "home" || viewName === "profile") renderHome();
}

els.startPauseButton.addEventListener("click", () => state.isRunning ? pauseTimer() : startTimer());
els.dailyPlanGenerateButton.addEventListener("click", () => generateDailyPlanPreview(Date.now()));
els.dailyPlanAdoptButton.addEventListener("click", () => adoptDailyPlanPreview(Date.now()));
els.dailyPlanBalancedModeButton?.addEventListener("click", () => setDailyPlanMode("balanced", Date.now()));
els.dailyPlanSprintModeButton?.addEventListener("click", () => setDailyPlanMode("deadline-sprint", Date.now()));
els.deadlineSprintTaskSelect?.addEventListener("change", () => selectDeadlineSprintTask(els.deadlineSprintTaskSelect.value, Date.now()));
els.deadlineSprintGenerateButton?.addEventListener("click", () => generateDeadlineSprintPreview(Date.now()));
els.deadlineSprintAdoptButton?.addEventListener("click", () => adoptDeadlineSprintSelection(Date.now()));
els.resetButton.addEventListener("click", resetTimer);
els.fastFinishButton.addEventListener("click", fastFinishSession);
els.plant.addEventListener("click", toggleFlower);
els.clearDoneButton.addEventListener("click", clearDoneTasks);
els.notifyButton.addEventListener("click", requestNotifications);
els.testNotificationButton.addEventListener("click", testNativeNotification);
els.notificationSettingsButton.addEventListener("click", openSystemNotificationSettings);
els.usagePermissionButton.addEventListener("click", requestUsageStatsPermission);
els.usageRefreshButton.addEventListener("click", loadUsageStats);
els.financeAddButton.addEventListener("click", () => openFinanceEditor());
function cycleFinanceSummaryMode() {
  const modes = ["expense", "income", "saving"];
  financeSummaryMode = modes[(modes.indexOf(financeSummaryMode) + 1) % modes.length];
  selectedFinanceCategory = null;
  renderFinance();
}
els.financeTotalCard.addEventListener("click", cycleFinanceSummaryMode);
els.financeTotalCard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  cycleFinanceSummaryMode();
});
els.financeImportButton.addEventListener("click", () => els.financeImportInput.click());
els.financeImportInput.addEventListener("change", async (event) => {
  await importFinanceBill(event.target.files[0]);
  event.target.value = "";
});
els.financeRing.addEventListener("click", selectFinanceRingSegment);
els.financeRing.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key) || !financeRingSegments.length) return;
  event.preventDefault();
  const current = financeRingSegments.findIndex((item) => item.category === selectedFinanceCategory);
  selectFinanceCategory(financeRingSegments[(current + 1) % financeRingSegments.length].category);
});
els.financeCategoryDetailsClose.addEventListener("click", () => selectFinanceCategory(null));
els.financeEditorBackdrop.addEventListener("click", closeFinanceEditor);
els.financeEditorClose.addEventListener("click", closeFinanceEditor);
els.paymentAccessButton.addEventListener("click", requestPaymentAccess);
els.paymentTestButton.addEventListener("click", testPaymentDetection);
els.syncLoginButton.addEventListener("click", () => loginSyncAccount(false));
els.syncRegisterButton.addEventListener("click", () => loginSyncAccount(true));
els.syncNowButton.addEventListener("click", () => syncNow());
els.syncLogoutButton.addEventListener("click", logoutSyncAccount);
els.financeBudgetButton.addEventListener("click", () => {
  const value = prompt("设置每月预算（元）", state.monthlyBudget || "");
  if (value === null) return;
  const budget = Number(value);
  if (!Number.isFinite(budget) || budget < 0) return showReminderToast("预算格式不对", "请输入大于或等于 0 的金额。");
  state.monthlyBudget = budget;
  saveState();
  renderFinance();
});
els.financeTypeButtons.forEach((button) => button.addEventListener("click", () => {
  financeEntryType = button.dataset.financeType;
  els.financeTypeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  if (financeEntryType === "saving") els.financeCategory.value = "存钱";
  else if (els.financeCategory.value === "存钱") els.financeCategory.value = financeEntryType === "income" ? "收入" : "餐饮";
}));
els.financeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(els.financeAmount.value);
  const at = fromInputValue(els.financeDate.value);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(at)) return;
  const existing = state.transactions.find((item) => item.id === editingTransactionId);
  const transaction = {
    id: existing?.id || crypto.randomUUID(), type: financeEntryType, amount,
    category: financeEntryType === "income" ? "收入" : financeEntryType === "saving" ? "存钱" : els.financeCategory.value,
    note: els.financeNote.value.trim(), at,
    source: existing?.source || (pendingPaymentActive ? "notification" : "manual"),
    createdAt: existing?.createdAt || Date.now(),
  };
  state.transactions = existing ? state.transactions.map((item) => item.id === existing.id ? transaction : item) : [...state.transactions, transaction];
  saveState(); renderFinance(); closeFinanceEditor(); showReminderToast("已经记下", `${transaction.category} ${money(transaction.amount)}`);
});
els.financeDeleteButton.addEventListener("click", () => {
  if (!editingTransactionId || !confirm("删除这笔记录？")) return;
  state.transactions = state.transactions.filter((item) => item.id !== editingTransactionId);
  saveState(); renderFinance(); closeFinanceEditor();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && activeView === "screenTime") loadUsageStats();
  if (!document.hidden) refreshPaymentAccess();
  if (!document.hidden && syncSession?.user?.id) syncNow({ quiet: true });
});
els.taskReminderMode.addEventListener("change", renderReminderFields);
els.taskReminder.addEventListener("change", syncReminderAtFromRelative);
els.taskEnd.addEventListener("change", syncReminderAtFromRelative);
els.memoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.memoTitle.value.trim();
  if (!title) return;
  const tag = els.memoCustomTag.value.trim() || els.memoTag.value;
  if (editingMemoId) {
    updateMemo(editingMemoId, title, tag, els.memoBody.value.trim());
    cancelEditMemo();
  } else {
    addMemo(title, tag, els.memoBody.value.trim());
    els.memoTitle.value = "";
    els.memoCustomTag.value = "";
    els.memoBody.value = "";
  }
  hideMemoEditor();
});
els.memoCancelEditButton.addEventListener("click", cancelEditMemo);
els.memoDeleteButton.addEventListener("click", confirmDeleteEditingMemo);
els.memoAddOpenButton.addEventListener("click", openNewMemoEditor);
els.memoEditorBackdrop.addEventListener("click", cancelEditMemo);
els.memoEditorClose.addEventListener("click", cancelEditMemo);
els.memoSearch.addEventListener("input", () => {
  memoSearchQuery = els.memoSearch.value;
  renderMemos();
});
els.memoExportOpenButton.addEventListener("click", showMemoExportSheet);
els.memoExportBackdrop.addEventListener("click", hideMemoExportSheet);
els.memoExportClose.addEventListener("click", hideMemoExportSheet);
els.memoExportSelectAll.addEventListener("click", () => {
  memoExportIds = new Set(getMemoExportCandidates().map((memo) => memo.id));
  renderMemoExportSheet();
});
els.memoExportDownload.addEventListener("click", exportSelectedMemos);
els.memoExportJson.addEventListener("click", exportSelectedMemosJson);
els.importIcsButton.addEventListener("click", () => els.icsFileInput.click());
els.eventSheetBackdrop.addEventListener("click", hideEventDetail);
els.eventSheetClose.addEventListener("click", hideEventDetail);
els.eventSheetDeleteButton.addEventListener("click", confirmDeleteEventTask);
els.skinPreviewBackdrop.addEventListener("click", hideSkinPreview);
els.skinPreviewClose.addEventListener("click", hideSkinPreview);
els.completeSheetBackdrop.addEventListener("click", hideCompletionSheet);
els.completeCloseButton.addEventListener("click", hideCompletionSheet);
els.heatmapImageButton.addEventListener("click", () => els.heatmapImageInput.click());
els.heatmapImageResetButton.addEventListener("click", resetHeatmapImage);
els.heatmapImageInput.addEventListener("change", (event) => {
  importHeatmapImage(event.target.files[0]);
  event.target.value = "";
});
els.quoteImportButton.addEventListener("click", () => els.quoteImportInput.click());
els.quoteImportInput.addEventListener("change", (event) => {
  importQuoteFile(event.target.files[0]);
  event.target.value = "";
});
els.backupExportButton.addEventListener("click", exportBackup);
els.backupImportButton.addEventListener("click", chooseAndImportBackup);
els.backupImportInput.addEventListener("change", (event) => {
  importBackupFile(event.target.files[0]);
  event.target.value = "";
});
els.feedMemoToggle.addEventListener("change", () => {
  state.feedSources.memos = els.feedMemoToggle.checked;
  saveState();
  renderFocusFeed();
});
els.feedTaskToggle.addEventListener("change", () => {
  state.feedSources.tasks = els.feedTaskToggle.checked;
  saveState();
  renderFocusFeed();
});
els.feedQuoteToggle.addEventListener("change", () => {
  state.feedSources.quotes = els.feedQuoteToggle.checked;
  saveState();
  renderFocusFeed();
});
els.icsFileInput.addEventListener("change", (event) => {
  importScheduleFile(event.target.files[0]);
  event.target.value = "";
});
els.prevWeekButton.addEventListener("click", () => {
  shiftWeekSchedule(-1);
});
els.nextWeekButton.addEventListener("click", () => {
  shiftWeekSchedule(1);
});

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
});

els.heatmapPalette.addEventListener("change", (event) => {
  state.heatmapPalette = event.target.value;
  saveState();
  renderHeatmap();
});

els.chipButtons.forEach((button) => {
  button.addEventListener("click", () => setTimerMinutes(Number(button.dataset.minutes)));
});

els.minuteRange.addEventListener("input", (event) => setTimerMinutes(event.target.value));

let timelineTouchStartX = null;
function shiftTimelineWeek(direction) {
  const date = new Date(`${selectedTimelineDate}T00:00:00`);
  date.setDate(date.getDate() + direction * 7);
  selectedTimelineDate = dateKey(date);
  renderTimeline();
}

function shiftWeekSchedule(direction) {
  const date = new Date(`${selectedWeekDate}T00:00:00`);
  date.setDate(date.getDate() + direction * 7);
  selectedWeekDate = dateKey(date);
  renderWeekSchedule();
}

function shiftStatsWeek(direction) {
  const date = new Date(`${selectedStatsWeekDate}T00:00:00`);
  date.setDate(date.getDate() + direction * 7);
  selectedStatsWeekDate = dateKey(date);
  renderWeekChart();
}

els.weekStrip.addEventListener("touchstart", (event) => {
  timelineTouchStartX = event.touches[0].clientX;
}, { passive: true });
els.weekStrip.addEventListener("touchend", (event) => {
  if (timelineTouchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - timelineTouchStartX;
  timelineTouchStartX = null;
  if (Math.abs(deltaX) < 48) return;
  shiftTimelineWeek(deltaX < 0 ? 1 : -1);
}, { passive: true });

let weekTouchStartX = null;
els.weekBoard.addEventListener("touchstart", (event) => {
  weekTouchStartX = event.touches[0].clientX;
}, { passive: true });
els.weekBoard.addEventListener("touchend", (event) => {
  if (weekTouchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - weekTouchStartX;
  weekTouchStartX = null;
  if (Math.abs(deltaX) < 48) return;
  shiftWeekSchedule(deltaX < 0 ? 1 : -1);
}, { passive: true });

let statsTouchStartX = null;
els.weekChart.addEventListener("touchstart", (event) => {
  statsTouchStartX = event.touches[0].clientX;
}, { passive: true });
els.weekChart.addEventListener("touchend", (event) => {
  if (statsTouchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - statsTouchStartX;
  statsTouchStartX = null;
  if (Math.abs(deltaX) < 48) return;
  shiftStatsWeek(deltaX < 0 ? 1 : -1);
}, { passive: true });

els.timerDial.addEventListener("pointerdown", (event) => {
  if (state.isRunning) return;
  els.timerDial.setPointerCapture(event.pointerId);
  setMinutesFromPointer(event);
});

els.timerDial.addEventListener("pointermove", (event) => {
  if (els.timerDial.hasPointerCapture(event.pointerId)) setMinutesFromPointer(event);
});

els.timerDial.addEventListener("keydown", (event) => {
  if (state.isRunning) return;
  if (event.key === "ArrowUp" || event.key === "ArrowRight") {
    event.preventDefault();
    setTimerMinutes(state.selectedMinutes + 5);
  }
  if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
    event.preventDefault();
    setTimerMinutes(state.selectedMinutes - 5);
  }
});

els.chick.addEventListener("click", playChickJump);
els.chick.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    playChickJump();
  }
});
els.clouds.forEach((cloud) => cloud.addEventListener("click", () => scatterCloud(cloud)));
els.sunButton.addEventListener("click", toggleWeather);

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.taskTitle.value.trim();
  const startAt = fromInputValue(els.taskStart.value);
  const endAt = fromInputValue(els.taskEnd.value);
  const reminderMode = els.taskReminderMode.value;
  const reminderAt = reminderMode === "absolute" ? fromInputValue(els.taskReminderAt.value) : null;
  const reminder = Number(els.taskReminder.value);

  if (!title || !Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    els.timerNote.textContent = "任务需要标题，而且结束时间要晚于开始时间。";
    return;
  }
  if (reminderMode === "absolute" && (!Number.isFinite(reminderAt) || reminderAt > endAt)) {
    els.timerNote.textContent = "指定提醒时间需要早于任务结束时间。";
    return;
  }

  addTask(title, startAt, endAt, reminderMode, reminder, reminderAt, state.selectedTaskColor);
  els.taskTitle.value = "";
  setDefaultTaskTimes();
  els.taskTitle.focus();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

setDefaultTaskTimes();
setChickPosition(64);
setWeather(state.weather || WEATHER_STATES[Math.floor(Math.random() * WEATHER_STATES.length)]);
applySkin();
applyFlower();
applyTheme();
render();
renderSyncAccount();
setActiveView(activeView);
initializeNativeNotifications().catch((error) => console.error("Native notification initialization failed:", error));
refreshPaymentAccess().catch((error) => console.error("Payment detection initialization failed:", error));
if (syncSession?.user?.id) syncNow({ quiet: true });
scheduleLoop(moveChickRandomly, 2600, 3600);
scheduleLoop(() => els.clouds.forEach(driftCloud), 2800, 3600);
scheduleLoop(randomizeWeather, 18000, 22000);
scheduleLoop(playWind, 6000, 9000);
scheduleLoop(spawnSeed, 2800, 4200);
scheduleLoop(nibbleGrass, 5200, 6800);
scheduleLoop(nextFocusFeed, 7000, 4000);
window.setInterval(() => {
  checkReminders();
  renderTasks();
}, 30000);
