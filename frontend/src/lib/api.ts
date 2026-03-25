import { getDeviceId, getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL ?? '/media';

export type ApiOptions = RequestInit & {
  auth?: boolean;
  includeDeviceId?: boolean;
};

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${MEDIA_BASE}/${path.replace(/^\/+/, '')}`;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.includeDeviceId) {
    headers.set('X-Device-Id', getDeviceId());
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
