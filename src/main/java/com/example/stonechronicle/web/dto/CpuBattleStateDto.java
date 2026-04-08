package com.example.stonechronicle.web.dto;

import java.util.List;
import java.util.Map;

public record CpuBattleStateDto(
		boolean pvpMatch,
		int cpuLevel,
		boolean humanGoesFirst,
		boolean humansTurn,
		String phase,
		int humanStones,
		int cpuStones,
		List<BattleCardDto> humanDeck,
		List<BattleCardDto> humanHand,
		List<BattleCardDto> humanRest,
		ZoneFighterDto humanBattle,
		List<BattleCardDto> cpuDeck,
		List<BattleCardDto> cpuHand,
		List<BattleCardDto> cpuRest,
		ZoneFighterDto cpuBattle,
		int humanBattlePower,
		int cpuBattlePower,
		int humanNextDeployBonus,
		int humanNextElfOnlyBonus,
		int humanNextDeployCostBonusTimes,
		String lastMessage,
		boolean gameOver,
		boolean humanWon,
		PendingEffectDto pendingEffect,
		PendingChoiceDto pendingChoice,
		List<String> eventLog,
		Map<Short, CardDefDto> defs
) {
}

