import crypto from 'node:crypto';

import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class AnnouncementRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  create({
    id = crypto.randomUUID(),
    title,
    body,
    audience_role = 'all',
    created_by_user_id = null
  }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO announcements
          (id, title, body, audience_role, created_by_user_id, created_at, updated_at, deleted_at)
         VALUES
          (@id, @title, @body, @audience_role, @created_by_user_id, @created_at, @updated_at, NULL)`
      )
      .run({
        id,
        title,
        body,
        audience_role,
        created_by_user_id,
        created_at: now,
        updated_at: now
      });
    return this.getById(id, { includeDeleted: true });
  }

  getById(id, { includeDeleted = false } = {}) {
    if (includeDeleted) {
      return this.db.prepare('SELECT * FROM announcements WHERE id = ?').get(id) ?? null;
    }
    return (
      this.db.prepare('SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL').get(id) ??
      null
    );
  }

  list({ audience_role = null, includeDeleted = false, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const clauses = [];
    const params = { ...page };

    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (audience_role && audience_role !== 'all') {
      clauses.push('(audience_role = @audience_role OR audience_role = \'all\')');
      params.audience_role = audience_role;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db
      .prepare(
        `SELECT * FROM announcements
         ${where}
         ORDER BY updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(params);
  }

  update(id, patch) {
    const now = nowIsoUtc();
    const allowed = ['title', 'body', 'audience_role'];
    const updates = {};
    for (const k of allowed) if (patch[k] !== undefined) updates[k] = patch[k];
    updates.updated_at = now;

    const sets = Object.keys(updates)
      .map((k) => `${k} = @${k}`)
      .join(', ');
    if (!sets) return this.getById(id, { includeDeleted: true });

    this.db.prepare(`UPDATE announcements SET ${sets} WHERE id = @id`).run({ ...updates, id });
    return this.getById(id, { includeDeleted: true });
  }

  softDelete(id) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        'UPDATE announcements SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL'
      )
      .run(now, now, id);
    return this.getById(id, { includeDeleted: true });
  }
}

export default AnnouncementRepository;
