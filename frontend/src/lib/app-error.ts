export const APP_ERROR_EVENT = 'app:error';

export type AppErrorEventDetail = {
  message: string;
};

export function dispatchAppError(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AppErrorEventDetail>(APP_ERROR_EVENT, { detail: { message } }));
}
