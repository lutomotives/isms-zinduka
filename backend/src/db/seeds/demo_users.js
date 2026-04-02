import crypto from 'node:crypto';
import process from 'node:process';

import { openSqlite } from '../../config/database.js';
import { logger } from '../../config/logger.js';

import UserRepository from '../../models/User.js';
import AuthService from '../../services/auth.service.js';

function parseArgs(argv) {
  const args = { force: false };
  for (const a of argv) if (a === '--force') args.force = true;
  return args;
}

export async function seedDemoUsers({ db, force = false } = {}) {
  const localDb = db ?? openSqlite();
  const userRepo = new UserRepository(localDb);
  const auth = new AuthService({ userRepo });

  const existing = userRepo.list({ limit: 1, offset: 0 });
  if (existing.length && !force) {
    logger.info('Skipping demo users seed (users already exist). Use --force to override.');
    return { skipped: true };
  }

  if (force) {
    localDb.exec('DELETE FROM users;');
  }

  const mkUser = async ({ username, phone, role, password }) => {
    const password_hash = await auth.hashPassword(password);
    return userRepo.create({
      id: crypto.randomUUID(),
      username,
      phone,
      role,
      password_hash,
      is_active: 1
    });
  };

  const users = [];
  users.push(
    await mkUser({
      username: 'headteacher',
      phone: '+254700000001',
      role: 'headteacher',
      password: 'ChangeMe123!'
    })
  );
  users.push(
    await mkUser({
      username: 'teacher1',
      phone: '+254700000011',
      role: 'teacher',
      password: 'ChangeMe123!'
    })
  );
  users.push(
    await mkUser({
      username: 'parent1',
      phone: '+254700000021',
      role: 'parent',
      password: 'ChangeMe123!'
    })
  );
  users.push(
    await mkUser({
      username: 'student1',
      phone: '+254700000031',
      role: 'student',
      password: 'ChangeMe123!'
    })
  );

  logger.info('Seeded demo users', { count: users.length });
  return { skipped: false, users };
}

if (process.argv[1]?.endsWith('demo_users.js')) {
  const args = parseArgs(process.argv.slice(2));
  seedDemoUsers({ force: args.force })
    .catch((err) => {
      logger.error('Demo users seed failed', { err: err?.message, stack: err?.stack });
      process.exitCode = 1;
    })
    .finally(() => {
      // if we created our own DB handle via openSqlite(), it is already closed by process exit.
    });
}

