ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_app_user_last_access ON app_user (last_access_at);
