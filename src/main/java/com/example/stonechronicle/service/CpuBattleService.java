package com.example.stonechronicle.service;

import com.example.stonechronicle.battle.CpuBattleEngine;
import com.example.stonechronicle.battle.CpuBattleState;
import com.example.stonechronicle.domain.CardDefinition;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Random;
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
}
