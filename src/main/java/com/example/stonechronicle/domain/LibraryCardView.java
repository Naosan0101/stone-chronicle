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
}
