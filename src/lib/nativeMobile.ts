import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function prepareNativeAppShell(isDarkMode: boolean) {
  document.documentElement.dataset.platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
  document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide();
  } catch {}

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: isDarkMode ? '#0a0f1e' : '#f8fafc' });
    await StatusBar.setStyle({ style: isDarkMode ? Style.Light : Style.Dark });
  } catch {}

  try {
    await LocalNotifications.createChannel({
      id: 'sms-insights',
      name: 'Money Note Alerts',
      description: 'Transaction confirmations and message analysis',
      importance: 5,
      visibility: 1,
    });
  } catch {}
}

export async function requestNotificationPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return { display: 'granted' as const };
  }

  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') {
    return current;
  }

  return LocalNotifications.requestPermissions();
}
