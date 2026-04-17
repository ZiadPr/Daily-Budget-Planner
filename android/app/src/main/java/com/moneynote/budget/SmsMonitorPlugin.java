package com.moneynote.budget;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.lang.ref.WeakReference;
import java.util.Locale;
import org.json.JSONException;

@CapacitorPlugin(
    name = "SmsMonitor",
    permissions = {
        @Permission(strings = { Manifest.permission.RECEIVE_SMS }, alias = "sms")
    }
)
public class SmsMonitorPlugin extends Plugin {

    private static final String PREFERENCES_NAME = "money_note_sms_monitor";
    private static final String KEY_PENDING_EVENT = "pending_event";
    private static WeakReference<SmsMonitorPlugin> activeInstance = new WeakReference<>(null);

    @Override
    public void load() {
        super.load();
        activeInstance = new WeakReference<>(this);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("sms", getPermissionState("sms").toString().toLowerCase(Locale.US));
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            checkPermissions(call);
            return;
        }

        requestPermissionForAlias("sms", call, "smsPermissionsCallback");
    }

    @PluginMethod
    public void getPendingSmsEvent(PluginCall call) {
        JSObject result = new JSObject();
        result.put("event", consumePendingEvent(getContext()));
        call.resolve(result);
    }

    @PermissionCallback
    private void smsPermissionsCallback(PluginCall call) {
        checkPermissions(call);
    }

    static void publishSmsEvent(Context context, JSObject event) {
        storePendingEvent(context, event);

        SmsMonitorPlugin plugin = activeInstance.get();
        if (plugin != null) {
            plugin.notifyListeners("smsReceived", event, true);
            clearPendingEvent(context);
        }
    }

    private static void storePendingEvent(Context context, JSObject event) {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PENDING_EVENT, event.toString()).apply();
    }

    private static JSObject consumePendingEvent(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        String rawEvent = prefs.getString(KEY_PENDING_EVENT, null);
        if (rawEvent == null || rawEvent.isEmpty()) {
            return null;
        }

        prefs.edit().remove(KEY_PENDING_EVENT).apply();

        try {
            return new JSObject(rawEvent);
        } catch (JSONException ignored) {
            return null;
        }
    }

    private static void clearPendingEvent(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_PENDING_EVENT).apply();
    }
}
