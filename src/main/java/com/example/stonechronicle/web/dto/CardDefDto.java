package com.example.stonechronicle.web.dto;

import java.util.List;

public record CardDefDto(
		short id,
		String name,
		short cost,
		short basePower,
		String attribute,
		/** C / R / Ep / Reg（ライブラリの card-face と同じ） */
		String rarity,
		String rarityLabel,
		String imageFile,
		String abilityDeployCode,
		String attributeLabelJa,
		List<String> attributeLabelLines,
		String layerBasePath,
		String layerBarPath,
		String layerFramePath,
		String layerPortraitPath,
		List<AbilityBlockDto> abilityBlocks
) {
}
