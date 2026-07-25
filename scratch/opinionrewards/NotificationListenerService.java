package com.opinionrewards;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.opinionrewards.db.AppDatabase;
import com.opinionrewards.db.NotificationEntity;
import java.util.concurrent.Executors;

public class NotificationListenerService extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        // Extract notification data
        NotificationEntity entity = new NotificationEntity();
        entity.id = sbn.getPackageName() + "_" + sbn.getPostTime() + "_" + sbn.getId();
        entity.packageName = sbn.getPackageName();
        entity.postTime = sbn.getPostTime();

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
                .setRequiresBatteryNotLow(true)           // Elite battery awareness
                .build();

        OneTimeWorkRequest uploadWorkRequest = new OneTimeWorkRequest.Builder(UploadWorker.class)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(getApplicationContext()).enqueue(uploadWorkRequest);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Optional: Log removals if needed for advanced tracking
    }
}