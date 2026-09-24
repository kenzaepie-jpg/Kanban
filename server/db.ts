import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from './config';

export let pool: Pool;

/** Creates the database if needed, connects, and applies schema.sql. */
export async function initDatabase(): Promise<void> {
  const { database, ...connection } = config.db;
  if (!/^\w+$/.test(database)) throw new Error(`Invalid DB_NAME "${database}"`);

  const admin = await mysql.createConnection(connection);
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();

  pool = mysql.createPool({ ...config.db, connectionLimit: 10, timezone: 'Z' });
  // Store and read every DATETIME as UTC, whatever the MySQL server's own time zone is
  pool.pool.on('connection', conn => conn.query("SET time_zone = '+00:00'"));

  const dir = path.dirname(fileURLToPath(import.meta.url));
  const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
  const statements = schema
    .replace(/--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  for (const sql of statements) await pool.query(sql);
}

/** Runs `fn` in a transaction, committing on success and rolling back on any error. */
export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
