-- 0.36: site rating and feedback, messages to the administrator, and
-- course certificates (verifiable by their public code). Portable SQL.

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  liked TEXT NOT NULL DEFAULT '',
  improve TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'kk',
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_feedback_created ON feedback (created_at);

CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL CHECK (topic IN ('question', 'bug', 'idea', 'account', 'other')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'done')),
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_contact_status ON contact_messages (status, created_at);

CREATE TABLE certificates (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('certificate', 'commendation')),
  -- the name as printed, kept even if the account is renamed later
  name TEXT NOT NULL,
  average INTEGER NOT NULL,
  completed INTEGER NOT NULL,
  total INTEGER NOT NULL,
  issued_at BIGINT NOT NULL,
  UNIQUE (user_id, kind)
);
