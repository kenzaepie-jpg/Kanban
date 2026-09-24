import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from './config';
import { pool, transaction } from './db';
import { HttpError, handle, parseId, requireString } from './http';
import { SAMPLE_COURSE } from './sampleCourse';

/** Work-in-progress limit: a student studies one course at a time. */
export const WIP_LIMIT = 1;

type Db = PoolConnection | typeof pool;
type TopicStatus = 'course' | 'in-process' | 'done';
type FileType = 'pdf' | 'docx' | 'text' | 'markdown' | 'html';

const FILE_TYPES: Record<string, FileType> = { '.pdf': 'pdf', '.docx': 'docx', '.txt': 'text', '.md': 'markdown' };
const COLOR_RE = /^#[0-9a-f]{6}$/i;

/* ------------------------------------------------------------------ */
/* Uploads                                                             */
/* ------------------------------------------------------------------ */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(config.uploadDir, { recursive: true });
      cb(null, config.uploadDir);
    },
    // Random names: the original name is kept in the database only
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 50 },
  fileFilter: (_req, file, cb) => {
    // Browsers send non-ASCII file names as latin1; restore the UTF-8 name
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (path.extname(file.originalname).toLowerCase() in FILE_TYPES) cb(null, true);
    else cb(new HttpError(400, `${file.originalname}: use PDF, Word (.docx), .txt or .md files.`));
  },
});

function removeFiles(paths: (string | null)[]) {
  for (const p of paths) {
    if (p) fs.promises.unlink(path.join(config.uploadDir, p)).catch(() => {});
  }
}

const uploadedFiles = (files: unknown): Express.Multer.File[] => (Array.isArray(files) ? files : []);

/** "03_Cell-Biology.pdf" → "03 Cell Biology" */
function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) || 'Untitled topic';
}

