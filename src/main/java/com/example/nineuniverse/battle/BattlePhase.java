package com.example.nineuniverse.battle;

public enum BattlePhase {
	/** 人間の入力待ち（カード選択/レベルアップ/支払い/配置） */
	HUMAN_INPUT,
	/** 配置後、効果表示の待ち（人間側の配置能力/任意効果/選択を含む） */
	HUMAN_EFFECT_PENDING,
	/** CPUの思考待ち（クライアント側で3〜7秒待機後に /cpu-step を叩く） */
	CPU_THINKING,
	/** CPU配置後、効果表示の待ち（その後 /resolve で処理を進める） */
	CPU_EFFECT_PENDING,
	/** 選択や確認の入力待ち（人間が決める必要がある） */
	HUMAN_CHOICE,
	/** 勝敗確定 */
	GAME_OVER
}

