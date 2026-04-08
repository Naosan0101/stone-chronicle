package com.example.stonechronicle.battle;

import java.io.Serializable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingChoice implements Serializable {
	private ChoiceKind kind;
	private String prompt;
	/** 人間に求める選択か（CPUは常に自動判断） */
	private boolean forHuman;
	/** 関連する配置効果コード（任意） */
	private String abilityDeployCode;
	/** 支払いストーン数（任意効果の確認など） */
	private int stoneCost;
	/** 選択肢の instanceId（どのゾーンのものかは kind に依存） */
	private List<String> optionInstanceIds;
}

