package com.opinionrewards.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface NotificationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(NotificationEntity notification);

    @Query("SELECT * FROM notifications WHERE status = 'PENDING' OR status = 'FAILED' LIMIT 100")
    List<NotificationEntity> getPendingNotifications();

    @Query("UPDATE notifications SET status = :status WHERE id IN (:ids)")
    void updateStatuses(List<String> ids, String status);

    @Query("DELETE FROM notifications WHERE status = 'UPLOADED'")
    void deleteUploaded();
}
