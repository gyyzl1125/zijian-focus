package com.zijian.focus;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.media.RingtoneManager;
import androidx.activity.result.ActivityResult;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

@CapacitorPlugin(name = "SystemBridge")
public class SystemBridgePlugin extends Plugin {
    private static final int MAX_BACKUP_BYTES = 10 * 1024 * 1024;
    private static final String REMINDER_CHANNEL_ID = "zijian-task-reminders-v3";

    @PluginMethod
    public void ensureReminderChannel(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getContext().getSystemService(NotificationManager.class);
            NotificationChannel channel = new NotificationChannel(
                REMINDER_CHANNEL_ID,
                "任务与 DDL 提醒",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("在任务或 DDL 到期前显示系统横幅提醒");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), attributes);
            manager.createNotificationChannel(channel);
        }
        call.resolve();
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void hasPaymentNotificationAccess(PluginCall call) {
        boolean granted = NotificationManagerCompat.getEnabledListenerPackages(getContext())
            .contains(getContext().getPackageName());
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void openPaymentNotificationAccess(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getPendingPayment(PluginCall call) {
        String raw = getContext().getSharedPreferences("zijian_payment_detection", 0).getString("pending", "");
        JSObject result = new JSObject();
        if (!raw.isEmpty()) {
            try { result.put("payment", new JSObject(raw)); } catch (Exception ignored) {}
        }
        call.resolve(result);
    }

    @PluginMethod
    public void clearPendingPayment(PluginCall call) {
        getContext().getSharedPreferences("zijian_payment_detection", 0).edit().remove("pending").apply();
        call.resolve();
    }

    @PluginMethod
    public void testPaymentDetection(PluginCall call) {
        try {
            long now = System.currentTimeMillis();
            JSONObject payment = new JSONObject();
            payment.put("amount", 12.34);
            payment.put("at", now);
            payment.put("type", "expense");
            payment.put("category", "餐饮");
            payment.put("note", "模拟付款测试");
            getContext().getSharedPreferences("zijian_payment_detection", 0).edit().putString("pending", payment.toString()).apply();
            String channelId = "zijian-payment-detection-v1";
            NotificationManager manager = (NotificationManager) getContext().getSystemService(NotificationManager.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(channelId, "付款记账确认", NotificationManager.IMPORTANCE_HIGH);
                channel.enableVibration(true);
                channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
                manager.createNotificationChannel(channel);
            }
            Intent intent = new Intent(getContext(), MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(getContext(), 702, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification notification = new NotificationCompat.Builder(getContext(), channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("模拟付款检测成功")
                .setContentText("¥12.34，点此编辑金额和用途")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build();
            manager.notify(770002, notification);
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not create payment test", error);
        }
    }

    @PluginMethod
    public void pickBackup(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/json", "text/json", "text/plain", "application/octet-stream" });
        startActivityForResult(call, intent, "backupPicked");
    }

    @ActivityCallback
    private void backupPicked(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("No backup file selected");
            return;
        }
        Uri uri = result.getData().getData();
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("Could not open selected file");
            byte[] buffer = new byte[8192];
            int total = 0;
            int count;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > MAX_BACKUP_BYTES) throw new IllegalStateException("Backup is larger than 10 MB");
                output.write(buffer, 0, count);
            }
            JSObject response = new JSObject();
            response.put("content", output.toString(StandardCharsets.UTF_8.name()));
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not read selected backup", error);
        }
    }
}
