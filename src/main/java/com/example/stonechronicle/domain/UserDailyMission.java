package com.example.stonechronicle.domain;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserDailyMission {
	private Long userId;
	private LocalDate missionDate;
	private Short slot;
	private String missionCode;
	private String title;
	private Integer targetCount;
	private Integer progress;
	private Boolean rewardGranted;
}
