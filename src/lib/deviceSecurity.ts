import { Capacitor, registerPlugin } from '@capacitor/core';

interface DeviceSecurityPlugin {
  isBiometricAvailable(): Promise<{ available: boolean }>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    reason?: string;
  }): Promise<{ success: boolean }>;
}

const DeviceSecurity = registerPlugin<DeviceSecurityPlugin>('DeviceSecurity');

export function isNativeAndroidSecurityAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function isNativeBiometricAvailable() {
  if (!isNativeAndroidSecurityAvailable()) {
    return false;
  }

  try {
    const result = await DeviceSecurity.isBiometricAvailable();
    return result.available;
  } catch (error) {
    console.error('Failed to check native biometric availability', error);
    return false;
  }
}

export async function authenticateWithNativeBiometrics(options?: {
  title?: string;
  subtitle?: string;
  reason?: string;
}) {
  if (!isNativeAndroidSecurityAvailable()) {
    return false;
  }

  try {
    const result = await DeviceSecurity.authenticate(options);
    return result.success;
  } catch (error) {
    console.error('Native biometric authentication failed', error);
    return false;
  }
}
