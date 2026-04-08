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
	/** 人間側の「ターン開始」回数（先攻1ターン目の例外判定用） */
	private int humanTurnStarts;
	/** CPU側の「ターン開始」回数（先攻1ターン目の例外判定用） */
	private int cpuTurnStarts;
	private BattlePhase phase = BattlePhase.HUMAN_INPUT;
	/** 配置後、効果表示→resolve で処理するための保留 */
	private PendingEffect pendingEffect;
	/** 人間の選択が必要な場合の保留（任意効果/対象選択など） */
	private PendingChoice pendingChoice;
	/** 巫女: 次に配置するファイター強さ+2 */
	private int humanNextDeployBonus;
	private int cpuNextDeployBonus;
	/** 妖精: 次に配置するエルフなら +4 */
	private int humanNextElfOnlyBonus;
	private int cpuNextElfOnlyBonus;
	/** 科学者: 強さ入れ替え（次のターン終了まで） */
	private boolean powerSwapActive;

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
