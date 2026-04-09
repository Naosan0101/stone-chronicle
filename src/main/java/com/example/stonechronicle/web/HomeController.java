package com.example.stonechronicle.web;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {

	private final AppUserMapper appUserMapper;
	private final MissionService missionService;

	@GetMapping({"/", "/home"})
	public String home(Model model) {
		long uid = CurrentUser.require().getId();
		int granted = appUserMapper.grantWelcomeHomeBonusIfPending(uid, GameConstants.WELCOME_HOME_BONUS_GEMS);
		if (granted > 0) {
			model.addAttribute("welcomeHomeBonusShown", true);
			model.addAttribute("welcomeHomeBonusAmount", GameConstants.WELCOME_HOME_BONUS_GEMS);
		}
		missionService.ensureDailyMissions(uid);
		missionService.ensureWeeklyMissions(uid);
		var fresh = appUserMapper.findById(uid);
		model.addAttribute("user", fresh);
		model.addAttribute("missions", missionService.todayMissions(uid));
		model.addAttribute("weeklyMissions", missionService.currentWeekMissions(uid));
		return "home";
	}
}
