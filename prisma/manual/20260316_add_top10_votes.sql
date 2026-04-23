CREATE TABLE IF NOT EXISTS monthly_top_track_votes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  music_id BIGINT NOT NULL REFERENCES music(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_top_track_votes_user_month_unique
  ON monthly_top_track_votes (user_id, month_key);

CREATE INDEX IF NOT EXISTS monthly_top_track_votes_month_music_idx
  ON monthly_top_track_votes (month_key, music_id);
