import { StoredUser, User } from '../types';
import { newId, readJSON, removeKey, writeJSON } from './storage';

// Accounts are stored in this browser only (there is no backend yet).
// Passwords are never stored in plain text: they are salted and hashed with PBKDF2.

const USERS_KEY = 'gostudy_users';
const SESSION_KEY = 'gostudy_session';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure sign-in needs HTTPS or localhost. Open the app at http://localhost:3000.');
  }
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

function loadUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(USERS_KEY, []);
}

function toPublicUser({ passwordHash, salt, ...user }: StoredUser): User {
  return user;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function register(input: { name: string; email: string; level: string; password: string }): Promise<User> {
  const email = normalizeEmail(input.email);
  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    throw new Error('An account with this email already exists. Sign in instead.');
  }

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const stored: StoredUser = {
    id: newId('user'),
    name: input.name.trim(),
    email,
    level: input.level,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
  };

  if (!writeJSON(USERS_KEY, [...users, stored])) {
    throw new Error('Could not save your account: browser storage is unavailable.');
  }
  writeJSON(SESSION_KEY, stored.id);
  return toPublicUser(stored);
}

export async function login(emailInput: string, password: string): Promise<User> {
  const email = normalizeEmail(emailInput);
  const user = loadUsers().find(u => u.email === email);
  // Same message for unknown email and wrong password, so accounts can't be probed
  if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
    throw new Error('Incorrect email or password.');
  }
  writeJSON(SESSION_KEY, user.id);
  return toPublicUser(user);
}

export function logout(): void {
  removeKey(SESSION_KEY);
}

export function currentUser(): User | null {
  const id = readJSON<string | null>(SESSION_KEY, null);
  const user = id ? loadUsers().find(u => u.id === id) : undefined;
  return user ? toPublicUser(user) : null;
}
