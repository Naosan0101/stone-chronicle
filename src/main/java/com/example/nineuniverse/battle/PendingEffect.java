package com.example.nineuniverse.battle;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingEffect implements Serializable {
	/** true: 人間が配置したファイターの配置効果 / false: CPU */
	private boolean ownerHuman;
	private String mainInstanceId;
	private short cardId;
	/** CardDefinition.abilityDeployCode（配置能力の識別） */
	private String abilityDeployCode;
	/** 配置効果の本体処理が既に適用済みか（選択待ちで二重適用しないため） */
	private boolean applied;
}

