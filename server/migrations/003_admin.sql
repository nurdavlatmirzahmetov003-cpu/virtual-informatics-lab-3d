-- V2-10 admin panel: one-time password reset links, manual IP blocks,
-- site settings and admin-edited texts (kk/ru/en). Portable SQL.

-- the link carries a random token; only its SHA-256 is stored here
CREATE TABLE password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  used_at BIGINT
);

CREATE TABLE ip_blocks (
  ip TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL,
  -- NULL: until removed
  expires_at BIGINT
);

-- one JSON value per setting key
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at BIGINT NOT NULL
);

-- a locale key's text replaced through the admin panel (the files stay the defaults)
CREATE TABLE content_overrides (
  key TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('kk', 'ru', 'en')),
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (key, lang)
);

CREATE INDEX idx_resets_user ON password_resets (user_id);
CREATE INDEX idx_audit_action ON audit_log (action, at);
CREATE INDEX idx_audit_actor ON audit_log (actor_id, at);
