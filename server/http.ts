import { NextFunction, Request, RequestHandler, Response } from 'express';

/** An error with an HTTP status whose message is safe to show to the student. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Express 4 doesn't catch rejected promises, so async handlers are wrapped. */
export const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // multer reports size/type problems with a `code`
  const code = (err as { code?: string })?.code;
  if (code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'That file is too large.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}

export function requireString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters.`);
  return trimmed;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Not found.');
  return id;
}
