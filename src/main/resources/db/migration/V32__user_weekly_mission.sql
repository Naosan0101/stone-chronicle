CREATE TABLE user_weekly_mission (
	user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
	week_start DATE NOT NULL,
	slot SMALLINT NOT NULL,
	mission_code VARCHAR(64) NOT NULL,
	title VARCHAR(255) NOT NULL,
	target_count INT NOT NULL,
	progress INT NOT NULL DEFAULT 0,
	reward_granted BOOLEAN NOT NULL DEFAULT FALSE,
	PRIMARY KEY (user_id, week_start, slot),
	CONSTRAINT user_weekly_mission_slot CHECK (slot IN (1, 2, 3)),
	CONSTRAINT user_weekly_mission_target_nonneg CHECK (target_count >= 0),
	CONSTRAINT user_weekly_mission_progress_nonneg CHECK (progress >= 0)
);

CREATE INDEX idx_user_weekly_mission_user_week ON user_weekly_mission (user_id, week_start);
