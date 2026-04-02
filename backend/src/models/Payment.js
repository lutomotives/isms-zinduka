import crypto from 'node:crypto';

import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class PaymentRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  create({
    id = crypto.randomUUID(),
    student_id,
    amount_cents,
    currency = 'KES',
    method = 'mpesa',
    reference = null,
    status = 'initiated',
    initiated_by_user_id = null
  }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO payments
          (id, student_id, amount_cents, currency, method, reference, status, initiated_by_user_id, created_at, updated_at, deleted_at)
         VALUES
          (@id, @student_id, @amount_cents, @currency, @method, @reference, @status, @initiated_by_user_id, @created_at, @updated_at, NULL)`
      )
      .run({
        id,
        student_id,
        amount_cents,
        currency,
        method,
        reference,
        status,
        initiated_by_user_id,
        created_at: now,
        updated_at: now
      });
    return this.getById(id, { includeDeleted: true });
  }

  getById(id, { includeDeleted = false } = {}) {
    if (includeDeleted) return this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id) ?? null;
    return (
      this.db.prepare('SELECT * FROM payments WHERE id = ? AND deleted_at IS NULL').get(id) ??
      null
    );
  }

  list({ student_id = null, status = null, includeDeleted = false, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    const clauses = [];
    const params = { ...page };

    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (student_id) {
      clauses.push('student_id = @student_id');
      params.student_id = student_id;
    }
    if (status) {
      clauses.push('status = @status');
      params.status = status;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db
      .prepare(
        `SELECT * FROM payments
         ${where}
         ORDER BY updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(params);
  }

  updateStatus(id, status, { reference } = {}) {
    const now = nowIsoUtc();
    const patch = { status, updated_at: now };
    const sets = ['status = @status', 'updated_at = @updated_at'];
    if (reference !== undefined) {
      patch.reference = reference;
      sets.unshift('reference = @reference');
    }
    this.db.prepare(`UPDATE payments SET ${sets.join(', ')} WHERE id = @id`).run({ ...patch, id });
    return this.getById(id, { includeDeleted: true });
  }

  softDelete(id) {
    const now = nowIsoUtc();
    this.db
      .prepare('UPDATE payments SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
    return this.getById(id, { includeDeleted: true });
  }
}

export default PaymentRepository;
