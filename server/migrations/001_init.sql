-- V2-8 initial schema. Portable SQL (SQLite now, PostgreSQL later):
-- text UUID primary keys, BIGINT epoch-milliseconds, INTEGER 0/1 flags.

CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  -- scrypt$N$r$p$salt$hash — never a plain password
  password_hash TEXT NOT NULL,
  school_id TEXT REFERENCES schools (id) ON DELETE SET NULL,
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  last_login_at BIGINT
);

CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools (id) ON DELETE SET NULL,
  teacher_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  created_at BIGINT NOT NULL
);

CREATE TABLE class_members (
  class_id TEXT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at BIGINT NOT NULL,
  PRIMARY KEY (class_id, user_id)
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  -- an exercise id from the progress catalog (e.g. "connect:pc"), or NULL for free-form work
  exercise_id TEXT,
  due_at BIGINT,
  created_at BIGINT NOT NULL
);

-- one graded run of an exercise; the id comes from the browser and dedupes syncs
CREATE TABLE attempts (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percent INTEGER NOT NULL,
  seconds INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  hints INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'incomplete')),
  at BIGINT NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  attempt_id TEXT,
  body TEXT NOT NULL DEFAULT '',
  submitted_at BIGINT NOT NULL
);

CREATE TABLE grades (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  graded_at BIGINT NOT NULL
);

CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  read_at BIGINT
);

CREATE TABLE achievements (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE xp_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT,
  created_at BIGINT NOT NULL
);

-- the cookie carries a random token; only its SHA-256 is stored here
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  csrf TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  last_seen_at BIGINT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  at BIGINT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  ip TEXT,
  detail TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_classes_teacher ON classes (teacher_id);
CREATE INDEX idx_members_user ON class_members (user_id);
CREATE INDEX idx_assignments_class ON assignments (class_id);
CREATE INDEX idx_attempts_user_exercise ON attempts (user_id, exercise_id);
CREATE INDEX idx_submissions_assignment ON submissions (assignment_id);
CREATE INDEX idx_messages_to ON messages (to_id);
CREATE INDEX idx_xp_user ON xp_events (user_id);
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_audit_at ON audit_log (at);
