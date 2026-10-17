-- V2-11b live games: the result of every finished live quiz or race.
-- The rooms themselves live in memory while they run. Portable SQL.

CREATE TABLE live_sessions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('quiz', 'assembly', 'connect', 'fault')),
  title TEXT NOT NULL,
  host_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  class_id TEXT REFERENCES classes (id) ON DELETE SET NULL,
  started_at BIGINT,
  finished_at BIGINT NOT NULL,
  players INTEGER NOT NULL
);

CREATE TABLE live_results (
  session_id TEXT NOT NULL REFERENCES live_sessions (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  -- quiz: points; races: seconds with penalties (NULL = did not finish)
  score REAL,
  -- JSON: mistakes, correct answers, progress
  detail TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (session_id, user_id)
);

CREATE INDEX idx_live_sessions_host ON live_sessions (host_id, finished_at);
CREATE INDEX idx_live_results_user ON live_results (user_id);
