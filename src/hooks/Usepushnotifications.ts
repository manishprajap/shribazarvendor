import { useEffect, useRef } from 'react';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { apiPost } from '../api';

// Module-level flag — survives remounts/StrictMode double-invoke,
// same pattern as pushInitStarted in App.tsx
let pushHookInitStarted = false;

export function usePushNotifications(
  onOrderPush?: (data: Record<string, string>) => void
) {
  const onOrderPushRef = useRef(onOrderPush);
  onOrderPushRef.current = onOrderPush;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[usePushNotifications] Not a native platform — push skipped.');
      return;
    }

    if (pushHookInitStarted) {
      console.log('[usePushNotifications] Already initialized elsewhere — skipping duplicate run.');
      return;
    }
    pushHookInitStarted = true;

    let tokenListener: any;
    let errorListener: any;
    let receivedListener: any;
    let actionListener: any;

    const setup = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[usePushNotifications] Permission not granted');
          return;
        }

        tokenListener = await PushNotifications.addListener(
          'registration',
          async (token: Token) => {
            console.log('[usePushNotifications] FCM token:', token.value);
            try {
              await apiPost('/vendor/fcm-token', {
                token: token.value,
                platform: 'android',
              });
            } catch (err) {
              console.error('[usePushNotifications] Failed to save FCM token:', err);
            }
          }
        );

        errorListener = await PushNotifications.addListener(
          'registrationError',
          (err) => {
            console.error('[usePushNotifications] Registration error:', err);
          }
        );

        receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('[usePushNotifications] Received (foreground):', notification);
            onOrderPushRef.current?.((notification.data ?? {}) as Record<string, string>);
          }
        );

        actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('[usePushNotifications] Tapped:', action.notification);
            onOrderPushRef.current?.(
              (action.notification.data ?? {}) as Record<string, string>
            );
          }
        );

        await PushNotifications.register();
      } catch (err) {
        console.error('[usePushNotifications] Setup error:', err);
        pushHookInitStarted = false; // allow retry on genuine failure
      }
    };

    setup();

    return () => {
      tokenListener?.remove?.();
      errorListener?.remove?.();
      receivedListener?.remove?.();
      actionListener?.remove?.();
    };
  }, []);
}