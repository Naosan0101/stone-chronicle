package com.example.nineuniverse.web;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.service.LibraryService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HowToPlayController {

	private static final short SAMPLE_CARD_KARYUDO_ID = 9;

	private final LibraryService libraryService;

	@GetMapping("/how-to-play")
	public String howToPlay(Model model, HttpServletRequest request) {
		var faces = libraryService.displayFacesForCardIds(List.of(SAMPLE_CARD_KARYUDO_ID));
		if (!faces.isEmpty()) {
			model.addAttribute("sampleCard", faces.get(0));
		}
		String cp = request.getContextPath();
		model.addAttribute("contextPath", cp != null ? cp : "");
		model.addAttribute("cardPlateUrl", GameConstants.CARD_LAYER_BASE);
		model.addAttribute("cardDataUrl", GameConstants.CARD_LAYER_DATA);
		return "how-to-play";
	}
}
