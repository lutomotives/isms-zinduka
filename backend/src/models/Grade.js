import crypto from 'node:crypto';

import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class GradeRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  upsert({
    id = crypto.randomUUID(),
    student_id,
    term,
    subject,
    score = null,
    grade = null,
    recorded_by_user_id = null
  }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO grades
          (id, student_id, term, subject, score, grade, recorded_by_user_id, created_at, updated_at, deleted_at)
         VALUES
          (@id, @student_id, @term, @subject, @score, @grade, @recorded_by_user_id, @created_at, @updated_at, NULL)
         ON CONFLICT(student_id, term, subject) DO UPDATE SET
           score = excluded.score,
           grade = excluded.grade,
           recorded_by_user_id = excluded.recorded_by_user_id,
           updated_at = excluded.updated_at,
           deleted_at = NULL`
      )
      .run({
        id,
        student_id,
        term,
        subject,
        score,
        grade,
        recorded_by_user_id,
        created_at: now,
        updated_at: now
      });

    return this.getByStudentTermSubject(student_id, term, subject, { includeDeleted: true });
  }

  getById(id, { includeDeleted = false } = {}) {
    if (includeDeleted) return this.db.prepare('SELECT * FROM grades WHERE id = ?').get(id) ?? null;
    return this.db.prepare('SELECT * FROM grades WHERE id = ? AND deleted_at IS NULL').get(id) ?? null;
  }

  getByStudentTermSubject(student_id, term, subject, { includeDeleted = false } = {}) {
    const q = includeDeleted
      ? 'SELECT * FROM grades WHERE student_id = ? AND term = ? AND subject = ?'
      : 'SELECT * FROM grades WHERE student_id = ? AND term = ? AND subject = ? AND deleted_at IS NULL';
    return this.db.prepare(q).get(student_id, term, subject) ?? null;
  }

  list({ student_id = null, term = null, includeDeleted = false, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const clauses = [];
    const params = { ...page };

    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (student_id) {
      clauses.push('student_id = @student_id');
      params.student_id = student_id;
    }
    if (term) {
      clauses.push('term = @term');
      params.term = term;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db
      .prepare(
        `SELECT * FROM grades
         ${where}
         ORDER BY updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(params);
  }

  softDelete(id) {
    const now = nowIsoUtc();
    this.db
      .prepare('UPDATE grades SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
    return this.getById(id, { includeDeleted: true });
  }
}

export default GradeRepository;
