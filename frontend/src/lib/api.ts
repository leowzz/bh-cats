import { dispatchAppError } from './app-error';
import { getDeviceId, getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL ?? '/media';

export type ApiOptions = RequestInit & {
  auth?: boolean;
  includeDeviceId?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, message: string, detail = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${MEDIA_BASE}/${path.replace(/^\/+/, '')}`;
}

function parseErrorDetail(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('<')) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object' && 'detail' in parsed && typeof parsed.detail === 'string') {
      return parsed.detail;
    }
  } catch {}

  return trimmed;
}

function getErrorMessage(status: number, detail: string): string {
  switch (status) {
    case 400:
      return detail || '请求参数不正确，请检查后重试';
    case 401:
      return detail || '登录已失效，请重新登录后重试';
    case 403:
      return detail || '当前没有权限执行这个操作';
    case 404:
      return detail || '请求的内容不存在或已被删除';
    case 413:
      return '上传内容过大，请将文件压缩到 20MB 以内后重试';
    case 422:
      return detail || '提交的数据格式不正确，请检查后重试';
    case 500:
    case 502:
    case 503:
    case 504:
      return '服务暂时不可用，请稍后重试';
    default:
      return detail || '请求失败，请稍后重试';
  }
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch {
    const error = new ApiError(0, '网络连接失败，请检查网络后重试');
    dispatchAppError(error.message);
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    const detail = parseErrorDetail(text);
    const error = new ApiError(response.status, getErrorMessage(response.status, detail), detail);
    dispatchAppError(error.message);
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
