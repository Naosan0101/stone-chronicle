package com.example.stonechronicle.battle;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class CpuBattleState implements Serializable {
	private int cpuLevel;
	private boolean humanGoesFirst;
	private boolean humansTurn;

	private List<BattleCard> humanDeck = new ArrayList<>();
	private List<BattleCard> humanHand = new ArrayList<>();
	private List<BattleCard> humanRest = new ArrayList<>();
	private ZoneFighter humanBattle;
	private int humanStones;

	private List<BattleCard> cpuDeck = new ArrayList<>();
	private List<BattleCard> cpuHand = new ArrayList<>();
	private List<BattleCard> cpuRest = new ArrayList<>();
	private ZoneFighter cpuBattle;
	private int cpuStones;

	private String lastMessage;
	private boolean gameOver;
	private boolean humanWon;
	private List<String> eventLog = new ArrayList<>();

	public void addLog(String line) {
		eventLog.add(line);
		if (eventLog.size() > 40) {
			eventLog.remove(0);
		}
	}
}
