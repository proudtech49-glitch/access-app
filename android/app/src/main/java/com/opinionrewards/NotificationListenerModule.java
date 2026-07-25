package com.opinionrewards;

import android.content.Intent;
import android.provider.Settings;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import androidx.core.app.NotificationManagerCompat;
import java.util.Set;

public class NotificationListenerModule extends ReactContextBaseJavaModule {

    public NotificationListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NotificationListenerModule";
    }

    /**
     * Checks current notification listener permission status
     */
    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        try {
            Set<String> enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(getReactApplicationContext());
            boolean isGranted = enabledListeners.contains(getReactApplicationContext().getPackageName());
            promise.resolve(isGranted);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Opens Android Notification Listener Settings
     */
    @ReactMethod
    public void requestPermission() {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (getCurrentActivity() != null) {
                getCurrentActivity().startActivity(intent);
            }
        } catch (Exception e) {
            // Silent fail - user can open manually
        }
    }
}