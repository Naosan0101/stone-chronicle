package com.example.stonechronicle.domain;

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
	/** ライブラリ詳細用（名前・コスト・強さと分けて表示する能力文） */
	private String libraryAbilityText;
}
