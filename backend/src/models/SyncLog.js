import { nowIsoUtc } from '../utils/dateUtils.js';
import { normalizePagination } from '../utils/pagination.js';

export class SyncLogRepository {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.db = db;
  }

  touchSeen({ entity, entity_id, last_seen_updated_at }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO sync_log (entity, entity_id, last_pulled_at, last_pushed_at, last_seen_updated_at)
         VALUES (@entity, @entity_id, NULL, NULL, @last_seen_updated_at)
         ON CONFLICT(entity, entity_id) DO UPDATE SET
           last_seen_updated_at = @last_seen_updated_at`
      )
      .run({ entity, entity_id, last_seen_updated_at });
    return this.get(entity, entity_id);
  }

  markPulled({ entity, entity_id, last_seen_updated_at = null }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO sync_log (entity, entity_id, last_pulled_at, last_pushed_at, last_seen_updated_at)
         VALUES (@entity, @entity_id, @now, NULL, @last_seen_updated_at)
         ON CONFLICT(entity, entity_id) DO UPDATE SET
           last_pulled_at = @now,
           last_seen_updated_at = COALESCE(@last_seen_updated_at, last_seen_updated_at)`
      )
      .run({ entity, entity_id, now, last_seen_updated_at });
    return this.get(entity, entity_id);
  }

  markPushed({ entity, entity_id, last_seen_updated_at = null }) {
    const now = nowIsoUtc();
    this.db
      .prepare(
        `INSERT INTO sync_log (entity, entity_id, last_pulled_at, last_pushed_at, last_seen_updated_at)
         VALUES (@entity, @entity_id, NULL, @now, @last_seen_updated_at)
         ON CONFLICT(entity, entity_id) DO UPDATE SET
           last_pushed_at = @now,
           last_seen_updated_at = COALESCE(@last_seen_updated_at, last_seen_updated_at)`
      )
      .run({ entity, entity_id, now, last_seen_updated_at });
    return this.get(entity, entity_id);
  }

  get(entity, entity_id) {
    return (
      this.db
        .prepare('SELECT * FROM sync_log WHERE entity = ? AND entity_id = ?')
        .get(entity, entity_id) ?? null
    );
  }

  list({ entity = null, limit, offset } = {}) {
    const page = normalizePagination({ limit, offset });
    if (entity) {
      return this.db
        .prepare(
          `SELECT * FROM sync_log
           WHERE entity = @entity
           ORDER BY last_seen_updated_at DESC
           LIMIT @limit OFFSET @offset`
        )
        .all({ ...page, entity });
    }
    return this.db
      .prepare(
        `SELECT * FROM sync_log
         ORDER BY last_seen_updated_at DESC
         LIMIT @limit OFFSET @offset`
      )
      .all(page);
  }
}

export default SyncLogRepository;
