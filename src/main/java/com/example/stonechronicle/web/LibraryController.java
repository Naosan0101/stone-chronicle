package com.example.stonechronicle.web;

import com.example.stonechronicle.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/library")
@RequiredArgsConstructor
public class LibraryController {

	private final LibraryService libraryService;

	@GetMapping
	public String library(Model model) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("cards", libraryService.library(uid));
		return "library";
	}
}
