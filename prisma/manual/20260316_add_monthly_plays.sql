ALTER TABLE music
  ADD COLUMN IF NOT EXISTS monthly_plays BIGINT NOT NULL DEFAULT 0;

ALTER TABLE music
  ADD COLUMN IF NOT EXISTS monthly_plays_month_key VARCHAR(7);

CREATE INDEX IF NOT EXISTS music_monthly_top_idx
  ON music (monthly_plays_month_key, is_visible, monthly_plays DESC, id DESC);
