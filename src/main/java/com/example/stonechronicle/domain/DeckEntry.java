package com.example.stonechronicle.domain;

import lombok.Data;

@Data
public class DeckEntry {
	private Long deckId;
	private Short slot;
	private Short cardId;
}
