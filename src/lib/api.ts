// Small fetch wrapper for the GO STUDY API. The session lives in an httpOnly cookie.

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;

/** Called when the session has expired, so the app can return to the sign-in page. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  json?: unknown;
  form?: FormData;
}

async function send(path: string, { method, json, form }: RequestOptions): Promise<Response> {
  try {
    return await fetch(path, {
      method: method ?? (json !== undefined || form ? 'POST' : 'GET'),
      credentials: 'same-origin',
      headers: json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: json !== undefined ? JSON.stringify(json) : form,
    });
  } catch {
    throw new ApiError('Cannot reach the GO STUDY server. Check your connection.', 0);
  }
}

async function fail(path: string, res: Response): Promise<never> {
  const body = await res.json().catch(() => null);
  if (res.status === 401 && !path.startsWith('/api/auth/')) onUnauthorized?.();
  const message =
    body?.error ?? (res.status >= 500 ? 'The GO STUDY server is not responding. Is it running?' : `Request failed (${res.status}).`);
  throw new ApiError(message, res.status);
}

export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  if (!res.ok) return fail(path, res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const res = await send(path, {});
  if (!res.ok) return fail(path, res);
  return res.blob();
}
