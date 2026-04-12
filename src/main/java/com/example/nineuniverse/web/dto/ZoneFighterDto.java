package com.example.nineuniverse.web.dto;

import java.util.List;

public record ZoneFighterDto(
		BattleCardDto main,
		List<BattleCardDto> costUnder,
		int temporaryPowerBonus,
		List<BattlePowerModifierDto> powerModifiers
) {
}

