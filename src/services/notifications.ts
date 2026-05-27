import { api } from './api';
import type { Notification } from '../types';

type Listener = (notification: Notification) => void;

let eventSource: EventSource | null = null;
let listeners = new Set<Listener>();

function getStreamUrl(): string {
  const token = localStorage.getItem('token');
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/notifications/stream?token=${encodeURIComponent(token || '')}`;
}

export function connectNotificationStream() {
  if (eventSource) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  eventSource = new EventSource(getStreamUrl());
  eventSource.addEventListener('notification', (e) => {
    try {
      const notification = JSON.parse(e.data) as Notification;
      listeners.forEach((fn) => fn(notification));
    } catch { /* ignore parse errors */ }
  });
  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
    setTimeout(connectNotificationStream, 5000);
  };
}

export function disconnectNotificationStream() {
  eventSource?.close();
  eventSource = null;
}

export function onNotification(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
