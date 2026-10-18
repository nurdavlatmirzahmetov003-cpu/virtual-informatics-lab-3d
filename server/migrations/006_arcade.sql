-- 0.36 Games arena: one row per run. A run starts with a server-issued seed
-- and is scored on the server when it finishes (labs/Arcade scoreRun).
-- Unfinished runs (score NULL) are cleaned up after a day. Portable SQL.

CREATE TABLE arcade_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  seed BIGINT NOT NULL,
  started_at BIGINT NOT NULL,
  finished_at BIGINT,
  score INTEGER,
  correct INTEGER,
  total INTEGER,
  mistakes INTEGER
);

CREATE INDEX idx_arcade_runs_best ON arcade_runs (game, user_id, score);
CREATE INDEX idx_arcade_runs_user ON arcade_runs (user_id, started_at);