function parseTitles(value: unknown): string[] {
  const raw: unknown = typeof value === 'string' ? JSON.parse(value || '[]') : value ?? [];
  if (!Array.isArray(raw)) throw new HttpError(400, 'Invalid topic titles.');
  return raw
    .filter((t): t is string => typeof t === 'string')
    .map(t => t.trim().slice(0, 300))
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Reading a student's data                                            */
/* ------------------------------------------------------------------ */

const iso = (d: Date | null) => (d ? d.toISOString() : undefined);

/** Everything the app needs for one student, in the shape the frontend uses. */
export async function loadUserData(db: Db, userId: number) {
  const [[user]] = await db.query<RowDataPacket[]>('SELECT break_reminder FROM users WHERE id = ?', [userId]);
  const [courses] = await db.query<RowDataPacket[]>('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at, id', [userId]);
  const [topics] = await db.query<RowDataPacket[]>(
    'SELECT t.* FROM topics t JOIN courses c ON c.id = t.course_id WHERE c.user_id = ? ORDER BY t.course_id, t.position',
    [userId],
  );

  return {
    courses: courses.map(c => ({
      id: String(c.id),
      title: c.title,
      code: c.code,
      color: c.color,
      createdAt: c.created_at.toISOString(),
      completedAt: iso(c.completed_at),
    })),
    topics: topics.map(t => ({
      id: String(t.id),
      courseId: String(t.course_id),
      title: t.title,
      order: t.position,
      status: t.status,
      progress: t.progress,
      document: t.file_path ? { name: t.file_name, type: t.file_type, size: t.file_size } : undefined,
      notes: t.notes ?? '',
      secondsStudied: t.seconds_studied,
      startedAt: iso(t.started_at),
      completedAt: iso(t.completed_at),
    })),
    board: courses
      .filter(c => c.on_board_at)
      .sort((a, b) => a.on_board_at - b.on_board_at || a.id - b.id)
      .map(c => String(c.id)),
    settings: { breakReminder: !!user?.break_reminder },
  };
}

async function ownedCourse(db: Db, userId: number, courseId: number) {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM courses WHERE id = ? AND user_id = ?', [courseId, userId]);
  if (rows.length === 0) throw new HttpError(404, 'Course not found.');
  return rows[0];
}

async function ownedTopic(db: Db, userId: number, topicId: number, lock = false) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, c.on_board_at FROM topics t JOIN courses c ON c.id = t.course_id
     WHERE t.id = ? AND c.user_id = ?${lock ? ' FOR UPDATE' : ''}`,
    [topicId, userId],
  );
  if (rows.length === 0) throw new HttpError(404, 'Topic not found.');
  return rows[0];
}

/**
 * When every topic of a course on the board is done, the course is completed:
 * it leaves the board and frees the student to take up another course. Returns true if that just happened.
 */
async function settleCourse(db: Db, courseId: number): Promise<boolean> {
  const [[row]] = await db.query<RowDataPacket[]>(
    `SELECT c.on_board_at, COUNT(t.id) AS total, SUM(t.status = 'done') AS done
     FROM courses c LEFT JOIN topics t ON t.course_id = c.id WHERE c.id = ? GROUP BY c.id`,
    [courseId],
  );
  if (!row?.on_board_at || row.total === 0 || Number(row.done) !== row.total) return false;
  await db.query('UPDATE courses SET on_board_at = NULL, completed_at = UTC_TIMESTAMP() WHERE id = ?', [courseId]);
  return true;
}

/** Column changes for moving a topic between Kanban columns. */
function statusUpdate(topic: RowDataPacket, status: TopicStatus): Record<string, unknown> {
  const now = new Date();
  if (status === 'done') return { status, progress: 100, completed_at: now };
  if (status === 'in-process') {
    // Reopening a finished topic shouldn't still read as 100% complete
    return {
      status,
      started_at: topic.started_at ?? now,
      completed_at: null,
      progress: topic.status === 'done' ? 99 : topic.progress,
    };
  }
  return { status, progress: 0, completed_at: null };
}

async function nextPosition(db: Db, courseId: number): Promise<number> {
  const [[row]] = await db.query<RowDataPacket[]>('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM topics WHERE course_id = ?', [courseId]);
  return row.next;
}

async function insertTopics(db: Db, courseId: number, files: Express.Multer.File[], titles: string[]) {
  let position = await nextPosition(db, courseId);
  for (const file of files) {
    await db.query(
      `INSERT INTO topics (course_id, title, position, file_name, file_path, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        titleFromFileName(file.originalname),
        position++,
        file.originalname.slice(0, 255),
        file.filename,
        FILE_TYPES[path.extname(file.originalname).toLowerCase()],
        file.size,
      ],
    );
  }
  for (const title of titles) {
    await db.query('INSERT INTO topics (course_id, title, position) VALUES (?, ?, ?)', [courseId, title, position++]);
  }
  return files.length + titles.length;
}

/* ------------------------------------------------------------------ */
/* Routes (all require a signed-in student)                            */
/* ------------------------------------------------------------------ */

export const studyRouter = Router();

studyRouter.get(
  '/data',
  handle(async (req, res) => {
    res.json({ data: await loadUserData(pool, req.userId!) });
  }),
);

studyRouter.patch(
  '/settings',
  handle(async (req, res) => {
    if (typeof req.body.breakReminder !== 'boolean') throw new HttpError(400, 'breakReminder must be true or false.');
    await pool.query('UPDATE users SET break_reminder = ? WHERE id = ?', [req.body.breakReminder, req.userId]);
    res.status(204).end();
  }),
);

/* ---------- Courses ---------- */

