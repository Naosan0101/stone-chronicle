package com.example.stonechronicle.pvp;

import com.example.stonechronicle.battle.CpuBattleState;
import lombok.Data;

@Data
public class PvpMatch {
	private final String id;
	private final long hostUserId;
	private final long hostDeckId;
	private Long guestUserId;
	private Long guestDeckId;
	private CpuBattleState state;
}
