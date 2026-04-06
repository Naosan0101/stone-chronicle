package com.example.stonechronicle.domain;

import lombok.Data;

@Data
public class CardDefinition {
	private Short id;
	private String name;
	private Short cost;
	private Short basePower;
	private String attribute;
	private String imageFile;
	private String abilityDeployCode;
	private String abilityPassiveCode;
	private String deployHelp;
	private String passiveHelp;
}