studyRouter.post(
  '/courses',
  upload.array('files'),
  handle(async (req, res) => {
    const files = uploadedFiles(req.files);
    try {
      const title = requireString(req.body.title, 'Course title', 200);
      const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase().slice(0, 30) : '';
      const color = COLOR_RE.test(req.body.color) ? req.body.color : '#2563eb';
      const titles = parseTitles(req.body.titles);

      const courseId = await transaction(async conn => {
        const [result] = await conn.query<ResultSetHeader>(
          'INSERT INTO courses (user_id, title, code, color) VALUES (?, ?, ?, ?)',
          [req.userId, title, code, color],
        );
        await insertTopics(conn, result.insertId, files, titles);
        return result.insertId;
      });
      res.status(201).json({ courseId: String(courseId), data: await loadUserData(pool, req.userId!) });
    } catch (err) {
      removeFiles(files.map(f => f.filename));
      throw err;
    }
  }),
);

studyRouter.post(
  '/courses/sample',
  handle(async (req, res) => {
    fs.mkdirSync(config.uploadDir, { recursive: true });
    const written: string[] = [];
    try {
      await transaction(async conn => {
        const [result] = await conn.query<ResultSetHeader>(
          'INSERT INTO courses (user_id, title, code, color) VALUES (?, ?, ?, ?)',
          [req.userId, SAMPLE_COURSE.title, SAMPLE_COURSE.code, SAMPLE_COURSE.color],
        );
        for (const [i, lesson] of SAMPLE_COURSE.lessons.entries()) {
          const fileName = `${crypto.randomUUID()}.html`;
          fs.writeFileSync(path.join(config.uploadDir, fileName), lesson.html);
          written.push(fileName);
          await conn.query(
            `INSERT INTO topics (course_id, title, position, file_name, file_path, file_type, file_size)
             VALUES (?, ?, ?, ?, ?, 'html', ?)`,
            [result.insertId, lesson.title, i + 1, `${lesson.title}.html`, fileName, Buffer.byteLength(lesson.html)],
          );
        }
      });
    } catch (err) {
      removeFiles(written);
      throw err;
    }
    res.status(201).json({ data: await loadUserData(pool, req.userId!) });
  }),
);

studyRouter.post(
  '/courses/:id/topics',
  upload.array('files'),
  handle(async (req, res) => {
    const files = uploadedFiles(req.files);
    try {
      const courseId = parseId(req.params.id);
      const titles = parseTitles(req.body.titles);
      if (files.length + titles.length === 0) throw new HttpError(400, 'Add at least one file or topic title.');
      await transaction(async conn => {
        await ownedCourse(conn, req.userId!, courseId);
        await insertTopics(conn, courseId, files, titles);
        // New work reopens a completed course
        await conn.query('UPDATE courses SET completed_at = NULL WHERE id = ?', [courseId]);
      });
      res.status(201).json({ data: await loadUserData(pool, req.userId!) });
    } catch (err) {
      removeFiles(files.map(f => f.filename));
      throw err;
    }
  }),
);

/**
 * Begin study: put a course on the board, enforcing the WIP limit.
 * With `{ switch: true }` the current session(s) are ended first, for when priorities change.
 */
