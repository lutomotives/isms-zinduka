import { resolveLww } from './conflictResolver.js';

const ENTITY_CONFIG = {
  users: {
    table: 'users',
    id: 'id',
    deletedAt: null,
    columns: [
      'id',
      'username',
      'phone',
      'password_hash',
      'role',
      'is_active',
      'created_at',
      'updated_at'
    ]
  },
  students: {
    table: 'students',
    id: 'id',
    deletedAt: 'deleted_at',
    columns: [
      'id',
      'admission_no',
      'first_name',
      'last_name',
      'gender',
      'dob',
      'class_name',
      'guardian_name',
      'guardian_phone',
      'guardian_user_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  attendance: {
    table: 'attendance',
    id: 'id',
    deletedAt: 'deleted_at',
    columns: [
      'id',
      'student_id',
      'date',
      'status',
      'marked_by_user_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  grades: {
    table: 'grades',
    id: 'id',
    deletedAt: 'deleted_at',
    columns: [
      'id',
      'student_id',
      'term',
      'subject',
      'score',
      'grade',
      'recorded_by_user_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  payments: {
    table: 'payments',
    id: 'id',
    deletedAt: 'deleted_at',
    columns: [
      'id',
      'student_id',
      'amount_cents',
      'currency',
      'method',
      'reference',
      'status',
      'initiated_by_user_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  announcements: {
    table: 'announcements',
    id: 'id',
    deletedAt: 'deleted_at',
    columns: [
      'id',
      'title',
      'body',
      'audience_role',
      'created_by_user_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  }
};

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k] ?? null;
  return out;
}

function buildUpsertSql({ table, columns, idCol }) {
  const cols = columns.join(', ');
  const vals = columns.map((c) => `@${c}`).join(', ');
  const updates = columns
    .filter((c) => c !== idCol)
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return `INSERT INTO ${table} (${cols}) VALUES (${vals})
          ON CONFLICT(${idCol}) DO UPDATE SET ${updates}`;
}

export class SyncEngine {
  /**
   * @param {{ repos: any }} deps
   */
  constructor({ repos }) {
    // all repos share same better-sqlite3 db handle
    this.db = repos.users?.db ?? repos.students?.db ?? null;
    this.repos = repos;
    if (!this.db) throw new Error('SyncEngine requires sqlite db');

    this._upsertStmt = new Map();
    for (const [entity, cfg] of Object.entries(ENTITY_CONFIG)) {
      this._upsertStmt.set(entity, this.db.prepare(buildUpsertSql({ table: cfg.table, columns: cfg.columns, idCol: cfg.id })));
    }
  }

  _getRow(entity, id) {
    const cfg = ENTITY_CONFIG[entity];
    const row = this.db
      .prepare(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`)
      .get(id);
    return row ?? null;
  }

  push({ changes = {}, actorUserId = null } = {}) {
    const applied = [];
    const conflicts = [];

    const tx = this.db.transaction(() => {
      for (const [entity, rows] of Object.entries(changes)) {
        if (!ENTITY_CONFIG[entity]) continue;
        if (!Array.isArray(rows)) continue;

        for (const clientRow of rows) {
          const id = clientRow?.id;
          if (!id) continue;

          const serverRow = this._getRow(entity, id);
          const decision = resolveLww({ serverRow, clientRow });

          if (decision.action === 'apply_client') {
            const cfg = ENTITY_CONFIG[entity];
            const payload = pick(clientRow, cfg.columns);

            // hard safety: if client forgot timestamps, do not clobber server
            if (!payload.updated_at || !payload.created_at) {
              conflicts.push({ entity, id, reason: 'MISSING_TIMESTAMPS', server: serverRow, client: clientRow });
              continue;
            }

            this._upsertStmt.get(entity).run(payload);
            applied.push({ entity, id, updated_at: payload.updated_at });

            if (actorUserId && this.repos.syncLog) {
              // record that we "saw" this updated_at during push
              this.repos.syncLog.touchSeen({ entity, entity_id: id, last_seen_updated_at: payload.updated_at });
              this.repos.syncLog.markPushed({ entity, entity_id: id, last_seen_updated_at: payload.updated_at });
            }
          } else {
            conflicts.push({ entity, id, reason: 'SERVER_NEWER', server: serverRow, client: clientRow });
          }
        }
      }
    });

    tx();
    return { applied, conflicts };
  }

  pull({ since = null, limitPerEntity = 500 } = {}) {
    const out = {};
    const watermark = since ?? '1970-01-01T00:00:00.000Z';

    for (const [entity, cfg] of Object.entries(ENTITY_CONFIG)) {
      const rows = this.db
        .prepare(
          `SELECT * FROM ${cfg.table}
           WHERE updated_at > @since
           ORDER BY updated_at ASC
           LIMIT @limit`
        )
        .all({ since: watermark, limit: limitPerEntity });
      out[entity] = rows;
    }

    return { since: watermark, changes: out };
  }
}

export default SyncEngine;
