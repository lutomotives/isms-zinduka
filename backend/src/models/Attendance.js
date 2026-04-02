import crypto from 'node:crypto';

import { nowIsoUtc, toDateOnly } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class AttendanceRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  mark({
    id = crypto.randomUUID(),
    student_id,
    date,
    status,
    marked_by_user_id = null
  }) {
    const now = nowIsoUtc();
    const dateOnly = toDateOnly(date);

    this.db
      .prepare(
        `INSERT INTO attendance
          (id, student_id, date, status, marked_by_user_id, created_at, updated_at, deleted_at)
         VALUES
          (@id, @student_id, @date, @status, @marked_by_user_id, @created_at, @updated_at, NULL)
         ON CONFLICT(student_id, date) DO UPDATE SET
           status = excluded.status,
           marked_by_user_id = excluded.marked_by_user_id,
           updated_at = excluded.updated_at,
           deleted_at = NULL`
      )
      .run({
        id,
        student_id,
        date: dateOnly,
        status,
        marked_by_user_id,
        created_at: now,
        updated_at: now
      });

    return this.getByStudentAndDate(student_id, dateOnly, { includeDeleted: true });
  }

  getById(id, { includeDeleted = false } = {}) {
    if (includeDeleted) return this.db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) ?? null;
    return (
      this.db.prepare('SELECT * FROM attendance WHERE id = ? AND deleted_at IS NULL').get(id) ??
      null
    );
  }

  getByStudentAndDate(student_id, date, { includeDeleted = false } = {}) {
    if (includeDeleted) {
      return (
        this.db
          .prepare('SELECT * FROM attendance WHERE student_id = ? AND date = ?')
          .get(student_id, date) ?? null
      );
    }
    return (
      this.db
        .prepare('SELECT * FROM attendance WHERE student_id = ? AND date = ? AND deleted_at IS NULL')
        .get(student_id, date) ?? null
    );
  }

  list({ student_id = null, date = null, includeDeleted = false, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const clauses = [];
    const params = { ...page };

    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (student_id) {
      clauses.push('student_id = @student_id');
      params.student_id = student_id;
    }
    if (date) {
      clauses.push('date = @date');
      params.date = toDateOnly(date);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db
      .prepare(
        `SELECT * FROM attendance
         ${where}
         ORDER BY date DESC, updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(params);
  }

  softDelete(id) {
    const now = nowIsoUtc();
    this.db
      .prepare('UPDATE attendance SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
    return this.getById(id, { includeDeleted: true });
  }
}

export default AttendanceRepository;
