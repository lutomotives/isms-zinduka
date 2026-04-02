PRAGMA foreign_keys = ON;

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
