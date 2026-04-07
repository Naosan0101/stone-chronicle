package com.example.stonechronicle.domain;

import java.util.List;
import lombok.Data;

@Data
public class LibraryCardView {
	private Short id;
	private String name;
	private String attribute;
	private String imagePath;
	private int quantity;
	private boolean owned;
	private short cost;
	private short basePower;
	/** ツールチップ「効果」用：・名前/コスト/強さ/省略、配置→〈配置〉・常時→〈常時〉 */
	private String libraryAbilityText;
	/** モーダル用 data：公式1行そのまま */
	private String canonicalAbilityLine;
	/** 種族バー上に表示する日本語 */
	private String attributeLabelJa;
	/** カード面の種族（複合は複数行・順序あり） */
	private List<String> attributeLabelLines;
	/** data 属性用: {@code attributeLabelLines} を {@code |} で連結（Thymeleaf で T() 禁止のためサーバ側で生成） */
	private String attributeLabelPipe = "";
	/** ③種族バー画像 URL */
	private String barImagePath;
	/** ①④レイヤー（テンプレ参照用） */
	private String layerBasePath;
	/** キャライラスト（DB image_file、レイヤー用） */
	private String layerPortraitPath;
	private String layerFramePath;
	/** DB のヘルプ文（モーダル用 data 属性など） */
	private String deployHelp;
	private String passiveHelp;
	/** ⑤能力（見出し＋本文） */
	private List<AbilityBlockView> abilityBlocks;
	/** カード面コスト欄の class（Thymeleaf フラグメント内の複雑な式を避ける） */
	private String costFaceCssClass = "card-face__cost";
	/** カード面強さ欄の class */
	private String powerFaceCssClass = "card-face__power";
}
