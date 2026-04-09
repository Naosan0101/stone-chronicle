package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.AppUser;
import com.example.stonechronicle.domain.UserDailyMission;
import com.example.stonechronicle.domain.UserWeeklyMission;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.repository.UserDailyMissionMapper;
import com.example.stonechronicle.repository.UserWeeklyMissionMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MissionService {

	private static final ZoneId TZ = ZoneId.of("Asia/Tokyo");

	private static final String[][] DAILY_POOL = {
			{"OPEN_PACK", "カードパックを2回引く", "2"},
			{"CPU_BATTLE", "CPUバトルを1回開始する", "1"},
			{"SAVE_DECK", "デッキを1回保存する", "1"},
	};

	/** おおよそ4日程度のプレイで達成しやすい週次目標 */
	private static final String[][] WEEKLY_POOL = {
			{"W_OPEN_PACK", "カードパックを5回引く", "5"},
			{"W_CPU_BATTLE", "CPUバトルを4回開始する", "4"},
			{"W_SAVE_DECK", "デッキを3回保存する", "3"},
	};

	private final UserDailyMissionMapper dailyMissionMapper;
	private final UserWeeklyMissionMapper weeklyMissionMapper;
	private final AppUserMapper appUserMapper;

	public List<UserDailyMission> todayMissions(long userId) {
		LocalDate today = LocalDate.now(TZ);
		return dailyMissionMapper.findByUserAndDate(userId, today);
	}

	public List<UserWeeklyMission> currentWeekMissions(long userId) {
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		return weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart);
	}

	private static LocalDate weekStartMonday(LocalDate d) {
		return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
	}

	@Transactional
	public void ensureDailyMissions(long userId) {
		LocalDate today = LocalDate.now(TZ);
		List<UserDailyMission> existing = dailyMissionMapper.findByUserAndDate(userId, today);
		if (!existing.isEmpty()) {
			return;
		}
		List<Integer> idx = new ArrayList<>(List.of(0, 1, 2));
		Collections.shuffle(idx);
		for (int s = 0; s < 3; s++) {
			int p = idx.get(s);
			UserDailyMission row = new UserDailyMission();
			row.setUserId(userId);
			row.setMissionDate(today);
			row.setSlot((short) (s + 1));
			row.setMissionCode(DAILY_POOL[p][0]);
			row.setTitle(DAILY_POOL[p][1]);
			row.setTargetCount(Integer.parseInt(DAILY_POOL[p][2]));
			row.setProgress(0);
			row.setRewardGranted(false);
			dailyMissionMapper.insert(row);
		}
		AppUser u = appUserMapper.findById(userId);
		if (u != null && (u.getLastMissionDate() == null || !u.getLastMissionDate().equals(today))) {
			appUserMapper.updateLastMissionDate(userId, today);
		}
	}

	@Transactional
	public void ensureWeeklyMissions(long userId) {
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		List<UserWeeklyMission> existing = weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart);
		if (!existing.isEmpty()) {
			return;
		}
		List<Integer> idx = new ArrayList<>(List.of(0, 1, 2));
		Collections.shuffle(idx);
		for (int s = 0; s < 3; s++) {
			int p = idx.get(s);
			UserWeeklyMission row = new UserWeeklyMission();
			row.setUserId(userId);
			row.setWeekStart(weekStart);
			row.setSlot((short) (s + 1));
			row.setMissionCode(WEEKLY_POOL[p][0]);
			row.setTitle(WEEKLY_POOL[p][1]);
			row.setTargetCount(Integer.parseInt(WEEKLY_POOL[p][2]));
			row.setProgress(0);
			row.setRewardGranted(false);
			weeklyMissionMapper.insert(row);
		}
	}

	@Transactional
	public void onPackOpened(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		bumpDaily(userId, "OPEN_PACK");
		bumpWeekly(userId, "W_OPEN_PACK");
	}

	@Transactional
	public void onCpuBattleStarted(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		bumpDaily(userId, "CPU_BATTLE");
		bumpWeekly(userId, "W_CPU_BATTLE");
	}

	@Transactional
	public void onDeckSaved(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		bumpDaily(userId, "SAVE_DECK");
		bumpWeekly(userId, "W_SAVE_DECK");
	}

	private void bumpDaily(long userId, String code) {
		LocalDate today = LocalDate.now(TZ);
		List<UserDailyMission> rows = dailyMissionMapper.findByUserAndDate(userId, today);
		for (UserDailyMission r : rows) {
			if (!code.equals(r.getMissionCode()) || Boolean.TRUE.equals(r.getRewardGranted())) {
				continue;
			}
			int np = Math.min(r.getTargetCount(), r.getProgress() + 1);
			dailyMissionMapper.updateProgress(userId, today, r.getSlot(), np);
			if (np >= r.getTargetCount()) {
				grantDaily(userId, today, r.getSlot());
			}
		}
	}

	private void bumpWeekly(long userId, String code) {
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		List<UserWeeklyMission> rows = weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart);
		for (UserWeeklyMission r : rows) {
			if (!code.equals(r.getMissionCode()) || Boolean.TRUE.equals(r.getRewardGranted())) {
				continue;
			}
			int np = Math.min(r.getTargetCount(), r.getProgress() + 1);
			weeklyMissionMapper.updateProgress(userId, weekStart, r.getSlot(), np);
			if (np >= r.getTargetCount()) {
				grantWeekly(userId, weekStart, r.getSlot());
			}
		}
	}

	private void grantDaily(long userId, LocalDate today, short slot) {
		UserDailyMission row = dailyMissionMapper.findByUserAndDate(userId, today).stream()
				.filter(m -> m.getSlot() == slot)
				.findFirst()
				.orElse(null);
		if (row == null || Boolean.TRUE.equals(row.getRewardGranted())) {
			return;
		}
		AppUser u = appUserMapper.findById(userId);
		if (u == null) {
			return;
		}
		appUserMapper.updateCoins(userId, u.getCoins() + GameConstants.MISSION_REWARD_COINS);
		dailyMissionMapper.markRewardGranted(userId, today, slot);
	}

	private void grantWeekly(long userId, LocalDate weekStart, short slot) {
		UserWeeklyMission row = weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart).stream()
				.filter(m -> m.getSlot() == slot)
				.findFirst()
				.orElse(null);
		if (row == null || Boolean.TRUE.equals(row.getRewardGranted())) {
			return;
		}
		AppUser u = appUserMapper.findById(userId);
		if (u == null) {
			return;
		}
		appUserMapper.updateCoins(userId, u.getCoins() + GameConstants.MISSION_WEEKLY_REWARD_COINS);
		weeklyMissionMapper.markRewardGranted(userId, weekStart, slot);
	}
}
