package com.example.nineuniverse.web;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.service.DeckService;
import com.example.nineuniverse.service.PvpBattleService;
import com.example.nineuniverse.web.dto.CpuBattleChoiceRequest;
import com.example.nineuniverse.web.dto.CpuBattleCommitRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
@RequestMapping("/battle/pvp")
@RequiredArgsConstructor
public class PvpController {

	private final PvpBattleService pvpBattleService;
	private final DeckService deckService;

	@GetMapping
	public String menu(Model model) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("decks", deckService.listDecks(uid));
		return "pvp-menu";
	}

	@PostMapping("/room")
	public String createRoom(@RequestParam long deckId, RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			var m = pvpBattleService.createWaitingRoom(uid, deckId);
			return "redirect:/battle/pvp/room/" + m.getId();
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/battle/pvp";
		}
	}

	@GetMapping("/room/{id}")
	public String hostRoom(@PathVariable String id, Model model, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		var m = pvpBattleService.get(id);
		if (m == null) {
			ra.addFlashAttribute("error", "対戦が見つかりません");
			return "redirect:/battle/pvp";
		}
		if (m.getHostUserId() != uid) {
			return "redirect:/battle/pvp/join/" + id;
		}
		if (pvpBattleService.isStarted(id)) {
			return "redirect:/battle/pvp/play/" + id;
		}
		model.addAttribute("matchId", id);
		return "pvp-wait";
	}

	@GetMapping("/join/{id}")
	public String joinForm(@PathVariable String id, Model model, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		var m = pvpBattleService.get(id);
		if (m == null) {
			ra.addFlashAttribute("error", "対戦が見つかりません");
			return "redirect:/battle/pvp";
		}
		if (m.getHostUserId() == uid) {
			return "redirect:/battle/pvp/room/" + id;
		}
		if (pvpBattleService.isStarted(id)) {
			ra.addFlashAttribute("error", "すでに対戦が始まっています");
			return "redirect:/battle/pvp";
		}
		model.addAttribute("matchId", id);
		model.addAttribute("decks", deckService.listDecks(uid));
		return "pvp-join";
	}

	@PostMapping("/join/{id}")
	public String join(@PathVariable String id, @RequestParam long deckId, RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			pvpBattleService.join(id, uid, deckId);
			return "redirect:/battle/pvp/play/" + id;
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/battle/pvp/join/" + id;
		}
	}

	@GetMapping("/play/{id}")
	public String play(@PathVariable String id, Model model, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		var m = pvpBattleService.get(id);
		if (m == null) {
			ra.addFlashAttribute("error", "対戦が見つかりません");
			return "redirect:/battle/pvp";
		}
		try {
			pvpBattleService.requireParticipant(m, uid);
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/battle/pvp";
		}
		if (!pvpBattleService.isStarted(id)) {
			if (m.getHostUserId() == uid) {
				return "redirect:/battle/pvp/room/" + id;
			}
			return "redirect:/battle/pvp/join/" + id;
		}
		model.addAttribute("matchId", id);
		model.addAttribute("cardBack", GameConstants.cardBackUrl());
		model.addAttribute("cardPlateUrl", GameConstants.CARD_LAYER_BASE);
		model.addAttribute("cardDataUrl", GameConstants.CARD_LAYER_DATA);
		return "pvp-play";
	}

	@GetMapping("/api/{id}/ready")
	@ResponseBody
	public Map<String, Object> ready(@PathVariable String id) {
		long uid = CurrentUser.require().getId();
		var m = pvpBattleService.get(id);
		if (m == null) {
			return Map.of("started", false, "ok", false);
		}
		try {
			pvpBattleService.requireParticipant(m, uid);
		} catch (Exception e) {
			return Map.of("started", false, "ok", false);
		}
		return Map.of("started", pvpBattleService.isStarted(id), "ok", true);
	}

	@GetMapping(value = "/api/{id}/state", produces = "application/json")
	@ResponseBody
	public ResponseEntity<?> apiState(@PathVariable String id) {
		try {
			var dto = pvpBattleService.stateForUser(id, CurrentUser.require().getId());
			if (dto == null) {
				return ResponseEntity.noContent().build();
			}
			return ResponseEntity.ok(dto);
		} catch (Exception e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PostMapping(value = "/api/{id}/commit", consumes = "application/json", produces = "application/json")
	@ResponseBody
	public ResponseEntity<?> apiCommit(@PathVariable String id, @RequestBody CpuBattleCommitRequest req) {
		try {
			var dto = pvpBattleService.commit(id, CurrentUser.require().getId(), req);
			if (dto == null) {
				return ResponseEntity.notFound().build();
			}
			return ResponseEntity.ok(dto);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping(value = "/api/{id}/resolve", produces = "application/json")
	@ResponseBody
	public ResponseEntity<?> apiResolve(@PathVariable String id) {
		try {
			var dto = pvpBattleService.resolve(id, CurrentUser.require().getId());
			if (dto == null) {
				return ResponseEntity.notFound().build();
			}
			return ResponseEntity.ok(dto);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping(value = "/api/{id}/choice", consumes = "application/json", produces = "application/json")
	@ResponseBody
	public ResponseEntity<?> apiChoice(@PathVariable String id, @RequestBody CpuBattleChoiceRequest req) {
		try {
			var dto = pvpBattleService.choice(id, CurrentUser.require().getId(), req);
			if (dto == null) {
				return ResponseEntity.notFound().build();
			}
			return ResponseEntity.ok(dto);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping(value = "/api/{id}/timeout", produces = "application/json")
	@ResponseBody
	public ResponseEntity<?> apiTimeout(@PathVariable String id) {
		try {
			var dto = pvpBattleService.timeoutTick(id, CurrentUser.require().getId());
			if (dto == null) return ResponseEntity.notFound().build();
			return ResponseEntity.ok(dto);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping("/api/{id}/surrender")
	public String apiSurrender(@PathVariable String id, RedirectAttributes ra) {
		try {
			pvpBattleService.surrender(id, CurrentUser.require().getId());
			return "redirect:/home";
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/battle/pvp/play/" + id;
		}
	}
}
