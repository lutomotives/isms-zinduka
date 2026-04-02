PRAGMA foreign_keys = ON;

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

