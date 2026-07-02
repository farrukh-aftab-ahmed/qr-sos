'use client';

import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const subscribe = async () => {
    if (!supported) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  return { supported, subscribed, subscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
