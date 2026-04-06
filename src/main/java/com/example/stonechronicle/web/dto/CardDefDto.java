package com.example.stonechronicle.web.dto;

public record CardDefDto(
		short id,
		String name,
		short cost,
		short basePower,
		String attribute,
		String imageFile,
		String abilityDeployCode
) {
}

