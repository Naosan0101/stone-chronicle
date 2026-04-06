package com.example.stonechronicle.web;

import com.example.stonechronicle.service.DeckService;
import com.example.stonechronicle.service.LibraryService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/decks")
@RequiredArgsConstructor
public class DeckController {

	private final DeckService deckService;
	private final LibraryService libraryService;

	@GetMapping
	public String list(Model model) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("decks", deckService.listDecks(uid));
		return "decks-list";
	}

	@GetMapping("/new")
	public String newForm(Model model) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("library", libraryService.library(uid));
		model.addAttribute("deckName", "");
		model.addAttribute("selectedIds", List.<Short>of());
		model.addAttribute("editDeckId", null);
		return "deck-edit";
	}

	@GetMapping("/{id}/edit")
	public String edit(@PathVariable long id, Model model) {
		long uid = CurrentUser.require().getId();
		var deck = deckService.requireDeck(uid, id);
		model.addAttribute("library", libraryService.library(uid));
		model.addAttribute("deckName", deck.getName());
		model.addAttribute("selectedIds", deckService.cardIdsForDeck(id));
		model.addAttribute("editDeckId", id);
		return "deck-edit";
	}

	@PostMapping("/save")
	public String save(@RequestParam String name, @RequestParam String cardIds,
			@RequestParam(required = false) Long editDeckId, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		try {
			List<Short> ids;
			try {
				ids = parseIds(cardIds);
			} catch (NumberFormatException nfe) {
				throw new IllegalArgumentException("カードIDの形式が不正です");
			}
			if (editDeckId != null) {
				deckService.updateDeck(uid, editDeckId, name, ids);
				ra.addFlashAttribute("msg", "デッキを保存しました");
			} else {
				deckService.createDeck(uid, name, ids, true);
				ra.addFlashAttribute("msg", "デッキを作成しました");
			}
			return "redirect:/decks";
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
			return editDeckId != null ? "redirect:/decks/" + editDeckId + "/edit" : "redirect:/decks/new";
		}
	}

	@PostMapping("/{id}/delete")
	public String delete(@PathVariable long id, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		try {
			deckService.deleteDeck(uid, id);
			ra.addFlashAttribute("msg", "デッキを削除しました");
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
		}
		return "redirect:/decks";
	}

	private static List<Short> parseIds(String cardIds) {
		if (cardIds == null || cardIds.isBlank()) {
			return new ArrayList<>();
		}
		return Arrays.stream(cardIds.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(Short::parseShort)
				.collect(Collectors.toList());
	}
}
