import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useDeviceToken() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateToken().then(setDeviceToken);
  }, []);

  return deviceToken;
}

async function getOrCreateToken(): Promise<string> {
  // 웹 환경 — localStorage에 고유 ID 저장
  if (Platform.OS === 'web') {
    const stored = localStorage.getItem('sungji_device_token');
    if (stored) return stored;
    const newToken = 'web-' + Math.random().toString(36).substring(2) + '-' + Date.now();
    localStorage.setItem('sungji_device_token', newToken);
    return newToken;
  }

  // 네이티브 환경 — expo-notifications 사용
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (!Device.default.isDevice) {
      return 'simulator-mock-token-' + Date.now();
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return 'denied-mock-token-' + Date.now();
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (e) {
    console.warn('알림 토큰 획득 실패, 임시 토큰 사용:', e);
    return 'fallback-token-' + Math.random().toString(36).substring(2);
  }
}
