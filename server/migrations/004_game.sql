-- V2-11a gamification: the student's own leaderboard privacy and
-- class-vs-class contests. XP itself is never stored — it is derived from
-- the attempts. Portable SQL.

-- 1: show "Participant N" instead of the name on leaderboards
ALTER TABLE users ADD COLUMN leaderboard_anon INTEGER NOT NULL DEFAULT 0;

CREATE TABLE contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  starts_at BIGINT NOT NULL,
  ends_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE contest_classes (
  contest_id TEXT NOT NULL REFERENCES contests (id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  PRIMARY KEY (contest_id, class_id)
);

CREATE INDEX idx_contest_classes_class ON contest_classes (class_id);
CREATE INDEX idx_attempts_user_at ON attempts (user_id, at);
