export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787';
export const CURRENT_USER = 'chris.yu@spit.hk';

export async function callApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return (json.data ?? json) as T;
}
