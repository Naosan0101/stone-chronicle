package com.example.stonechronicle.web.dto;

import java.util.List;

public record CpuBattleCommitRequest(
		int levelUpRest,
		int levelUpStones,
		String deployInstanceId,
		int payCostStones,
		List<String> payCostCardInstanceIds
) {
}

