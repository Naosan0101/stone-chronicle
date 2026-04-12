package com.example.nineuniverse.web.dto;

import java.util.List;

public record CpuBattleCommitRequest(
		int levelUpRest,
		List<String> levelUpDiscardInstanceIds,
		int levelUpStones,
		String deployInstanceId,
		int payCostStones,
		List<String> payCostCardInstanceIds
) {
}

