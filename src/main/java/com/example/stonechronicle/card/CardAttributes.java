package com.example.stonechronicle.card;

import com.example.stonechronicle.domain.CardDefinition;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 種族コードの判定。複合種族は {@code ELF_UNDEAD} のようにアンダースコア区切り（順不同は想定しない）。
 */
public final class CardAttributes {

	private CardAttributes() {
	}

	/** ソート・一覧の「代表種族」（複合は先頭セグメント） */
	public static String primarySegment(String attribute) {
		if (attribute == null || attribute.isBlank()) {
			return "";
		}
		int u = attribute.indexOf('_');
		return u < 0 ? attribute : attribute.substring(0, u);
	}

	public static Set<String> segments(String attribute) {
		if (attribute == null || attribute.isBlank()) {
			return Set.of();
		}
		return Arrays.stream(attribute.split("_"))
				.filter(s -> !s.isEmpty())
				.collect(Collectors.toCollection(LinkedHashSet::new));
	}

	public static boolean hasAttribute(CardDefinition def, String tribe) {
		if (def == null || tribe == null) {
			return false;
		}
		return hasAttribute(def.getAttribute(), tribe);
	}

	public static boolean hasAttribute(String attribute, String tribe) {
		if (tribe == null) {
			return false;
		}
		if (attribute == null || attribute.isBlank()) {
			return false;
		}
		if (tribe.equals(attribute)) {
			return true;
		}
		return segments(attribute).contains(tribe);
	}
}
