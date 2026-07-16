package com.zijian.focus;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Process;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@CapacitorPlugin(name = "UsageStats")
public class UsageStatsPlugin extends Plugin {
    private static final long MINUTE_MS = 60_000L;

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasUsagePermission());
        call.resolve(result);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getStats(PluginCall call) {
        if (!hasUsagePermission()) {
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
            return;
        }

        int days = Math.max(2, Math.min(14, call.getInt("days", 7)));
        Calendar todayStart = Calendar.getInstance();
        todayStart.set(Calendar.HOUR_OF_DAY, 0);
        todayStart.set(Calendar.MINUTE, 0);
        todayStart.set(Calendar.SECOND, 0);
        todayStart.set(Calendar.MILLISECOND, 0);

        List<JSObject> dailyItems = new ArrayList<>();
        Map<String, Long> todayPackages = new HashMap<>();
        long todayTotal = 0L;
        long yesterdayTotal = 0L;
        SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.CHINA);

        for (int offset = days - 1; offset >= 0; offset--) {
            Calendar start = (Calendar) todayStart.clone();
            start.add(Calendar.DAY_OF_YEAR, -offset);
            Calendar end = (Calendar) start.clone();
            end.add(Calendar.DAY_OF_YEAR, 1);
            if (offset == 0) end.setTimeInMillis(System.currentTimeMillis());

            Map<String, Long> packageTimes = queryPackageTimes(start.getTimeInMillis(), end.getTimeInMillis());
            long total = sumUsage(packageTimes);
            JSObject day = new JSObject();
            day.put("date", dayFormat.format(new Date(start.getTimeInMillis())));
            day.put("minutes", Math.round((double) total / MINUTE_MS));
            dailyItems.add(day);

            if (offset == 0) {
                todayTotal = total;
                todayPackages = packageTimes;
            } else if (offset == 1) {
                yesterdayTotal = total;
            }
        }

        List<Map.Entry<String, Long>> ranked = new ArrayList<>(todayPackages.entrySet());
        ranked.removeIf(entry -> entry.getValue() < MINUTE_MS || entry.getKey().equals(getContext().getPackageName()));
        ranked.sort((left, right) -> Long.compare(right.getValue(), left.getValue()));

        JSArray apps = new JSArray();
        long visibleTotal = Math.max(1L, todayTotal);
        for (int index = 0; index < Math.min(12, ranked.size()); index++) {
            Map.Entry<String, Long> entry = ranked.get(index);
            JSObject app = new JSObject();
            app.put("packageName", entry.getKey());
            app.put("label", getAppLabel(entry.getKey()));
            app.put("minutes", Math.round((double) entry.getValue() / MINUTE_MS));
            app.put("percent", Math.round(entry.getValue() * 100.0 / visibleTotal));
            apps.put(app);
        }

        JSArray daily = new JSArray();
        for (JSObject item : dailyItems) daily.put(item);

        JSObject result = new JSObject();
        result.put("granted", true);
        result.put("todayMinutes", Math.round((double) todayTotal / MINUTE_MS));
        result.put("yesterdayMinutes", Math.round((double) yesterdayTotal / MINUTE_MS));
        result.put("changeMinutes", Math.round((double) (todayTotal - yesterdayTotal) / MINUTE_MS));
        result.put("daily", daily);
        result.put("apps", apps);
        call.resolve(result);
    }

    @PluginMethod
    public void getDayStats(PluginCall call) {
        if (!hasUsagePermission()) {
            call.reject("Usage access is not granted");
            return;
        }

        String date = call.getString("date");
        if (date == null || !date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            call.reject("A valid date is required");
            return;
        }

        try {
            SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.CHINA);
            dayFormat.setLenient(false);
            Date parsed = dayFormat.parse(date);
            Calendar start = Calendar.getInstance();
            start.setTime(parsed);
            start.set(Calendar.HOUR_OF_DAY, 0);
            start.set(Calendar.MINUTE, 0);
            start.set(Calendar.SECOND, 0);
            start.set(Calendar.MILLISECOND, 0);
            Calendar end = (Calendar) start.clone();
            end.add(Calendar.DAY_OF_YEAR, 1);
            end.setTimeInMillis(Math.min(end.getTimeInMillis(), System.currentTimeMillis()));

            Map<String, Long> packageTimes = queryPackageTimes(start.getTimeInMillis(), end.getTimeInMillis());
            long total = sumUsage(packageTimes);
            JSObject result = new JSObject();
            result.put("date", date);
            result.put("minutes", Math.round((double) total / MINUTE_MS));
            result.put("apps", buildRankedApps(packageTimes, total));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read usage for this date", error);
        }
    }

    private JSArray buildRankedApps(Map<String, Long> packageTimes, long total) {
        List<Map.Entry<String, Long>> ranked = new ArrayList<>(packageTimes.entrySet());
        ranked.removeIf(entry -> entry.getValue() < MINUTE_MS || entry.getKey().equals(getContext().getPackageName()));
        ranked.sort((left, right) -> Long.compare(right.getValue(), left.getValue()));
        JSArray apps = new JSArray();
        long visibleTotal = Math.max(1L, total);
        for (int index = 0; index < Math.min(12, ranked.size()); index++) {
            Map.Entry<String, Long> entry = ranked.get(index);
            JSObject app = new JSObject();
            app.put("packageName", entry.getKey());
            app.put("label", getAppLabel(entry.getKey()));
            app.put("minutes", Math.round((double) entry.getValue() / MINUTE_MS));
            app.put("percent", Math.round(entry.getValue() * 100.0 / visibleTotal));
            apps.put(app);
        }
        return apps;
    }

    private boolean hasUsagePermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getContext().getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private Map<String, Long> queryPackageTimes(long start, long end) {
        UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        List<UsageStats> stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end);
        Map<String, Long> totals = new HashMap<>();
        if (stats == null) return totals;
        for (UsageStats usage : stats) {
            long duration = usage.getTotalTimeInForeground();
            if (duration > 0) totals.merge(usage.getPackageName(), duration, Long::sum);
        }
        return totals;
    }

    private long sumUsage(Map<String, Long> packageTimes) {
        long total = 0L;
        for (Map.Entry<String, Long> entry : packageTimes.entrySet()) {
            if (!entry.getKey().equals(getContext().getPackageName())) total += entry.getValue();
        }
        return total;
    }

    private String getAppLabel(String packageName) {
        try {
            PackageManager packageManager = getContext().getPackageManager();
            ApplicationInfo info = packageManager.getApplicationInfo(packageName, 0);
            return packageManager.getApplicationLabel(info).toString();
        } catch (Exception ignored) {
            String[] parts = packageName.split("\\.");
            String fallback = parts.length == 0 ? packageName : parts[parts.length - 1];
            if (fallback.isEmpty()) return packageName;
            return fallback.substring(0, 1).toUpperCase(Locale.ROOT) + fallback.substring(1);
        }
    }
}
