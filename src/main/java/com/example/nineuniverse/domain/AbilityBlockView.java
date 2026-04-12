package com.example.nineuniverse.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** カード面の効果表示用（〈配置〉／〈常時〉＋本文） */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbilityBlockView {
	/** 例: 〈配置〉。空なら見出しのみ出さない */
	private String headline;
	private String body;
}
