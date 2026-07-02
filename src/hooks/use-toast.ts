'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let externalToasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notify() {
  listeners.forEach((l) => l([...externalToasts]));
}

export function toast(opts: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  externalToasts = [...externalToasts, { ...opts, id }];
  notify();
  setTimeout(() => {
    externalToasts = externalToasts.filter((t) => t.id !== id);
    notify();
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setToasts(t);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  function dismiss(id: string) {
    externalToasts = externalToasts.filter((t) => t.id !== id);
    notify();
  }

  return { toasts, dismiss };
}
