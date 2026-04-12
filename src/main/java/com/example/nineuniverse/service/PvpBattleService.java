package com.example.nineuniverse.service;

import com.example.nineuniverse.battle.BattlePhase;
import com.example.nineuniverse.battle.CpuBattleEngine;
import com.example.nineuniverse.battle.CpuBattleState;
import com.example.nineuniverse.battle.PendingChoice;
import com.example.nineuniverse.pvp.PvpMatch;
import com.example.nineuniverse.web.dto.CpuBattleStateDto;
import com.example.nineuniverse.web.dto.PendingChoiceDto;
import com.example.nineuniverse.web.dto.CpuBattleCommitRequest;
import com.example.nineuniverse.web.dto.CpuBattleChoiceRequest;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PvpBattleService {

	private final CpuBattleEngine engine;
	private final CpuBattleService cpuBattleService;
	private final DeckService deckService;
	private final CardCatalogService cardCatalogService;

	private final Map<String, PvpMatch> matches = new ConcurrentHashMap<>();

	public PvpMatch createWaitingRoom(long hostUserId, long hostDeckId) {
		deckService.requireDeck(hostUserId, hostDeckId);
		String id = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
		var m = new PvpMatch(id, hostUserId, hostDeckId);
		matches.put(id, m);
		return m;
	}

	public PvpMatch get(String id) {
		return matches.get(id);
	}

	public void join(String matchId, long guestUserId, long guestDeckId) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			if (m.getGuestUserId() != null) {
				throw new IllegalStateException("この対戦部屋はすでに埋まっています");
			}
			if (m.getHostUserId() == guestUserId) {
				throw new IllegalStateException("自分の部屋には参加できません");
			}
			deckService.requireDeck(guestUserId, guestDeckId);
			m.setGuestUserId(guestUserId);
			m.setGuestDeckId(guestDeckId);
			var defs = cardCatalogService.mapById();
			var rnd = new Random();
			List<Short> hostCards = deckService.cardIdsForDeck(m.getHostDeckId());
			List<Short> guestCards = deckService.cardIdsForDeck(guestDeckId);
			CpuBattleState st = engine.newPvpBattle(hostCards, guestCards, rnd, defs);
			st.setPhase(st.isHumansTurn() ? BattlePhase.HUMAN_INPUT : BattlePhase.CPU_THINKING);
			if (st.getTurnStartedAtMs() <= 0) {
				st.setTurnStartedAtMs(System.currentTimeMillis());
			}
			m.setState(st);
		}
	}

	public boolean isStarted(String matchId) {
		PvpMatch m = matches.get(matchId);
		return m != null && m.getState() != null;
	}

	public CpuBattleStateDto stateForUser(String matchId, long userId) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null) {
				return null;
			}
			enforceTimeoutIfNeeded(st);
			CpuBattleStateDto base = cpuBattleService.stateDtoFromState(st);
			boolean host = m.getHostUserId() == userId;
			return adaptForViewer(base, st, host);
		}
	}

	public CpuBattleStateDto commit(String matchId, long userId, CpuBattleCommitRequest req) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null || st.isGameOver()) {
				return null;
			}
			enforceTimeoutIfNeeded(st);
			boolean host = m.getHostUserId() == userId;
			if (host) {
				if (!st.isHumansTurn() || st.getPhase() != BattlePhase.HUMAN_INPUT) {
					return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, true);
				}
				engine.humanTurnInteractive(st,
						req.levelUpRest(),
						req.levelUpDiscardInstanceIds(),
						req.levelUpStones(),
						req.deployInstanceId(),
						req.payCostStones(),
						req.payCostCardInstanceIds(),
						cardCatalogService.mapById());
			} else {
				if (st.isHumansTurn() || st.getPhase() != BattlePhase.CPU_THINKING) {
					return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, false);
				}
				engine.opponentTurnInteractive(st,
						req.levelUpRest(),
						req.levelUpDiscardInstanceIds(),
						req.levelUpStones(),
						req.deployInstanceId(),
						req.payCostStones(),
						req.payCostCardInstanceIds(),
						cardCatalogService.mapById());
			}
			return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, host);
		}
	}

	public CpuBattleStateDto resolve(String matchId, long userId) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null) {
				return null;
			}
			enforceTimeoutIfNeeded(st);
			boolean host = m.getHostUserId() == userId;
			engine.resolvePendingEffectAndAdvance(st, cardCatalogService.mapById(), new Random());
			return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, host);
		}
	}

	public CpuBattleStateDto choice(String matchId, long userId, CpuBattleChoiceRequest req) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null) {
				return null;
			}
			enforceTimeoutIfNeeded(st);
			boolean host = m.getHostUserId() == userId;
			PendingChoice pc = st.getPendingChoice();
			if (pc != null) {
				if (pc.isCpuSlotChooses()) {
					if (!host) {
						engine.applyCpuSlotChoiceAndAdvance(st,
								req != null && req.confirm(),
								req != null && req.pickedInstanceIds() != null ? req.pickedInstanceIds() : List.of(),
								cardCatalogService.mapById(),
								new Random());
					}
				} else if (pc.isForHuman()) {
					if (host) {
						engine.applyHumanChoiceAndAdvance(st,
								req != null && req.confirm(),
								req != null && req.pickedInstanceIds() != null ? req.pickedInstanceIds() : List.of(),
								cardCatalogService.mapById(),
								new Random());
					}
				}
			}
			return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, host);
		}
	}

	public CpuBattleStateDto timeoutTick(String matchId, long userId) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null) return null;
			enforceTimeoutIfNeeded(st);
			boolean host = m.getHostUserId() == userId;
			return adaptForViewer(cpuBattleService.stateDtoFromState(st), st, host);
		}
	}

	private void enforceTimeoutIfNeeded(CpuBattleState st) {
		if (st == null || st.isGameOver()) return;
		// 制限時間・時間切れ強制処理は無効化
		if (st.getTurnStartedAtMs() <= 0) {
			st.setTurnStartedAtMs(System.currentTimeMillis());
		}
	}

	public void surrender(String matchId, long userId) {
		PvpMatch m = require(matchId);
		synchronized (m) {
			requireParticipant(m, userId);
			CpuBattleState st = m.getState();
			if (st == null || st.isGameOver()) {
				return;
			}
			boolean host = m.getHostUserId() == userId;
			st.setGameOver(true);
			st.setHumanWon(!host);
			st.setPhase(BattlePhase.GAME_OVER);
			st.setLastMessage(host ? "ホストが降参しました" : "ゲストが降参しました");
			st.addLog(host ? "ホストが降参" : "ゲストが降参");
		}
	}

	public void removeMatch(String matchId) {
		matches.remove(matchId);
	}

	public void requireParticipant(PvpMatch m, long userId) {
		if (m.getHostUserId() != userId
				&& (m.getGuestUserId() == null || m.getGuestUserId() != userId)) {
			throw new IllegalStateException("この対戦に参加していません");
		}
	}

	private PvpMatch require(String id) {
		PvpMatch m = matches.get(id);
		if (m == null) {
			throw new IllegalArgumentException("対戦が見つかりません");
		}
		return m;
	}

	private CpuBattleStateDto adaptForViewer(CpuBattleStateDto base, CpuBattleState raw, boolean host) {
		if (!raw.isPvp()) {
			return base;
		}
		if (host) {
			return withPhaseForHost(base, raw);
		}
		return withPhaseForGuest(swapPerspective(base, raw), raw);
	}

	private CpuBattleStateDto withPhaseForHost(CpuBattleStateDto base, CpuBattleState raw) {
		if (raw.isGameOver()) {
			return base;
		}
		BattlePhase p = raw.getPhase();
		if (p == BattlePhase.CPU_THINKING) {
			return replacePhase(base, "OPPONENT_TURN");
		}
		if (p == BattlePhase.HUMAN_CHOICE) {
			PendingChoice pc = raw.getPendingChoice();
			if (pc != null && pc.isCpuSlotChooses()) {
				return replacePhase(base, "OPPONENT_TURN");
			}
		}
		return base;
	}

	private CpuBattleStateDto withPhaseForGuest(CpuBattleStateDto swapped, CpuBattleState raw) {
		if (raw.isGameOver()) {
			return swapped;
		}
		BattlePhase p = raw.getPhase();
		if (p == BattlePhase.HUMAN_INPUT || p == BattlePhase.HUMAN_EFFECT_PENDING) {
			return replacePhase(swapped, "OPPONENT_TURN");
		}
		if (p == BattlePhase.CPU_THINKING) {
			return replacePhase(swapped, "HUMAN_INPUT");
		}
		if (p == BattlePhase.CPU_EFFECT_PENDING) {
			return replacePhase(swapped, "HUMAN_EFFECT_PENDING");
		}
		if (p == BattlePhase.HUMAN_CHOICE) {
			PendingChoice pc = raw.getPendingChoice();
			if (pc != null && pc.isCpuSlotChooses()) {
				return replacePendingViewer(replacePhase(swapped, "HUMAN_CHOICE"), pc, false);
			}
			return replacePhase(swapped, "OPPONENT_TURN");
		}
		return swapped;
	}

	private CpuBattleStateDto swapPerspective(CpuBattleStateDto b, CpuBattleState raw) {
		PendingChoiceDto pc = b.pendingChoice();
		PendingChoiceDto npc = null;
		if (pc != null) {
			boolean guestActs = pc.cpuSlotChooses();
			npc = new PendingChoiceDto(
					pc.kind(),
					pc.prompt(),
					pc.forHuman(),
					pc.cpuSlotChooses(),
					pc.abilityDeployCode(),
					pc.stoneCost(),
					pc.optionInstanceIds(),
					guestActs
			);
		}
		com.example.nineuniverse.web.dto.PendingEffectDto pe = b.pendingEffect();
		com.example.nineuniverse.web.dto.PendingEffectDto npe = null;
		if (pe != null) {
			npe = new com.example.nineuniverse.web.dto.PendingEffectDto(
					!pe.ownerHuman(),
					pe.mainInstanceId(),
					pe.cardId(),
					pe.abilityDeployCode()
			);
		}
		return new CpuBattleStateDto(
				b.pvpMatch(),
				b.cpuLevel(),
				b.humanGoesFirst(),
				!b.humansTurn(),
				b.phase(),
				b.turnStartedAtMs(),
				b.activeTimeLimitSec(),
				b.activePenaltyStage(),
				b.cpuStones(),
				b.humanStones(),
				b.cpuDeck(),
				b.cpuHand(),
				b.cpuRest(),
				b.cpuBattle(),
				b.humanDeck(),
				b.humanHand(),
				b.humanRest(),
				b.humanBattle(),
				b.cpuBattlePower(),
				b.humanBattlePower(),
				raw.getCpuNextDeployBonus(),
				raw.getCpuNextElfOnlyBonus(),
				raw.getCpuNextDeployCostBonusTimes(),
				b.lastMessage(),
				b.gameOver(),
				!b.humanWon(),
				b.noLegalDeploy(),
				npe,
				npc,
				b.eventLog(),
				b.defs()
		);
	}

	private CpuBattleStateDto replacePhase(CpuBattleStateDto b, String phase) {
		return new CpuBattleStateDto(
				b.pvpMatch(), b.cpuLevel(), b.humanGoesFirst(), b.humansTurn(), phase,
				b.turnStartedAtMs(), b.activeTimeLimitSec(), b.activePenaltyStage(),
				b.humanStones(), b.cpuStones(), b.humanDeck(), b.humanHand(), b.humanRest(), b.humanBattle(),
				b.cpuDeck(), b.cpuHand(), b.cpuRest(), b.cpuBattle(),
				b.humanBattlePower(), b.cpuBattlePower(),
				b.humanNextDeployBonus(), b.humanNextElfOnlyBonus(), b.humanNextDeployCostBonusTimes(),
				b.lastMessage(), b.gameOver(), b.humanWon(), b.noLegalDeploy(),
				b.pendingEffect(), b.pendingChoice(), b.eventLog(), b.defs());
	}

	private CpuBattleStateDto replacePendingViewer(CpuBattleStateDto b, PendingChoice rawPc, boolean host) {
		PendingChoiceDto pc = b.pendingChoice();
		if (pc == null) {
			return b;
		}
		boolean may = host
				? (rawPc.isForHuman() && !rawPc.isCpuSlotChooses())
				: rawPc.isCpuSlotChooses();
		PendingChoiceDto npc = new PendingChoiceDto(
				pc.kind(), pc.prompt(), pc.forHuman(), pc.cpuSlotChooses(),
				pc.abilityDeployCode(), pc.stoneCost(), pc.optionInstanceIds(), may);
		return new CpuBattleStateDto(
				b.pvpMatch(), b.cpuLevel(), b.humanGoesFirst(), b.humansTurn(), b.phase(),
				b.turnStartedAtMs(), b.activeTimeLimitSec(), b.activePenaltyStage(),
				b.humanStones(), b.cpuStones(), b.humanDeck(), b.humanHand(), b.humanRest(), b.humanBattle(),
				b.cpuDeck(), b.cpuHand(), b.cpuRest(), b.cpuBattle(),
				b.humanBattlePower(), b.cpuBattlePower(),
				b.humanNextDeployBonus(), b.humanNextElfOnlyBonus(), b.humanNextDeployCostBonusTimes(),
				b.lastMessage(), b.gameOver(), b.humanWon(), b.noLegalDeploy(),
				b.pendingEffect(), npc, b.eventLog(), b.defs());
	}
}
