package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.battle.CpuBattleEngine;
import com.example.stonechronicle.battle.BattlePhase;
import com.example.stonechronicle.battle.CpuBattleState;
import com.example.stonechronicle.battle.ZoneFighter;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.web.dto.BattleCardDto;
import com.example.stonechronicle.card.CardAttributeLabels;
import com.example.stonechronicle.card.CardFaceAbilityFormatter;
import com.example.stonechronicle.web.dto.AbilityBlockDto;
import com.example.stonechronicle.web.dto.CardDefDto;
import com.example.stonechronicle.web.dto.CpuBattleChoiceRequest;
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
		st.setPhase(st.isHumansTurn() ? BattlePhase.HUMAN_INPUT : BattlePhase.CPU_THINKING);
		session.setAttribute(SESSION_KEY, st);
		missionService.onCpuBattleStarted(userId);
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
	}

	public CpuBattleStateDto humanCommit(HttpSession session, int levelUpRest, List<String> levelUpDiscardInstanceIds, int levelUpStones,
			String deployInstanceId, int payCostStones, List<String> payCostCardInstanceIds) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		engine.humanTurnInteractive(st, levelUpRest, levelUpDiscardInstanceIds, levelUpStones, deployInstanceId, payCostStones, payCostCardInstanceIds, defs());
		return stateDto(session);
	}

	public CpuBattleStateDto stateDto(HttpSession session) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		return stateDtoFromState(st);
	}

	public CpuBattleStateDto stateDtoFromState(CpuBattleState st) {
		Map<Short, CardDefinition> defs = defs();
		int hbPow = engine.effectiveBattlePower(st.getHumanBattle(), true, st, defs);
		int cbPow = engine.effectiveBattlePower(st.getCpuBattle(), false, st, defs);

		Map<Short, CardDefDto> defDtos = defs.values().stream()
				.collect(Collectors.toMap(
						CardDefinition::getId,
						d -> {
							String rarity = d.getRarity();
							String rar = rarity != null && !rarity.isBlank() ? rarity : "C";
							return new CardDefDto(
								d.getId(),
								d.getName(),
								(short) (d.getCost() != null ? d.getCost() : 0),
								(short) (d.getBasePower() != null ? d.getBasePower() : 0),
								d.getAttribute(),
								rar,
								rar,
								d.getImageFile(),
								d.getAbilityDeployCode(),
								CardAttributeLabels.japaneseName(d.getAttribute()),
								CardAttributeLabels.japaneseNameLines(d.getAttribute()),
								GameConstants.CARD_LAYER_BASE,
								GameConstants.cardLayerBarPath(d.getAttribute()),
								GameConstants.CARD_LAYER_DATA,
								GameConstants.cardPortraitPath(d.getImageFile()),
								CardFaceAbilityFormatter.blocksForCardId(d.getId()).stream()
										.map(b -> new AbilityBlockDto(b.getHeadline(), b.getBody()))
										.toList()
							);
						}
				));

		var pc = st.getPendingChoice();
		return new CpuBattleStateDto(
				st.isPvp(),
				st.getCpuLevel(),
				st.isHumanGoesFirst(),
				st.isHumansTurn(),
				st.getPhase() != null ? st.getPhase().name() : null,
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
				st.getHumanNextDeployBonus(),
				st.getHumanNextElfOnlyBonus(),
				st.getHumanNextDeployCostBonusTimes(),
				st.getLastMessage(),
				st.isGameOver(),
				st.isHumanWon(),
				st.getPendingEffect() != null
						? new com.example.stonechronicle.web.dto.PendingEffectDto(
								st.getPendingEffect().isOwnerHuman(),
								st.getPendingEffect().getMainInstanceId(),
								st.getPendingEffect().getCardId(),
								st.getPendingEffect().getAbilityDeployCode()
						)
						: null,
				pc != null
						? new com.example.stonechronicle.web.dto.PendingChoiceDto(
								pc.getKind() != null ? pc.getKind().name() : null,
								pc.getPrompt(),
								pc.isForHuman(),
								pc.isCpuSlotChooses(),
								pc.getAbilityDeployCode(),
								pc.getStoneCost(),
								pc.getOptionInstanceIds(),
								pc.isForHuman() && !pc.isCpuSlotChooses()
						)
						: null,
				st.getEventLog(),
				defDtos
		);
	}

	public CpuBattleStateDto cpuStep(HttpSession session) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		engine.cpuTurn(st, defs(), new Random());
		return stateDto(session);
	}

	public CpuBattleStateDto resolvePending(HttpSession session) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		engine.resolvePendingEffectAndAdvance(st, defs(), new Random());
		return stateDto(session);
	}

	public CpuBattleStateDto choose(HttpSession session, CpuBattleChoiceRequest req) {
		CpuBattleState st = current(session);
		if (st == null) {
			return null;
		}
		engine.applyHumanChoiceAndAdvance(
				st,
				req != null && req.confirm(),
				req != null && req.pickedInstanceIds() != null ? req.pickedInstanceIds() : List.of(),
				defs(),
				new Random()
		);
		return stateDto(session);
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
