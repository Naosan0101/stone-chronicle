package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.service.PackService;
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

	@GetMapping
	public String page(Model model) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("packImage", GameConstants.CARD_IMAGE_PREFIX + GameConstants.CARD_PACK_FILE);
		model.addAttribute("coins", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		return "pack";
	}

	@PostMapping("/open")
	public String open(RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			var pulled = packService.openPack(uid);
			ra.addFlashAttribute("pulled", pulled);
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
		}
		return "redirect:/pack";
	}
}
