PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_role TEXT NOT NULL CHECK (audience_role IN ('all', 'headteacher', 'teacher', 'parent', 'student')),
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_audience_role ON announcements(audience_role);
CREATE INDEX IF NOT EXISTS idx_announcements_updated_at ON announcements(updated_at);
