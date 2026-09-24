import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response, Router } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { config } from './config';
import { pool } from './db';
import { HttpError, handle, requireString } from './http';

const COOKIE = 'gostudy_session';
const LEVELS = ['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Level 500', 'Masters', 'PhD'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  level: string;
  password_hash: string;
  created_at: Date;
}

const toUser = (u: UserRow) => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  level: u.level,
  createdAt: u.created_at.toISOString(),
});

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

async function startSession(res: Response, userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAge = config.sessionDays * 24 * 60 * 60 * 1000;
  await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
    hashToken(token),
    userId,
    new Date(Date.now() + maxAge),
  ]);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, maxAge, path: '/' });
}

/** Rejects the request with 401 unless it carries a valid session cookie. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE];
    if (typeof token !== 'string') throw new HttpError(401, 'Please sign in.');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()',
      [hashToken(token)],
    );
    if (rows.length === 0) throw new HttpError(401, 'Your session has expired. Please sign in again.');
    req.userId = rows[0].user_id;
    next();
  } catch (err) {
    next(err);
  }
}

export const authRouter = Router();

authRouter.post(
  '/register',
  handle(async (req, res) => {
    const name = requireString(req.body.name, 'Name', 100);
    const email = requireString(req.body.email, 'Email', 255).toLowerCase();
    const level = requireString(req.body.level, 'Level', 30);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
    if (!LEVELS.includes(level)) throw new HttpError(400, 'Please select your level.');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
    if (password.length > 72) throw new HttpError(400, 'Password must be at most 72 characters.');

    const passwordHash = await bcrypt.hash(password, 10);
    let userId: number;
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO users (name, email, level, password_hash) VALUES (?, ?, ?, ?)',
        [name, email, level, passwordHash],
      );
      userId = result.insertId;
    } catch (err) {
      if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
      }
      throw err;
    }

    await startSession(res, userId);
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    res.status(201).json({ user: toUser(rows[0]) });
  }),
);

authRouter.post(
  '/login',
  handle(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
    // Same message for unknown email and wrong password, so accounts can't be probed
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
      throw new HttpError(401, 'Incorrect email or password.');
    }
    await startSession(res, rows[0].id);
    res.json({ user: toUser(rows[0]) });
  }),
);

authRouter.post(
  '/logout',
  handle(async (req, res) => {
    const token = req.cookies?.[COOKIE];
    if (typeof token === 'string') await pool.query('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
    res.clearCookie(COOKIE, { path: '/' });
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  handle(async (req, res) => {
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) throw new HttpError(401, 'Please sign in.');
    res.json({ user: toUser(rows[0]) });
  }),
);
