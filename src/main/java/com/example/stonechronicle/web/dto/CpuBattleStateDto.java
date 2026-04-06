package com.example.stonechronicle.web.dto;

import java.util.List;
import java.util.Map;

public record CpuBattleStateDto(
		int cpuLevel,
		boolean humanGoesFirst,
		boolean humansTurn,
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
		String lastMessage,
		boolean gameOver,
		boolean humanWon,
		List<String> eventLog,
		Map<Short, CardDefDto> defs
) {
}

