package com.opinionrewards;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.google.gson.Gson;
import com.opinionrewards.db.AppDatabase;
import com.opinionrewards.db.NotificationDao;
import com.opinionrewards.db.NotificationEntity;
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
    private static final String BATCH_URL = "http://192.168.1.36:8000/api/notifications/batch"; // Changed for physical device

    public UploadWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        NotificationDao dao = AppDatabase.getDatabase(getApplicationContext()).notificationDao();
        List<NotificationEntity> pending = dao.getPendingNotifications();
        if (pending.isEmpty()) return Result.success();

        List<String> ids = new ArrayList<>();
        for (NotificationEntity entity : pending) ids.add(entity.id);
        dao.updateStatuses(ids, "UPLOADING");

        try {
            String jsonPayload = gson.toJson(pending);
            RequestBody body = RequestBody.create(jsonPayload, MediaType.parse("application/json; charset=utf-8"));

            Request request = new Request.Builder().url(BATCH_URL).post(body).build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    dao.updateStatuses(ids, "UPLOADED");
                    dao.deleteUploaded();
                    return Result.success();
                } else {
                    dao.updateStatuses(ids, "FAILED");
                    return Result.retry();
                }
            }
        } catch (IOException e) {
            dao.updateStatuses(ids, "FAILED");
            return Result.retry();
        }
    }
}