studyRouter.post(
  '/courses/:id/begin',
  handle(async (req, res) => {
    const courseId = parseId(req.params.id);
    await transaction(async conn => {
      // Lock this student's courses so two quick clicks can't both pass the WIP check
      const [courses] = await conn.query<RowDataPacket[]>(
        'SELECT id, title, on_board_at FROM courses WHERE user_id = ? FOR UPDATE',
        [req.userId],
      );
      const course = courses.find(c => c.id === courseId);
      if (!course) throw new HttpError(404, 'Course not found.');
      if (course.on_board_at) return;

      const [[counts]] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'done'), 0) AS done FROM topics WHERE course_id = ?`,
        [courseId],
      );
      if (counts.total === 0) throw new HttpError(400, 'Add some topics to this course before studying it.');
      if (Number(counts.done) === counts.total) {
        throw new HttpError(409, 'You already completed this course. Reset it from Manage to study it again.');
      }

      const onBoard = courses.filter(c => c.on_board_at);
      if (onBoard.length >= WIP_LIMIT) {
        if (req.body?.switch !== true) {
          const names = onBoard.map(c => c.title).join(' and ');
          throw new HttpError(409, `You are studying ${names}. Finish it or end its session first.`);
        }
        await conn.query('UPDATE courses SET on_board_at = NULL WHERE id IN (?)', [onBoard.map(c => c.id)]);
      }
      await conn.query('UPDATE courses SET on_board_at = UTC_TIMESTAMP(3), completed_at = NULL WHERE id = ?', [courseId]);
    });
    res.json({ data: await loadUserData(pool, req.userId!) });
  }),
);

/** End a course's study session early. Its topics keep their progress for later. */
studyRouter.post(
  '/courses/:id/end',
  handle(async (req, res) => {
    const courseId = parseId(req.params.id);
    await ownedCourse(pool, req.userId!, courseId);
    await pool.query('UPDATE courses SET on_board_at = NULL WHERE id = ?', [courseId]);
    res.json({ data: await loadUserData(pool, req.userId!) });
  }),
);

studyRouter.post(
  '/courses/:id/restart',
  handle(async (req, res) => {
    const courseId = parseId(req.params.id);
    await transaction(async conn => {
      await ownedCourse(conn, req.userId!, courseId);
      await conn.query('UPDATE courses SET completed_at = NULL WHERE id = ?', [courseId]);
      await conn.query(
        `UPDATE topics SET status = 'course', progress = 0, started_at = NULL, completed_at = NULL WHERE course_id = ?`,
        [courseId],
      );
    });
    res.json({ data: await loadUserData(pool, req.userId!) });
  }),
);

studyRouter.delete(
  '/courses/:id',
  handle(async (req, res) => {
    const courseId = parseId(req.params.id);
    await ownedCourse(pool, req.userId!, courseId);
    const [files] = await pool.query<RowDataPacket[]>('SELECT file_path FROM topics WHERE course_id = ?', [courseId]);
    await pool.query('DELETE FROM courses WHERE id = ?', [courseId]); // topics cascade
    removeFiles(files.map(f => f.file_path));
    res.json({ data: await loadUserData(pool, req.userId!) });
  }),
);

/* ---------- Topics ---------- */

/** Reading progress and notes change often, so they return no body. */
studyRouter.patch(
  '/topics/:id',
  handle(async (req, res) => {
    const topicId = parseId(req.params.id);
    const topic = await ownedTopic(pool, req.userId!, topicId);
    const updates: Record<string, unknown> = {};

    if (req.body.progress !== undefined) {
      const progress = Number(req.body.progress);
      if (!Number.isFinite(progress)) throw new HttpError(400, 'Invalid progress.');
      if (topic.status !== 'done') updates.progress = Math.max(0, Math.min(100, Math.round(progress)));
    }
    if (req.body.notes !== undefined) {
      if (typeof req.body.notes !== 'string' || req.body.notes.length > 20000) throw new HttpError(400, 'Notes are too long.');
      updates.notes = req.body.notes;
    }
    if (Object.keys(updates).length) await pool.query('UPDATE topics SET ? WHERE id = ?', [updates, topicId]);
    res.status(204).end();
  }),
);

studyRouter.post(
  '/topics/:id/time',
  handle(async (req, res) => {
    const topicId = parseId(req.params.id);
    const seconds = Math.round(Number(req.body.seconds));
    // One reading session can't report more than 12 hours
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 12 * 3600) throw new HttpError(400, 'Invalid study time.');
    await ownedTopic(pool, req.userId!, topicId);
    await pool.query('UPDATE topics SET seconds_studied = seconds_studied + ? WHERE id = ?', [seconds, topicId]);
    res.status(204).end();
  }),
);

/** Moves a topic to another Kanban column. */
studyRouter.post(
  '/topics/:id/move',
  handle(async (req, res) => {
    const topicId = parseId(req.params.id);
    const status = req.body.status as TopicStatus;
    if (!['course', 'in-process', 'done'].includes(status)) throw new HttpError(400, 'Invalid column.');

    const completed = await transaction(async conn => {
      const topic = await ownedTopic(conn, req.userId!, topicId, true);
      if (!topic.on_board_at) throw new HttpError(409, 'Put this course on your study board first.');
      if (topic.status === status) return false;
      await conn.query('UPDATE topics SET ? WHERE id = ?', [statusUpdate(topic, status), topicId]);
      return settleCourse(conn, topic.course_id);
    });
    res.json({ data: await loadUserData(pool, req.userId!), completedCourse: completed });
  }),
);

/** Marks a topic done and moves the next topic of the same course into In Process. */
studyRouter.post(
  '/topics/:id/done-next',
  handle(async (req, res) => {
    const topicId = parseId(req.params.id);
    const result = await transaction(async conn => {
      const topic = await ownedTopic(conn, req.userId!, topicId, true);
      if (!topic.on_board_at) throw new HttpError(409, 'Put this course on your study board first.');
      await conn.query('UPDATE topics SET ? WHERE id = ?', [statusUpdate(topic, 'done'), topicId]);

      // Prefer another open topic, then the next one not started yet
      const [[next]] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM topics WHERE course_id = ? AND id <> ? AND status <> 'done'
         ORDER BY status = 'in-process' DESC, position LIMIT 1 FOR UPDATE`,
        [topic.course_id, topicId],
      );
      if (next && next.status === 'course') {
        await conn.query('UPDATE topics SET ? WHERE id = ?', [statusUpdate(next, 'in-process'), next.id]);
      }
      return { nextTopicId: next ? String(next.id) : null, completedCourse: await settleCourse(conn, topic.course_id) };
    });
    res.json({ data: await loadUserData(pool, req.userId!), ...result });
  }),
);

