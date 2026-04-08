package com.example.stonechronicle.battle;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ZoneFighter implements Serializable {
	private BattleCard main;
	private List<BattleCard> costUnder = new ArrayList<>();
	/** この配置でレベルアップ等により一時的に加算した強さ（ターン終了でリセット） */
	private int temporaryPowerBonus;
	/** ふわふわゴースト等: 次にレストへ置かれる代わりに手札へ戻る */
	private boolean returnToHandOnKnock;
}
