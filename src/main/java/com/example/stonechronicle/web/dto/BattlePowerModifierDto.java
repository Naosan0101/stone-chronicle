package com.example.stonechronicle.web.dto;

/**
 * バトルゾーンで表示強さが基礎値から変わるとき、その要因となったカード（または説明）を UI へ渡す。
 */
public record BattlePowerModifierDto(
		Short sourceCardId,
		String label
) {
}
