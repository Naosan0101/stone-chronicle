package com.example.stonechronicle.battle;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleCard implements Serializable {
	private String instanceId;
	private short cardId;
}
