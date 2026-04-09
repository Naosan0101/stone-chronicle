-- 初回ホーム訪問時のウェルカムジェム。既存ユーザーは付与済み扱い。
ALTER TABLE app_user ADD COLUMN welcome_home_bonus_granted BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE app_user SET welcome_home_bonus_granted = TRUE;

ALTER TABLE app_user ALTER COLUMN coins SET DEFAULT 0;
