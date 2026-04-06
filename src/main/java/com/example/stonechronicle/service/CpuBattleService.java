package com.example.stonechronicle.service;

import com.example.stonechronicle.battle.CpuBattleEngine;
import com.example.stonechronicle.battle.CpuBattleState;
import com.example.stonechronicle.battle.ZoneFighter;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.web.dto.BattleCardDto;
import com.example.stonechronicle.web.dto.CardDefDto;
import com.example.stonechronicle.web.dto.CpuBattleStateDto;
import com.example.stonechronicle.web.dto.ZoneFighterDto;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CpuBattleService {

	public static final String SESSION_KEY = "CPU_BATTLE_STATE";

	private final CpuBattleEngine engine;
	private final CardCatalogService cardCatalogService;
	private final DeckService deckService;
	private final MissionService missionService;

	@Transactional
	public CpuBattleState start(long userId, long deckId, int level, HttpSession session) {
		deckService.requireDeck(userId, deckId);
		List<Short> ids = deckService.cardIdsForDeck(deckId);
		Map<Short, CardDefinition> defs = cardCatalogService.mapById();
		Random rnd = new Random();
		CpuBattleState st = engine.newBattle(ids, level, rnd, defs);
		session.setAttribute(SESSION_KEY, st);
		missionService.onCpuBattleStarted(userId);
		if (!st.isHumansTurn()) {
			engine.cpuTurn(st, defs, rnd);
		}
		return st;
	}

	public CpuBattleState current(HttpSession session) {
		Object o = session.getAttribute(SESSION_KEY);
		if (o instanceof CpuBattleState s) {
			return s;
		}
		return null;
	}

	public void clear(HttpSession session) {
		session.removeAttribute(SESSION_KEY);
	}

	public Map<Short, CardDefinition> defs() {
		return cardCatalogService.mapById();
	}

	public void humanAct(HttpSession session, int levelUpRest, int levelUpStones, boolean deploy, int deployIndex) {
		CpuBattleState st = current(session);
		if (st == null) {
			return;
		}
		engine.humanTurn(st, levelUpRest, levelUpStones, deploy, deployIndex, defs());
		if (!st.isHumansTurn() && !st.isGameOver()) {
			engine.cpuTurn(st, defs(), new Random());
		}
	}

	public CpuBattleStateDto humanCommit(HttpSession session, int levelUpRest, int levelUpStones,
			String deployInstanceId, int payCostStones, List<String> payCostCardInstanceIds) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		engine.humanTurnInteractive(st, levelUpRest, levelUpStones, deployInstanceId, payCostStones, payCostCardInstanceIds, defs());
		if (!st.isHumansTurn() && !st.isGameOver()) {
			engine.cpuTurn(st, defs(), new Random());
		}
		return stateDto(session);
	}

	public CpuBattleStateDto stateDto(HttpSession session) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		Map<Short, CardDefinition> defs = defs();
		int hbPow = engine.effectiveBattlePower(st.getHumanBattle(), true, st, defs);
		int cbPow = engine.effectiveBattlePower(st.getCpuBattle(), false, st, defs);

		Map<Short, CardDefDto> defDtos = defs.values().stream()
				.collect(Collectors.toMap(
						CardDefinition::getId,
						d -> new CardDefDto(
								d.getId(),
								d.getName(),
								(short) (d.getCost() != null ? d.getCost() : 0),
								(short) (d.getBasePower() != null ? d.getBasePower() : 0),
								d.getAttribute(),
								d.getImageFile(),
								d.getAbilityDeployCode()
						)
				));

		return new CpuBattleStateDto(
				st.getCpuLevel(),
				st.isHumanGoesFirst(),
				st.isHumansTurn(),
				st.getHumanStones(),
				st.getCpuStones(),
				st.getHumanDeck().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				st.getHumanHand().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				st.getHumanRest().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				toZoneDto(st.getHumanBattle()),
				st.getCpuDeck().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				st.getCpuHand().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				st.getCpuRest().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList(),
				toZoneDto(st.getCpuBattle()),
				hbPow,
				cbPow,
				st.getLastMessage(),
				st.isGameOver(),
				st.isHumanWon(),
				st.getEventLog(),
				defDtos
		);
	}

	private static ZoneFighterDto toZoneDto(ZoneFighter z) {
		if (z == null) {
			return null;
		}
		var main = z.getMain() != null ? new BattleCardDto(z.getMain().getInstanceId(), z.getMain().getCardId()) : null;
		var under = z.getCostUnder().stream().map(c -> new BattleCardDto(c.getInstanceId(), c.getCardId())).toList();
		return new ZoneFighterDto(main, under, z.getTemporaryPowerBonus());
	}
}
