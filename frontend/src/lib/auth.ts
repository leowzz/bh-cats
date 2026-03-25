const TOKEN_KEY = 'bh_cats_token';
const DEVICE_KEY = 'bh_cats_device_id';
const ROLE_KEY = 'bh_cats_role';

type Role = 'user' | 'admin';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  const storage = window.localStorage;
  if (!storage || typeof storage.getItem !== 'function') return null;
  return storage;
}

export function getToken(): string | null {
  return getStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function getRole(): Role | null {
  const value = getStorage()?.getItem(ROLE_KEY);
  return value === 'user' || value === 'admin' ? value : null;
}

export function setSession(token: string | null, role: Role | null): void {
  const storage = getStorage();
  if (!storage) return;
  if (token) storage.setItem(TOKEN_KEY, token);
  else storage.removeItem(TOKEN_KEY);

  if (role) storage.setItem(ROLE_KEY, role);
  else storage.removeItem(ROLE_KEY);
}

export function getDeviceId(): string {
  const storage = getStorage();
  if (!storage) return 'server-device';
  const existing = storage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  storage.setItem(DEVICE_KEY, next);
  return next;
}
