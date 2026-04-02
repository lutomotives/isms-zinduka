import crypto from 'node:crypto';

import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class StudentRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  create({
    id = crypto.randomUUID(),
    admission_no = null,
    first_name,
    last_name,
    gender = null,
    dob = null,
    class_name = null,
    guardian_name = null,
    guardian_phone = null,
    guardian_user_id = null
  }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO students
          (id, admission_no, first_name, last_name, gender, dob, class_name, guardian_name, guardian_phone, guardian_user_id, created_at, updated_at, deleted_at)
         VALUES
          (@id, @admission_no, @first_name, @last_name, @gender, @dob, @class_name, @guardian_name, @guardian_phone, @guardian_user_id, @created_at, @updated_at, NULL)`
      )
      .run({
        id,
        admission_no,
        first_name,
        last_name,
        gender,
        dob,
        class_name,
        guardian_name,
        guardian_phone,
        guardian_user_id,
        created_at: now,
        updated_at: now
      });
    return this.getById(id);
  }

  getById(id, { includeDeleted = false } = {}) {
    if (includeDeleted) return this.db.prepare('SELECT * FROM students WHERE id = ?').get(id) ?? null;
    return (
      this.db.prepare('SELECT * FROM students WHERE id = ? AND deleted_at IS NULL').get(id) ?? null
    );
  }

  list({ q = null, class_name = null, includeDeleted = false, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const clauses = [];
    const params = { ...page };

    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (class_name) {
      clauses.push('class_name = @class_name');
      params.class_name = class_name;
    }
    if (q) {
      clauses.push('(first_name LIKE @q OR last_name LIKE @q OR admission_no LIKE @q)');
      params.q = `%${q}%`;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db
      .prepare(
        `SELECT * FROM students
         ${where}
         ORDER BY updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(params);
  }

  update(id, patch) {
    const now = nowIsoUtc();
    const allowed = [
      'admission_no',
      'first_name',
      'last_name',
      'gender',
      'dob',
      'class_name',
      'guardian_name',
      'guardian_phone',
      'guardian_user_id'
    ];
    const updates = {};
    for (const k of allowed) if (patch[k] !== undefined) updates[k] = patch[k];
    updates.updated_at = now;

    const sets = Object.keys(updates)
      .map((k) => `${k} = @${k}`)
      .join(', ');
    if (!sets) return this.getById(id, { includeDeleted: true });

    this.db.prepare(`UPDATE students SET ${sets} WHERE id = @id`).run({ ...updates, id });
    return this.getById(id, { includeDeleted: true });
  }

  softDelete(id) {
    const now = nowIsoUtc();
    this.db
      .prepare('UPDATE students SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
    return this.getById(id, { includeDeleted: true });
  }

  restore(id) {
    const now = nowIsoUtc();
    this.db
      .prepare('UPDATE students SET deleted_at = NULL, updated_at = ? WHERE id = ?')
      .run(now, id);
    return this.getById(id, { includeDeleted: true });
  }
}

export default StudentRepository;
