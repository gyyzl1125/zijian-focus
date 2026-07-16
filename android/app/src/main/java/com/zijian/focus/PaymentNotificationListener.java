package com.zijian.focus;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

public class PaymentNotificationListener extends NotificationListenerService {
    private static final String CHANNEL_ID = "zijian-payment-detection-v1";
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?:¥|￥|RMB|人民币)\\s*(\\d{1,7}(?:\\.\\d{1,2})?)|(\\d{1,7}(?:\\.\\d{1,2})?)\\s*元");
    private static final String[] PAYMENT_WORDS = { "支付成功", "付款成功", "消费", "扣款", "已支付", "付款金额", "交易成功" };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        if (!("com.tencent.mm".equals(packageName) || "com.eg.android.AlipayGphone".equals(packageName))) return;
        Notification notification = sbn.getNotification();
        if (notification == null) return;
        Bundle extras = notification.extras;
        String title = String.valueOf(extras.getCharSequence(Notification.EXTRA_TITLE, ""));
        String text = String.valueOf(extras.getCharSequence(Notification.EXTRA_TEXT, ""));
        String combined = title + " " + text;
        boolean isPayment = false;
        for (String word : PAYMENT_WORDS) if (combined.contains(word)) { isPayment = true; break; }
        if (!isPayment) return;
        Matcher matcher = AMOUNT_PATTERN.matcher(combined);
        if (!matcher.find()) return;
        double amount;
        try { amount = Double.parseDouble(matcher.group(1) != null ? matcher.group(1) : matcher.group(2)); } catch (Exception ignored) { return; }
        if (amount <= 0) return;
        long now = System.currentTimeMillis();
        String fingerprint = packageName + ":" + combined;
        android.content.SharedPreferences prefs = getSharedPreferences("zijian_payment_detection", 0);
        if (fingerprint.equals(prefs.getString("last_fingerprint", "")) && now - prefs.getLong("last_at", 0) < 120_000L) return;
        try {
            JSONObject payment = new JSONObject();
            payment.put("amount", amount);
            payment.put("at", now);
            payment.put("type", "expense");
            payment.put("category", "其他");
            payment.put("note", packageName.equals("com.tencent.mm") ? "微信付款" : "支付宝付款");
            prefs.edit().putString("pending", payment.toString()).putString("last_fingerprint", fingerprint).putLong("last_at", now).apply();
        } catch (Exception ignored) { return; }
        postConfirmation(amount);
    }

    private void postConfirmation(double amount) {
        NotificationManager manager = (NotificationManager) getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "付款记账确认", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("检测到付款通知后提醒确认记账");
            channel.enableVibration(true);
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
            manager.createNotificationChannel(channel);
        }
        Intent intent = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 701, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("检测到一笔付款")
            .setContentText(String.format("¥%.2f，点此确认金额和用途", amount))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build();
        manager.notify(770001, notification);
    }
}
