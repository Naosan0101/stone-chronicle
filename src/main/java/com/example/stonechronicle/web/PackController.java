package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.service.LibraryService;
import com.example.stonechronicle.service.PackService;
import com.example.stonechronicle.service.PackService.PackType;
import com.example.stonechronicle.web.dto.PackPreviewLine;
import com.example.stonechronicle.web.dto.PackRarityRateRow;
import java.util.ArrayList;
import java.util.List;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/pack")
@RequiredArgsConstructor
public class PackController {

	private static final List<PackRarityRateRow> PACK_RARITY_RATES = List.of(
			new PackRarityRateRow("レジェンダリー", "3%"),
			new PackRarityRateRow("エピック", "17%"),
			new PackRarityRateRow("レア", "30%"),
			new PackRarityRateRow("コモン", "50%"));

	private final PackService packService;
	private final AppUserMapper appUserMapper;
	private final LibraryService libraryService;

	@GetMapping
	public String page(Model model) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("packImage", GameConstants.packImageUrl());
		model.addAttribute("gems", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		model.addAttribute("packRarityRates", PACK_RARITY_RATES);
		model.addAttribute("standardPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.STANDARD)));
		model.addAttribute("windyHillPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.WINDY_HILL)));
		model.addAttribute("evilThreatPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.EVIL_THREAT)));
		return "pack-buy";
	}

	private static List<PackPreviewLine> toPreviewLines(List<CardDefinition> cards) {
		return cards.stream()
				.map(c -> new PackPreviewLine(
						c.getName() != null ? c.getName() : "",
						rarityLabelJa(c.getRarity()),
						rarityCodeForCss(c.getRarity())))
				.toList();
	}

	private static String rarityCodeForCss(String code) {
		if (code == null || code.isBlank()) {
			return "C";
		}
		String t = code.trim();
		if ("Reg".equalsIgnoreCase(t)) {
			return "Reg";
		}
		if ("Ep".equalsIgnoreCase(t)) {
			return "Ep";
		}
		if ("R".equalsIgnoreCase(t)) {
			return "R";
		}
		return "C";
	}

	private static String rarityLabelJa(String code) {
		if (code == null || code.isBlank()) {
			return "コモン";
		}
		return switch (code.trim()) {
			case "Reg" -> "レジェンダリー";
			case "Ep" -> "エピック";
			case "R" -> "レア";
			case "C" -> "コモン";
			default -> code;
		};
	}

	@PostMapping("/buy")
	public String buy(@RequestParam(name = "type", required = false) String type, HttpSession session,
			RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			PackType t = parsePackType(type);
			var pulled = packService.openPack(uid, t);
			List<Short> ids = pulled.stream().map(c -> c.getId()).toList();
			session.setAttribute("pack_last_pulled_ids", ids);
			session.setAttribute("pack_last_type", t != null ? t.name() : PackType.STANDARD.name());
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/pack";
		}
		return "redirect:/pack/opening";
	}

	@GetMapping("/opening")
	public String opening(Model model, HttpSession session, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("gems", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		model.addAttribute("cardBackUrl", GameConstants.cardBackUrl());
		Object idsObj = session.getAttribute("pack_last_pulled_ids");
		List<Short> ids = coerceIds(idsObj);
		if (ids.isEmpty()) {
			ra.addFlashAttribute("error", "開封中のパックがありません");
			return "redirect:/pack";
		}
		model.addAttribute("pulledFaces", libraryService.displayFacesForCardIds(ids));
		return "pack-opening";
	}

	@GetMapping("/result")
	public String result(Model model, HttpSession session, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("gems", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		model.addAttribute("packImage", GameConstants.packImageUrl());
		Object idsObj = session.getAttribute("pack_last_pulled_ids");
		List<Short> ids = coerceIds(idsObj);
		if (ids.isEmpty()) {
			ra.addFlashAttribute("error", "結果表示できるパックがありません");
			return "redirect:/pack";
		}
		model.addAttribute("cards", libraryService.displayFacesForCardIds(ids));
		model.addAttribute("contextPath", "");
		model.addAttribute("cardPlateUrl", GameConstants.CARD_LAYER_BASE);
		model.addAttribute("cardDataUrl", GameConstants.CARD_LAYER_DATA);
		return "pack-result";
	}

	private static PackType parsePackType(String raw) {
		if (raw == null || raw.isBlank()) return PackType.STANDARD;
		String s = raw.trim().toUpperCase();
		return switch (s) {
			case "STANDARD" -> PackType.STANDARD;
			case "WINDY_HILL" -> PackType.WINDY_HILL;
			case "EVIL_THREAT" -> PackType.EVIL_THREAT;
			default -> PackType.STANDARD;
		};
	}

	@SuppressWarnings("unchecked")
	private static List<Short> coerceIds(Object pulledIds) {
		if (!(pulledIds instanceof List<?> raw) || raw.isEmpty()) {
			return List.of();
		}
		List<Short> ids = new ArrayList<>();
		for (Object o : raw) {
			if (o instanceof Short s) {
				ids.add(s);
			} else if (o instanceof Number n) {
				ids.add(n.shortValue());
			}
		}
		return ids;
	}
}
