import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { initDatabase } from './db';
import { authRouter, requireAuth } from './auth';
import { studyRouter } from './study';
import { errorHandler } from './http';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api', requireAuth, studyRouter);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// In production the server also serves the built frontend (npm run build → dist/)
const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

try {
  await initDatabase();
} catch (err) {
  const { host, port, user, database } = config.db;
  console.error(`\n✖ Could not connect to MySQL at ${user}@${host}:${port} (database "${database}").`);
  console.error('  Check DB_HOST, DB_PORT, DB_USER and DB_PASSWORD in your .env file.\n');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`GO STUDY API listening on http://localhost:${config.port} (MySQL database "${config.db.database}")`);
});
