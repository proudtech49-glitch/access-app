package com.yourapp.notificationreader;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.google.gson.Gson;
import com.yourapp.notificationreader.db.AppDatabase;
import com.yourapp.notificationreader.db.NotificationDao;
import com.yourapp.notificationreader.db.NotificationEntity;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class UploadWorker extends Worker {

    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();
    private static final String SURVEY_URL = "https://your-production-server.com/api/notifications/batch";

    public UploadWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        NotificationDao dao = AppDatabase.getDatabase(getApplicationContext()).notificationDao();
        
        // 1. Fetch pending notifications (Batch limit 100)
        List<NotificationEntity> pending = dao.getPendingNotifications();
        if (pending.isEmpty()) {
            return Result.success();
        }

        // 2. Extract IDs and update status to UPLOADING
        List<String> ids = new ArrayList<>();
        for (NotificationEntity entity : pending) {
            ids.add(entity.id);
        }
        dao.updateStatuses(ids, "UPLOADING");

        // 3. Attempt Batch Upload
        try {
            String jsonPayload = gson.toJson(pending);
            RequestBody body = RequestBody.create(jsonPayload, MediaType.parse("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(SURVEY_URL)
                    .post(body)
                    // Note: You can add gzip headers here for compression as suggested
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    // 4. Success: Mark as UPLOADED and cleanup
                    dao.updateStatuses(ids, "UPLOADED");
                    dao.deleteUploaded();
                    return Result.success();
                } else {
                    // Server error (e.g., 500)
                    dao.updateStatuses(ids, "FAILED");
                    return Result.retry();
                }
            }
        } catch (IOException e) {
            // Network failure
            dao.updateStatuses(ids, "FAILED");
            return Result.retry();
        }
    }
}
