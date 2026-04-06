package com.example.stonechronicle.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AppUser {
	private Long id;
	private String username;
	private String passwordHash;
	private Integer coins;
	private LocalDate lastMissionDate;
	private LocalDateTime createdAt;
}
