package com.example.nineuniverse.battle;

import java.io.Serializable;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PendingChoice implements Serializable {
	private ChoiceKind kind;
	private String prompt;
	/** ホスト側（状態上の human スロット）が応答する選択か */
	private boolean forHuman;
	/** 対人戦でゲスト側（状態上の cpu スロット）が応答する選択 */
	private boolean cpuSlotChooses;
	/** 関連する配置効果コード（任意） */
	private String abilityDeployCode;
	/** 支払いストーン数（任意効果の確認など） */
	private int stoneCost;
	/** 選択肢の instanceId（どのゾーンのものかは kind に依存） */
	private List<String> optionInstanceIds;

	public PendingChoice(ChoiceKind kind, String prompt, boolean forHuman, String abilityDeployCode, int stoneCost,
			List<String> optionInstanceIds) {
		this(kind, prompt, forHuman, abilityDeployCode, stoneCost, optionInstanceIds, false);
	}

	public PendingChoice(ChoiceKind kind, String prompt, boolean forHuman, String abilityDeployCode, int stoneCost,
			List<String> optionInstanceIds, boolean cpuSlotChooses) {
		this.kind = kind;
		this.prompt = prompt;
		this.forHuman = forHuman;
		this.abilityDeployCode = abilityDeployCode;
		this.stoneCost = stoneCost;
		this.optionInstanceIds = optionInstanceIds;
		this.cpuSlotChooses = cpuSlotChooses;
	}
}

