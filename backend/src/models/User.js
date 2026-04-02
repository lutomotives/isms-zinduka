import crypto from 'node:crypto';

import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class UserRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  create({ id = crypto.randomUUID(), username, phone = null, password_hash, role, is_active = 1 }) {
    const now = nowIsoUtc();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, phone, password_hash, role, is_active, created_at, updated_at)
      VALUES (@id, @username, @phone, @password_hash, @role, @is_active, @created_at, @updated_at)
    `);
    stmt.run({
      id,
      username,
      phone,
      password_hash,
      role,
      is_active: is_active ? 1 : 0,
      created_at: now,
      updated_at: now
    });
    return this.getById(id);
  }

  getById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
  }

  getByUsername(username) {
    return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) ?? null;
  }

  list({ limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const rows = this.db
      .prepare(
        `SELECT * FROM users
         ORDER BY updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(page);
    return rows;
  }

  update(id, patch) {
    const now = nowIsoUtc();
    const allowed = ['username', 'phone', 'password_hash', 'role', 'is_active'];
    const updates = {};
    for (const k of allowed) if (patch[k] !== undefined) updates[k] = patch[k];
    updates.updated_at = now;

    const sets = Object.keys(updates)
      .map((k) => `${k} = @${k}`)
      .join(', ');
    if (!sets) return this.getById(id);

    const stmt = this.db.prepare(`UPDATE users SET ${sets} WHERE id = @id`);
    stmt.run({ ...updates, id });
    return this.getById(id);
  }

  deactivate(id) {
    return this.update(id, { is_active: 0 });
  }
}

export default UserRepository;
