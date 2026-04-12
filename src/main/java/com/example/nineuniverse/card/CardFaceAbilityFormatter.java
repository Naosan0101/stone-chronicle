package com.example.nineuniverse.card;

import com.example.nineuniverse.CanonicalLibraryCardText;
import com.example.nineuniverse.domain.AbilityBlockView;
import java.util.List;

/**
 * カード面の効果表示。本文は {@link CanonicalLibraryCardText} の1行原本から取り出し、
 * 見出しだけ「配置：」「配置:」→〈配置〉、「常時：」「常時:」→〈常時〉にし、それ以外の文字は改変しない。
 */
public final class CardFaceAbilityFormatter {

	private CardFaceAbilityFormatter() {
	}

	public static List<AbilityBlockView> blocksForCardId(short cardId) {
		String full = CanonicalLibraryCardText.lineForId(cardId);
		if (full == null || full.isEmpty()) {
			return List.of(new AbilityBlockView("", "効果なし。"));
		}
		return blocksFromCanonicalLine(full);
	}

	/**
	 * ライブラリのマウスオーバー用。「・名前/レア度/コスト/強さ/」部分は除き、
	 * 「配置：」「配置:」は行頭の {@code 〈配置〉} に、「常時：」「常時:」は {@code 〈常時〉} に置き換えたテキスト。
	 */
	public static String tooltipAbilityTextForCardId(short cardId) {
		StringBuilder sb = new StringBuilder();
		for (AbilityBlockView b : blocksForCardId(cardId)) {
			String h = b.getHeadline();
			if (h != null && !h.isEmpty()) {
				sb.append(h).append('\n');
			}
			sb.append(b.getBody());
		}
		return sb.toString();
	}

	static List<AbilityBlockView> blocksFromCanonicalLine(String line) {
		String s = line.startsWith("・") ? line.substring(1) : line;
		if (s.contains("/効果なし。") || s.contains("/能力なし。")) {
			return List.of(new AbilityBlockView("", "効果なし。"));
		}
		int idx = s.indexOf("/配置：");
		if (idx >= 0) {
			return List.of(new AbilityBlockView("〈配置〉", s.substring(idx + "/配置：".length())));
		}
		idx = s.indexOf("/配置:");
		if (idx >= 0) {
			return List.of(new AbilityBlockView("〈配置〉", s.substring(idx + "/配置:".length())));
		}
		idx = s.indexOf("/常時：");
		if (idx >= 0) {
			return List.of(new AbilityBlockView("〈常時〉", s.substring(idx + "/常時：".length())));
		}
		idx = s.indexOf("/常時:");
		if (idx >= 0) {
			return List.of(new AbilityBlockView("〈常時〉", s.substring(idx + "/常時:".length())));
		}
		return List.of(new AbilityBlockView("", s));
	}
}
