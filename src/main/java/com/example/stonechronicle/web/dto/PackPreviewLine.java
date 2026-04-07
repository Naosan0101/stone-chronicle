package com.example.stonechronicle.web.dto;

import lombok.Value;

@Value
public class PackPreviewLine {
	String name;
	String rarityLabel;
	/** CSS 用: C / R / Ep / Reg */
	String rarityCode;
}
