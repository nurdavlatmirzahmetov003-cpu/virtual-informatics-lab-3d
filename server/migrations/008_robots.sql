-- V4 §4.4 «Біздің роботтар»: one save per student — the wardrobe items
-- bought, what each robot wears, the robots' levels and the tips heard
-- (services/robots/economy.ts RobotSave, as JSON). Coins are never stored:
-- they are recomputed from the attempts. Portable SQL.

CREATE TABLE robot_saves (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);
