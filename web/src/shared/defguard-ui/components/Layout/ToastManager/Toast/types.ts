import { ToastOptions } from '../../../../hooks/toasts/useToastStore';

export enum ToastType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface ToastProps {
  data: ToastOptions;
}
