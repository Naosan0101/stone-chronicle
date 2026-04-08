package com.example.stonechronicle.web.dto;

import java.util.List;

public record CpuBattleChoiceRequest(
		boolean confirm,
		List<String> pickedInstanceIds
) {
}

