import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import pg from 'pg';

import { env } from './env.js';
import { logger } from './logger.js';

function ensureSqliteDir(sqlitePath) {
  const dir = path.dirname(sqlitePath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function openSqlite() {
  ensureSqliteDir(env.SQLITE_PATH);
  const db = new Database(env.SQLITE_PATH);

  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  logger.debug('SQLite opened', { sqlitePath: env.SQLITE_PATH });
  return db;
}

export function createPostgresPool() {
  if (!env.PG_HOST || !env.PG_DATABASE || !env.PG_USER) return null;

  const pool = new pg.Pool({
    host: env.PG_HOST,
    port: env.PG_PORT ?? 5432,
    database: env.PG_DATABASE,
    user: env.PG_USER,
    password: env.PG_PASSWORD,
    ssl: env.PG_SSL ? { rejectUnauthorized: false } : undefined,
    max: 5
  });

  pool.on('error', (err) => {
    logger.error('Postgres pool error', { err: err?.message });
  });

  logger.info('Postgres pool created', { host: env.PG_HOST, database: env.PG_DATABASE });
  return pool;
}
