import { sort } from 'radash';
import { createWithEqualityFn } from 'zustand/traditional';

import { ToastType } from '../../components/Layout/ToastManager/Toast/types';

export interface ToastOptions {
  id: number;
  message: string;
  type: ToastType;
  subMessage?: string;
}
export interface ToastStore {
  toasts: ToastOptions[];
  addToast: (props: Omit<ToastOptions, 'id'>) => void;
  removeToast: (id: number) => void;
}

export const useToastsStore = createWithEqualityFn<ToastStore>(
  (set) => ({
    toasts: [],
    addToast: (data) =>
      set((state) => {
        const nextId = sort(state.toasts, (t) => t.id, true)[0]?.id + 1 || 1;
        const toast: ToastOptions = { ...data, id: nextId };
        return { toasts: [...state.toasts, toast] };
      }),
    removeToast: (id) =>
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  }),
  Object.is,
);
