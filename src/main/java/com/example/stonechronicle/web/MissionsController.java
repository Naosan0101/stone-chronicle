package com.example.stonechronicle.web;

import com.example.stonechronicle.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/missions")
@RequiredArgsConstructor
public class MissionsController {

	private final MissionService missionService;

	@GetMapping
	public String missions(Model model) {
		long uid = CurrentUser.require().getId();
		missionService.ensureDailyMissions(uid);
		missionService.ensureWeeklyMissions(uid);
		model.addAttribute("missions", missionService.todayMissions(uid));
		model.addAttribute("weeklyMissions", missionService.currentWeekMissions(uid));
		return "missions";
	}
}
