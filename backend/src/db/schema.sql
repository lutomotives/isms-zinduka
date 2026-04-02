-- Master schema definition (SQLite)
-- Offline-first: UUID primary keys, timestamps, soft-delete, and sync tracking.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('headteacher', 'teacher', 'parent', 'student')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  admission_no TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  dob TEXT,
  class_name TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (guardian_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_guardian_phone ON students(guardian_phone);
CREATE INDEX IF NOT EXISTS idx_students_guardian_user_id ON students(guardian_user_id);
CREATE INDEX IF NOT EXISTS idx_students_updated_at ON students(updated_at);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  FOREIGN KEY (marked_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_updated_at ON attendance(updated_at);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  term TEXT NOT NULL,
  subject TEXT NOT NULL,
  score REAL,
  grade TEXT,
  recorded_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(student_id, term, subject),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_term ON grades(term);
CREATE INDEX IF NOT EXISTS idx_grades_updated_at ON grades(updated_at);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  method TEXT NOT NULL DEFAULT 'mpesa',
  reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'confirmed', 'failed', 'cancelled')),
  initiated_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
  FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON payments(updated_at);

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

CREATE TABLE IF NOT EXISTS sync_log (
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  last_pulled_at TEXT,
  last_pushed_at TEXT,
  last_seen_updated_at TEXT,
  PRIMARY KEY (entity, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity);

COMMIT;
