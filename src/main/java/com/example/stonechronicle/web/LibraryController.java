package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.service.LibraryService;
import jakarta.servlet.http.HttpServletRequest;
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
	public String library(Model model, HttpServletRequest request) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("cards", libraryService.library(uid));
		String cp = request.getContextPath();
		model.addAttribute("contextPath", cp != null ? cp : "");
		model.addAttribute("cardPlateUrl", GameConstants.CARD_LAYER_BASE);
		model.addAttribute("cardDataUrl", GameConstants.CARD_LAYER_DATA);
		return "library";
	}
}
