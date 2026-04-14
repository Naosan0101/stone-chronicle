package com.example.nineuniverse.web;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.service.AnnouncementRewardService;
import com.example.nineuniverse.service.AnnouncementRewardService.ClaimOutcome;
import com.example.nineuniverse.service.MissionService;
import com.example.nineuniverse.service.TimePackGaugeService;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class HomeController {

	private final AppUserMapper appUserMapper;
	private final MissionService missionService;
	private final AnnouncementRewardService announcementRewardService;
	private final TimePackGaugeService timePackGaugeService;

	@GetMapping({"/", "/home"})
	public String home(Model model) {
		long uid = CurrentUser.require().getId();
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		boolean perfClaimed = announcementRewardService.hasClaimedPerfLight(uid);
		boolean perfInWindow = announcementRewardService.isWithinPerfLightWindow(today);
		model.addAttribute("perfLightAnnouncementClaimed", perfClaimed);
		model.addAttribute("perfLightAnnouncementClaimable", perfInWindow && !perfClaimed);
		model.addAttribute("perfLightAnnouncementExpiredUnclaimed",
				!perfClaimed && today.isAfter(GameConstants.ANNOUNCEMENT_PERF_LIGHT_LAST_DAY));
		model.addAttribute("perfLightAnnouncementFutureUnclaimed",
				!perfClaimed && today.isBefore(GameConstants.ANNOUNCEMENT_PERF_LIGHT_START));
		model.addAttribute("perfLightAnnouncementGemAmount", GameConstants.ANNOUNCEMENT_PERF_LIGHT_GEMS);

		boolean timeAnnClaimed = announcementRewardService.hasClaimedTimePackAnnouncement(uid);
		boolean timeAnnInWindow = announcementRewardService.isWithinTimePackAnnouncementWindow(today);
		model.addAttribute("timePackAnnouncementClaimed", timeAnnClaimed);
		model.addAttribute("timePackAnnouncementClaimable", timeAnnInWindow && !timeAnnClaimed);
		model.addAttribute("timePackAnnouncementExpiredUnclaimed",
				!timeAnnClaimed && today.isAfter(GameConstants.ANNOUNCEMENT_TIME_PACK_LAST_DAY));
		model.addAttribute("timePackAnnouncementFutureUnclaimed",
				!timeAnnClaimed && today.isBefore(GameConstants.ANNOUNCEMENT_TIME_PACK_START));
		model.addAttribute("timePackAnnouncementGemAmount", GameConstants.ANNOUNCEMENT_TIME_PACK_GEMS);

		var gauge = timePackGaugeService.snapshotForUser(uid);
		model.addAttribute("timePackFillPercent", gauge.fillPercent());
		model.addAttribute("timePackAvailablePacks", gauge.availablePacks());
		model.addAttribute("timePackCycleStartEpochMs", gauge.cycleStartEpochMilli());
		model.addAttribute("timePackDurationMs", gauge.durationMs());

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

	@PostMapping("/home/announcements/perf-light/claim")
	public String claimPerfLightAnnouncement(RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		ClaimOutcome outcome = announcementRewardService.claimPerfLightBonus(uid);
		switch (outcome) {
			case SUCCESS -> ra.addFlashAttribute("flashAnnouncementSuccess",
					GameConstants.ANNOUNCEMENT_PERF_LIGHT_GEMS + "ジェムを受け取りました。");
			case ALREADY_CLAIMED -> ra.addFlashAttribute("flashAnnouncementError", "既に受け取り済みです。");
			case NOT_YET_STARTED, EXPIRED -> ra.addFlashAttribute("flashAnnouncementError", "受け取り期限外です。");
		}
		return "redirect:/home";
	}

	@PostMapping("/home/announcements/time-pack/claim")
	public String claimTimePackAnnouncement(RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		ClaimOutcome outcome = announcementRewardService.claimTimePackAnnouncementBonus(uid);
		switch (outcome) {
			case SUCCESS -> ra.addFlashAttribute("flashAnnouncementSuccess",
					GameConstants.ANNOUNCEMENT_TIME_PACK_GEMS + "ジェムを受け取りました。");
			case ALREADY_CLAIMED -> ra.addFlashAttribute("flashAnnouncementError", "既に受け取り済みです。");
			case NOT_YET_STARTED, EXPIRED -> ra.addFlashAttribute("flashAnnouncementError", "受け取り期限外です。");
		}
		return "redirect:/home";
	}

	@PostMapping("/home/time-pack/open")
	public String openTimePack(HttpSession session, RedirectAttributes ra) {
		long uid = CurrentUser.require().getId();
		try {
			var ids = timePackGaugeService.claimFreePacksFromGauge(uid);
			session.setAttribute("pack_last_pulled_ids", ids);
			session.setAttribute("pack_last_type", "STANDARD");
			return "redirect:/pack/opening";
		} catch (IllegalStateException e) {
			ra.addFlashAttribute("flashTimePackError", e.getMessage());
			return "redirect:/home";
		}
	}
}
