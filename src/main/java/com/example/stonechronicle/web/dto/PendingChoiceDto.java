package com.example.stonechronicle.web.dto;

import java.util.List;

public record PendingChoiceDto(
		String kind,
		String prompt,
		boolean forHuman,
		String abilityDeployCode,
		int stoneCost,
		List<String> optionInstanceIds
) {
}