studyRouter.delete(
  '/topics/:id',
  handle(async (req, res) => {
    const topicId = parseId(req.params.id);
    const { filePath, completed } = await transaction(async conn => {
      const topic = await ownedTopic(conn, req.userId!, topicId, true);
      await conn.query('DELETE FROM topics WHERE id = ?', [topicId]);
      // Deleting the last unfinished topic can complete the course
      return { filePath: topic.file_path as string | null, completed: await settleCourse(conn, topic.course_id) };
    });
    removeFiles([filePath]);
    res.json({ data: await loadUserData(pool, req.userId!), completedCourse: completed });
  }),
);

/** Attaches (or replaces) the file of a topic. */
studyRouter.post(
  '/topics/:id/file',
  upload.single('file'),
  handle(async (req, res) => {
    const file = req.file;
    try {
      if (!file) throw new HttpError(400, 'Choose a file to attach.');
      const topicId = parseId(req.params.id);
      const topic = await ownedTopic(pool, req.userId!, topicId);
      await pool.query(
        'UPDATE topics SET file_name = ?, file_path = ?, file_type = ?, file_size = ? WHERE id = ?',
        [file.originalname.slice(0, 255), file.filename, FILE_TYPES[path.extname(file.originalname).toLowerCase()], file.size, topicId],
      );
      removeFiles([topic.file_path]);
      res.json({ data: await loadUserData(pool, req.userId!) });
    } catch (err) {
      if (file) removeFiles([file.filename]);
      throw err;
    }
  }),
);

/** Streams a topic's file to its owner only. */
studyRouter.get(
  '/topics/:id/file',
  handle(async (req, res) => {
    const topic = await ownedTopic(pool, req.userId!, parseId(req.params.id));
    if (!topic.file_path) throw new HttpError(404, 'This topic has no file.');
    // Never let an uploaded file run as a page on this site
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.type('application/octet-stream');
    res.sendFile(topic.file_path, { root: config.uploadDir, dotfiles: 'deny' }, err => {
      if (err && !res.headersSent) res.status(404).json({ error: 'File not found on the server.' });
    });
  }),
);
