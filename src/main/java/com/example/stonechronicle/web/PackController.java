package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.service.LibraryService;
import com.example.stonechronicle.service.PackService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/pack")
@RequiredArgsConstructor
public class PackController {

	private final PackService packService;
	private final AppUserMapper appUserMapper;
	private final LibraryService libraryService;

	@GetMapping
	public String page(Model model) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("packImage", GameConstants.packImageUrl());
		model.addAttribute("coins", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		Object pulledIds = model.asMap().get("pulledCardIds");
		if (pulledIds instanceof List<?> raw && !raw.isEmpty()) {
			List<Short> ids = new ArrayList<>();
			for (Object o : raw) {
				if (o instanceof Short s) {
					ids.add(s);
				} else if (o instanceof Number n) {
					ids.add(n.shortValue());
				}
			}
			if (!ids.isEmpty()) {
				model.addAttribute("pulledFaces", libraryService.displayFacesForCardIds(ids));
			}
		}
		return "pack";
	}

	@PostMapping("/open")
	public String open(RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			var pulled = packService.openPack(uid);
			List<Short> ids = pulled.stream().map(c -> c.getId()).toList();
			ra.addFlashAttribute("pulledCardIds", ids);
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
		}
		return "redirect:/pack";
	}
}
