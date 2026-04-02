import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { openSqlite } from '../config/database.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

function parseArgs(argv) {
  const args = { dryRun: false, to: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    if (a === '--to') args.to = argv[i + 1] ?? null;
  }
  return args;
}

function listMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.+\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
}

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);
}

function getAppliedFilenames(db) {
  const rows = db.prepare('SELECT filename FROM schema_migrations ORDER BY filename ASC').all();
  return new Set(rows.map((r) => r.filename));
}

function utcNowIso() {
  return new Date().toISOString();
}

function applyMigration(db, filename, sql, { dryRun }) {
  if (dryRun) {
    logger.info('DRY RUN migration', { filename });
    return;
  }

  const tx = db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations(filename, applied_at) VALUES (?, ?)').run(
      filename,
      utcNowIso()
    );
  });
  tx();
}

export async function runMigrations() {
  const args = parseArgs(process.argv.slice(2));
  const db = openSqlite();

  try {
    ensureMigrationsTable(db);

    const all = listMigrationFiles();
    const applied = getAppliedFilenames(db);
    const pending = all.filter((f) => !applied.has(f));
    const limited = args.to ? pending.filter((f) => f.localeCompare(args.to) <= 0) : pending;

    logger.info('Migration status', {
      migrationsDir,
      total: all.length,
      applied: all.length - pending.length,
      pending: pending.length,
      dryRun: args.dryRun,
      to: args.to ?? undefined
    });

    for (const filename of limited) {
      const fullPath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(fullPath, 'utf8');
      logger.info('Applying migration', { filename });
      applyMigration(db, filename, sql, { dryRun: args.dryRun });
    }

    logger.info('Migrations complete', { appliedNow: limited.length });
  } finally {
    db.close();
  }
}

if (import.meta.url === `file://${__filename}`) {
  runMigrations().catch((err) => {
    logger.error('Migration failed', { err: err?.message, stack: err?.stack });
    process.exitCode = 1;
  });
}
