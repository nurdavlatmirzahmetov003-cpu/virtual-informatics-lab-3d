-- V4 §10: each student's choice of Bit's voice (services/bit/voicePrefs.ts
-- VoicePrefs plus auto-read, as JSON). Guests keep theirs in the browser.
-- Portable SQL.

CREATE TABLE bit_voice_prefs (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);
