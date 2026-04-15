package com.example.nineuniverse.service;

import com.example.nineuniverse.domain.AppUser;
import com.example.nineuniverse.domain.UserDailyMission;
import com.example.nineuniverse.domain.UserWeeklyMission;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.repository.UserDailyMissionMapper;
import com.example.nineuniverse.repository.UserWeeklyMissionMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MissionService {

	private static final ZoneId TZ = ZoneId.of("Asia/Tokyo");

	private static final String[][] DAILY_POOL = {
			{"D_CPU_WIN_L1", "「ひとりで対戦」でレベル1のCPUに1回勝利する", "1"},
			{"D_CPU_WIN_L2", "「ひとりで対戦」でレベル2のCPUに1回勝利する", "1"},
			{"D_PVP", "「だれかと対戦」を1回する", "1"},
			{"D_PACK", "パックを2回引く", "2"},
			{"D_BONUS", "ボーナスパックを1回開封する", "1"},
	};

	private static final String[][] WEEKLY_POOL = {
			{"W_CPU_WIN_L2", "「ひとりで対戦」でレベル2のCPUに5回勝利する", "5"},
			{"W_CPU_WIN_L3", "「ひとりで対戦」でレベル3のCPUに5回勝利する", "5"},
			{"W_PVP", "「だれかと対戦」を10回する", "10"},
			{"W_PACK", "パックを10回引く", "10"},
			{"W_BONUS", "ボーナスパックを6回開封する", "6"},
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

	public boolean hasUnclaimedMissionRewards(long userId) {
		LocalDate today = LocalDate.now(TZ);
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		for (UserDailyMission m : dailyMissionMapper.findByUserAndDate(userId, today)) {
			if (Boolean.TRUE.equals(m.getRewardGranted())) {
				continue;
			}
			if (m.getProgress() != null && m.getTargetCount() != null
					&& m.getProgress() >= m.getTargetCount()) {
				return true;
			}
		}
		for (UserWeeklyMission w : weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart)) {
			if (Boolean.TRUE.equals(w.getRewardGranted())) {
				continue;
			}
			if (w.getProgress() != null && w.getTargetCount() != null
					&& w.getProgress() >= w.getTargetCount()) {
				return true;
			}
		}
		return false;
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
		List<Integer> idx = new ArrayList<>(List.of(0, 1, 2, 3, 4));
		Collections.shuffle(idx);
		var rnd = ThreadLocalRandom.current();
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
			row.setRewardGems(3 + rnd.nextInt(2));
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
		List<Integer> idx = new ArrayList<>(List.of(0, 1, 2, 3, 4));
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
			row.setRewardGems(10);
			weeklyMissionMapper.insert(row);
		}
	}

	@Transactional
	public void onPaidPackOpened(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		bumpDaily(userId, "D_PACK", 1);
		bumpWeekly(userId, "W_PACK", 1);
	}

	@Transactional
	public void onBonusPackOpened(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		// ボーナスパックも「パックを引く」系の回数に含める
		bumpDaily(userId, "D_PACK", 1);
		bumpWeekly(userId, "W_PACK", 1);
		bumpDaily(userId, "D_BONUS", 1);
		bumpWeekly(userId, "W_BONUS", 1);
	}

	@Transactional
	public void onCpuBattleWon(long userId, int cpuLevel) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		if (cpuLevel == 1) {
			bumpDaily(userId, "D_CPU_WIN_L1", 1);
		} else if (cpuLevel == 2) {
			bumpDaily(userId, "D_CPU_WIN_L2", 1);
			bumpWeekly(userId, "W_CPU_WIN_L2", 1);
		} else if (cpuLevel == 3) {
			bumpWeekly(userId, "W_CPU_WIN_L3", 1);
		}
	}

	@Transactional
	public void onPvpBattlePlayed(long userId) {
		ensureDailyMissions(userId);
		ensureWeeklyMissions(userId);
		bumpDaily(userId, "D_PVP", 1);
		bumpWeekly(userId, "W_PVP", 1);
	}

	private void bumpDaily(long userId, String code, int delta) {
		LocalDate today = LocalDate.now(TZ);
		List<UserDailyMission> rows = dailyMissionMapper.findByUserAndDate(userId, today);
		for (UserDailyMission r : rows) {
			if (!code.equals(r.getMissionCode()) || Boolean.TRUE.equals(r.getRewardGranted())) {
				continue;
			}
			int np = Math.min(r.getTargetCount(), r.getProgress() + delta);
			dailyMissionMapper.updateProgress(userId, today, r.getSlot(), np);
		}
	}

	private void bumpWeekly(long userId, String code, int delta) {
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		List<UserWeeklyMission> rows = weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart);
		for (UserWeeklyMission r : rows) {
			if (!code.equals(r.getMissionCode()) || Boolean.TRUE.equals(r.getRewardGranted())) {
				continue;
			}
			int np = Math.min(r.getTargetCount(), r.getProgress() + delta);
			weeklyMissionMapper.updateProgress(userId, weekStart, r.getSlot(), np);
		}
	}

	@Transactional
	public void claimDailyReward(long userId, short slot) {
		LocalDate today = LocalDate.now(TZ);
		UserDailyMission row = dailyMissionMapper.findByUserAndDate(userId, today).stream()
				.filter(m -> m.getSlot() != null && m.getSlot() == slot)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("ミッションが見つかりません"));
		if (Boolean.TRUE.equals(row.getRewardGranted())) {
			throw new IllegalStateException("すでに受け取り済みです");
		}
		if (row.getProgress() == null || row.getTargetCount() == null
				|| row.getProgress() < row.getTargetCount()) {
			throw new IllegalStateException("まだ達成していません");
		}
		int gems = row.getRewardGems() != null ? row.getRewardGems() : 3;
		appUserMapper.addCoinsDelta(userId, gems);
		dailyMissionMapper.markRewardGranted(userId, today, slot);
	}

	@Transactional
	public void claimWeeklyReward(long userId, short slot) {
		LocalDate weekStart = weekStartMonday(LocalDate.now(TZ));
		UserWeeklyMission row = weeklyMissionMapper.findByUserAndWeekStart(userId, weekStart).stream()
				.filter(m -> m.getSlot() != null && m.getSlot() == slot)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("ミッションが見つかりません"));
		if (Boolean.TRUE.equals(row.getRewardGranted())) {
			throw new IllegalStateException("すでに受け取り済みです");
		}
		if (row.getProgress() == null || row.getTargetCount() == null
				|| row.getProgress() < row.getTargetCount()) {
			throw new IllegalStateException("まだ達成していません");
		}
		int gems = row.getRewardGems() != null ? row.getRewardGems() : 10;
		appUserMapper.addCoinsDelta(userId, gems);
		weeklyMissionMapper.markRewardGranted(userId, weekStart, slot);
	}
}
