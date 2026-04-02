PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sync_log (
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  last_pulled_at TEXT,
  last_pushed_at TEXT,
  last_seen_updated_at TEXT,
  PRIMARY KEY (entity, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity);
