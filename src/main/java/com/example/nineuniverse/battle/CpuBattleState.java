package com.example.nineuniverse.battle;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class CpuBattleState implements Serializable {
	/** 対人戦（ゲストは状態上の cpu 側だが人間が操作する） */
	private boolean pvp;
	private int cpuLevel;
	private boolean humanGoesFirst;
	private boolean humansTurn;
	/** 人間側の「ターン開始」回数（先攻1ターン目の例外判定用） */
	private int humanTurnStarts;
	/** CPU側の「ターン開始」回数（先攻1ターン目の例外判定用） */
	private int cpuTurnStarts;
	private BattlePhase phase = BattlePhase.HUMAN_INPUT;
	/** 現在の手番の開始時刻（ms）。持ち時間カウント用（HUMAN_INPUT / CPU_THINKING のみ進む） */
	private long turnStartedAtMs;
	/**
	 * 持ち時間ペナルティ段階（0:90s → 1:60s → 2:30s → 3:15s。段階3で時間切れしたら強制降参）
	 * human はホスト側、cpu はゲスト側（CPU戦では cpu=CPU）。
	 */
	private int humanTimePenaltyStage;
	private int cpuTimePenaltyStage;
	/** 配置後、効果表示→resolve で処理するための保留 */
	private PendingEffect pendingEffect;
	/** 人間の選択が必要な場合の保留（任意効果/対象選択など） */
	private PendingChoice pendingChoice;
	/** エルフの巫女: 次に配置するファイター強さ+1 */
	private int humanNextDeployBonus;
	private int cpuNextDeployBonus;
	/** ウッドエルフ: 次に配置するエルフなら +3 */
	private int humanNextElfOnlyBonus;
	private int cpuNextElfOnlyBonus;
	/** 隊長: 次に配置するファイターのコストぶん強化（重ねがけ可） */
	private int humanNextDeployCostBonusTimes;
	private int cpuNextDeployCostBonusTimes;
	/** 科学者: 強さ入れ替え（次のターン終了まで） */
	private boolean powerSwapActive;
	/** 古竜: 次の相手ターン終了までの一時強化（自分のレストのエルフ枚数ぶん） */
	private int humanKoryuBonus;
	private int cpuKoryuBonus;
	/** 「能力後も相手以上になれない」場合の確認用スナップショット（キャンセルで巻き戻す） */
	private CpuBattleState confirmAcceptLossSnapshot;

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
