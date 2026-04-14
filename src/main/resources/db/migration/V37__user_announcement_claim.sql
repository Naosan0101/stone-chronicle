CREATE TABLE user_announcement_claim (
	user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
	announcement_key VARCHAR(64) NOT NULL,
	claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, announcement_key)
);

CREATE INDEX idx_user_announcement_claim_key ON user_announcement_claim(announcement_key);
