package com.moneynote.budget;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;

@CapacitorPlugin(name = "DeviceSecurity")
public class DeviceSecurityPlugin extends Plugin {

    private int getAllowedAuthenticators() {
        return BiometricManager.Authenticators.BIOMETRIC_WEAK
            | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
    }

    @PluginMethod
    public void isBiometricAvailable(PluginCall call) {
        BiometricManager manager = BiometricManager.from(getContext());
        int result = manager.canAuthenticate(getAllowedAuthenticators());
        JSObject response = new JSObject();
        response.put("available", result == BiometricManager.BIOMETRIC_SUCCESS);
        call.resolve(response);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (!(getActivity() instanceof FragmentActivity)) {
            call.reject("Biometric activity is unavailable.");
            return;
        }

        BiometricManager manager = BiometricManager.from(getContext());
        if (manager.canAuthenticate(getAllowedAuthenticators()) != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject("Biometric authentication is not available on this device.");
            return;
        }

        FragmentActivity activity = (FragmentActivity) getActivity();
        Executor executor = ContextCompat.getMainExecutor(activity);
        String title = call.getString("title", "Biometric verification");
        String subtitle = call.getString("subtitle", "");
        String reason = call.getString("reason", "Confirm your identity");

        saveCall(call);

        activity.runOnUiThread(() -> {
            BiometricPrompt biometricPrompt = new BiometricPrompt(
                activity,
                executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        JSObject response = new JSObject();
                        response.put("success", true);
                        call.resolve(response);
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        call.reject(errString.toString());
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        // Keep the prompt open until the user succeeds or cancels.
                    }
                }
            );

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setDescription(reason)
                .setAllowedAuthenticators(getAllowedAuthenticators())
                .build();

            biometricPrompt.authenticate(promptInfo);
        });
    }
}
