import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  remove: (id: string) => void;
}

let count = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = 'info') => {
    const id = String(++count);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
