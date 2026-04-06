package com.example.stonechronicle.web;

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
		var fresh = appUserMapper.findById(uid);
		missionService.ensureDailyMissions(uid);
		model.addAttribute("user", fresh);
		model.addAttribute("missions", missionService.todayMissions(uid));
		return "home";
	}
}
