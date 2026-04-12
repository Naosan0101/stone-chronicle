package com.example.nineuniverse.card;

import java.util.Arrays;
import java.util.List;

/** 種族コード → 表示名（カード面・UI 共通） */
public final class CardAttributeLabels {

	private CardAttributeLabels() {
	}

	/** 複合は先頭から順（例: {@code ELF_UNDEAD} → エルフ, アンデッド） */
	public static List<String> japaneseNameLines(String attribute) {
		if (attribute == null || attribute.isBlank()) {
			return List.of();
		}
		if (!attribute.contains("_")) {
			return List.of(singleJapaneseName(attribute));
		}
		return Arrays.stream(attribute.split("_"))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(CardAttributeLabels::singleJapaneseName)
				.toList();
	}

	public static String japaneseName(String attribute) {
		List<String> lines = japaneseNameLines(attribute);
		if (lines.isEmpty()) {
			return "";
		}
		if (lines.size() == 1) {
			return lines.get(0);
		}
		return String.join(" ", lines);
	}

	private static String singleJapaneseName(String code) {
		return switch (code) {
			case "HUMAN" -> "人間";
			case "ELF" -> "エルフ";
			case "UNDEAD" -> "アンデッド";
			case "DRAGON" -> "ドラゴン";
			default -> code;
		};
	}
}
