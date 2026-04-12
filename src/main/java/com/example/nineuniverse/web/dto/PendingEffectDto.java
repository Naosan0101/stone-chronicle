package com.example.nineuniverse.web.dto;

public record PendingEffectDto(
		boolean ownerHuman,
		String mainInstanceId,
		short cardId,
		String abilityDeployCode
) {
}

