package com.example.stonechronicle.web.dto;

public record PendingEffectDto(
		boolean ownerHuman,
		String mainInstanceId,
		short cardId,
		String abilityDeployCode
) {
}

