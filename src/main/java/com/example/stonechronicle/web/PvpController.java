package com.example.stonechronicle.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/battle/pvp")
public class PvpController {

	@GetMapping
	public String comingSoon() {
		return "pvp-placeholder";
	}
}
