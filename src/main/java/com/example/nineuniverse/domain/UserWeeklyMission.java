package com.example.nineuniverse.domain;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserWeeklyMission {
	private Long userId;
	/** その週の月曜日（日本時間・ISO週） */
	private LocalDate weekStart;
	private Short slot;
	private String missionCode;
	private String title;
	private Integer targetCount;
	private Integer progress;
	private Boolean rewardGranted;
}
