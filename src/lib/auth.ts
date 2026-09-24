import { User } from '../types';
import { ApiError, api } from './api';

export async function register(input: { name: string; email: string; level: string; password: string }): Promise<User> {
  const { user } = await api<{ user: User }>('/api/auth/register', { json: input });
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const { user } = await api<{ user: User }>('/api/auth/login', { json: { email, password } });
  return user;
}

export async function logout(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

/** The signed-in student, or null when there is no valid session. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await api<{ user: User }>('/api/auth/me');
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
