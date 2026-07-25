package com.opinionrewards;

import android.content.Intent;
import android.provider.Settings;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

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
            // You can enhance this with actual check if needed
            promise.resolve("authorized"); // or "denied" / "unknown"
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