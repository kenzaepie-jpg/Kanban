import 'dotenv/config';
import path from 'path';

export const config = {
  port: Number(process.env.PORT) || 4000,
  // Set COOKIE_SECURE=true when the site is served over HTTPS
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gostudy',
  },
  sessionDays: Number(process.env.SESSION_DAYS) || 30,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 25,
};
