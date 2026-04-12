package com.example.nineuniverse.web;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.domain.CardDefinition;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.service.LibraryService;
import com.example.nineuniverse.service.PackService;
import com.example.nineuniverse.service.PackService.PackType;
import com.example.nineuniverse.web.dto.PackPreviewLine;
import com.example.nineuniverse.web.dto.PackRarityRateRow;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
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

	private static final List<String> PACK_ART_CLASSPATH_FILES = List.of(
			"static/images/cards/スタンダードパック.PNG",
			"static/images/cards/風吹く丘パック.PNG",
			"static/images/cards/邪悪なる脅威パック.PNG");

	private static final String CARD_BACK_CLASSPATH = "static/images/cards/card-back.PNG";

	@GetMapping
	public String page(Model model) {
		long uid = CurrentUser.require().getId();
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("packArtCacheKey", packArtCacheKey());
		model.addAttribute("standardPackImage", GameConstants.packArtImageUrl("スタンダードパック.PNG"));
		model.addAttribute("windyHillPackImage", GameConstants.packArtImageUrl("風吹く丘パック.PNG"));
		model.addAttribute("evilThreatPackImage", GameConstants.packArtImageUrl("邪悪なる脅威パック.PNG"));
		model.addAttribute("gems", fresh != null && fresh.getCoins() != null ? fresh.getCoins() : 0);
		model.addAttribute("packRarityRates", PACK_RARITY_RATES);
		model.addAttribute("standardPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.STANDARD)));
		model.addAttribute("windyHillPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.WINDY_HILL)));
		model.addAttribute("evilThreatPackPreview", toPreviewLines(packService.sortedEligibleCardsForPreview(PackType.EVIL_THREAT)));
		return "pack-buy";
	}

	/** 画像差し替え後もブラウザキャッシュで古い絵が残らないよう、最新の lastModified をクエリに付ける。 */
	private static long packArtCacheKey() {
		long max = 0L;
		for (String path : PACK_ART_CLASSPATH_FILES) {
			var r = new ClassPathResource(path);
			if (!r.exists()) {
				continue;
			}
			try {
				max = Math.max(max, r.lastModified());
			} catch (IOException ignored) {
				// 取得できなければ他ファイルの値のみ使う
			}
		}
		return max;
	}

	private static long cardBackCacheKey() {
		var r = new ClassPathResource(CARD_BACK_CLASSPATH);
		if (!r.exists()) {
			return 0L;
		}
		try {
			return r.lastModified();
		} catch (IOException e) {
			return 0L;
		}
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
		model.addAttribute("cardBackCacheKey", cardBackCacheKey());
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
