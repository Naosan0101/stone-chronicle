package com.example.nineuniverse.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AppUser {
	private Long id;
	private String username;
	private String passwordHash;
	private Integer coins;
	/** 初回ホーム訪問時のウェルカムジェムを既に付与したか（新規ユーザーは false から開始） */
	private Boolean welcomeHomeBonusGranted;
	private LocalDate lastMissionDate;
	private LocalDateTime createdAt;
	/** 最終アクセス時刻 */
	private LocalDateTime lastAccessAt;

	/** 無料スタンダードパック用ゲージのサイクル開始（この時刻から12時間でMAX） */
	private Instant timePackCycleStart;
}
