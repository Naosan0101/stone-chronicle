package com.example.nineuniverse.domain;

import lombok.Data;

@Data
public class CardDefinition {
	private Short id;
	private String name;
	private Short cost;
	private Short basePower;
	private String attribute;
	private String rarity;
	private String imageFile;
	private String abilityDeployCode;
	private String abilityPassiveCode;
	private String deployHelp;
	private String passiveHelp;
}
