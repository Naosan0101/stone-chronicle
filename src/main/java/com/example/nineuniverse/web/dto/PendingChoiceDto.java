package com.example.nineuniverse.web.dto;

import java.util.List;

public record PendingChoiceDto(
		String kind,
		String prompt,
		boolean forHuman,
		boolean cpuSlotChooses,
		String abilityDeployCode,
		int stoneCost,
		List<String> optionInstanceIds,
		boolean viewerMayRespond
) {
}

