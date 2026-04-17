import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type SmsRiskStatus = 'VERIFIED' | 'SUSPICIOUS' | 'FRAUD' | 'UNKNOWN';
export type SmsTransactionType = 'income' | 'expense';
export type SmsPermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

export interface SmsMonitorEvent {
  id: string;
  sender: string;
  body: string;
  amount: number;
  type: SmsTransactionType;
  status: SmsRiskStatus;
  reason: string;
  timestamp: number;
  notificationTitle: string;
  notificationBody: string;
}

interface SmsMonitorPlugin {
  checkPermissions(): Promise<{ sms: SmsPermissionState }>;
  requestPermissions(): Promise<{ sms: SmsPermissionState }>;
  getPendingSmsEvent(): Promise<{ event?: SmsMonitorEvent | null }>;
  addListener(
    eventName: 'smsReceived',
    listenerFunc: (event: SmsMonitorEvent) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export const SmsMonitor = registerPlugin<SmsMonitorPlugin>('SmsMonitor');

export function isNativeAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}
