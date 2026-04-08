package com.example.stonechronicle.battle;

public enum ChoiceKind {
	CONFIRM_OPTIONAL_STONE, // confirm=true to pay cost, false to skip
	SELECT_ONE_FROM_HAND_TO_REST,
	SELECT_SWAP_REST_AND_HAND, // requires 2 ids: restId, handId
	SELECT_ONE_FROM_REST_TO_HAND
}

