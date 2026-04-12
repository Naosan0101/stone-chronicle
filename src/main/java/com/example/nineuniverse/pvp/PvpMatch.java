package com.example.nineuniverse.pvp;

import com.example.nineuniverse.battle.CpuBattleState;
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
