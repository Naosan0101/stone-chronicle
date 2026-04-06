package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.service.CpuBattleService;
import com.example.stonechronicle.service.DeckService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/battle/cpu")
@RequiredArgsConstructor
public class CpuBattleController {

	private final CpuBattleService cpuBattleService;
	private final DeckService deckService;

	@GetMapping
	public String menu(Model model) {
		long uid = CurrentUser.require().getId();
		model.addAttribute("decks", deckService.listDecks(uid));
		return "cpu-menu";
	}

	@PostMapping("/start")
	public String start(@RequestParam long deckId, @RequestParam int level, HttpSession session, RedirectAttributes ra) {
		try {
			long uid = CurrentUser.require().getId();
			cpuBattleService.start(uid, deckId, level, session);
			return "redirect:/battle/cpu/play";
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/battle/cpu";
		}
	}

	@GetMapping("/play")
	public String play(Model model, HttpSession session) {
		var st = cpuBattleService.current(session);
		if (st == null) {
			return "redirect:/battle/cpu";
		}
		var defs = cpuBattleService.defs();
		model.addAttribute("state", st);
		model.addAttribute("defs", defs);
		model.addAttribute("cardBack", GameConstants.CARD_IMAGE_PREFIX + GameConstants.CARD_BACK_FILE);
		CardDefinition hb = null;
		CardDefinition cb = null;
		if (st.getHumanBattle() != null && st.getHumanBattle().getMain() != null) {
			hb = defs.get(st.getHumanBattle().getMain().getCardId());
		}
		if (st.getCpuBattle() != null && st.getCpuBattle().getMain() != null) {
			cb = defs.get(st.getCpuBattle().getMain().getCardId());
		}
		model.addAttribute("humanBattleDef", hb);
		model.addAttribute("cpuBattleDef", cb);
		return "cpu-play";
	}

	@PostMapping("/act")
	public String act(@RequestParam(defaultValue = "0") int levelUpRest,
			@RequestParam(defaultValue = "0") int levelUpStones,
			@RequestParam(required = false) String deploy,
			@RequestParam(defaultValue = "0") int deployIndex,
			HttpSession session) {
		boolean doDeploy = "true".equalsIgnoreCase(deploy);
		cpuBattleService.humanAct(session, levelUpRest, levelUpStones, doDeploy, deployIndex);
		return "redirect:/battle/cpu/play";
	}

	@PostMapping("/surrender")
	public String surrender(HttpSession session) {
		cpuBattleService.clear(session);
		return "redirect:/home";
	}
}
