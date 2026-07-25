package com.opinionrewards.db;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "notifications")
public class NotificationEntity {
    @PrimaryKey
    @NonNull
    public String id = ""; // Combination of packageName + postTime + notifId
    public String packageName;
    public long postTime;
    public String title;
    public String text;
    public String status; // PENDING, UPLOADING, UPLOADED
    public String deviceId;
}
