# Money Note

Money Note is a mobile-first budget planner with:

- Native-style home, transactions, gam3eya, analytics, and settings screens
- PIN lock, biometric unlock, privacy mode, fake balance mode, and auto-lock
- SMS transaction parsing with fraud/trust classification
- Capacitor Android setup ready inside `android/`

## Web development

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`
3. Type-check:
   `npm run lint`
4. Build production assets:
   `npm run build`

## Android workflow

1. Sync the latest web build into the native project:
   `npm run android:sync`
2. Open the Android project in Android Studio:
   `npm run android:open`

The Android project includes:

- Capacitor 8 core/runtime
- `@capacitor/app`
- `@capacitor/local-notifications`
- `@capacitor/status-bar`
- `@capacitor/splash-screen`
- A native `SmsBroadcastReceiver` and `SmsMonitor` Capacitor plugin for incoming SMS alerts

## Notes

- Automatic SMS receiving works in the Capacitor Android build after granting SMS and notification permissions.
- Browser mode still supports manual paste/clipboard parsing for testing.
- Native Android builds need Android Studio, the Android SDK, and a valid `local.properties` SDK path on the machine that runs Gradle.
