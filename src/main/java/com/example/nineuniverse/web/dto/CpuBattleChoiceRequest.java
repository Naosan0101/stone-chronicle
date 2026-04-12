package com.example.nineuniverse.web.dto;

import java.util.List;

public record CpuBattleChoiceRequest(
		boolean confirm,
		List<String> pickedInstanceIds
) {
}

