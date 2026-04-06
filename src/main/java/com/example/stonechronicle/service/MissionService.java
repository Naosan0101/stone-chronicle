package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.AppUser;
import com.example.stonechronicle.domain.UserDailyMission;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.repository.UserDailyMissionMapper;
import java.time.LocalDate;
import java.time.ZoneId;
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

	private static final String[][] POOL = {
			{"OPEN_PACK", "カードパックを2回引く", "2"},
			{"CPU_BATTLE", "CPUバトルを1回開始する", "1"},
			{"SAVE_DECK", "デッキを1回保存する", "1"},
	};

	private final UserDailyMissionMapper missionMapper;
	private final AppUserMapper appUserMapper;

	public List<UserDailyMission> todayMissions(long userId) {
		LocalDate today = LocalDate.now(TZ);
		return missionMapper.findByUserAndDate(userId, today);
	}

	@Transactional
	public void ensureDailyMissions(long userId) {
		LocalDate today = LocalDate.now(TZ);
		List<UserDailyMission> existing = missionMapper.findByUserAndDate(userId, today);
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
			row.setMissionCode(POOL[p][0]);
			row.setTitle(POOL[p][1]);
			row.setTargetCount(Integer.parseInt(POOL[p][2]));
			row.setProgress(0);
			row.setRewardGranted(false);
			missionMapper.insert(row);
		}
		AppUser u = appUserMapper.findById(userId);
		if (u != null && (u.getLastMissionDate() == null || !u.getLastMissionDate().equals(today))) {
			appUserMapper.updateLastMissionDate(userId, today);
		}
	}

	@Transactional
	public void onPackOpened(long userId) {
		bump(userId, "OPEN_PACK");
	}

	@Transactional
	public void onCpuBattleStarted(long userId) {
		bump(userId, "CPU_BATTLE");
	}

	@Transactional
	public void onDeckSaved(long userId) {
		bump(userId, "SAVE_DECK");
	}

	private void bump(long userId, String code) {
		LocalDate today = LocalDate.now(TZ);
		List<UserDailyMission> rows = missionMapper.findByUserAndDate(userId, today);
		for (UserDailyMission r : rows) {
			if (!code.equals(r.getMissionCode()) || Boolean.TRUE.equals(r.getRewardGranted())) {
				continue;
			}
			int np = Math.min(r.getTargetCount(), r.getProgress() + 1);
			missionMapper.updateProgress(userId, today, r.getSlot(), np);
			if (np >= r.getTargetCount()) {
				grant(userId, today, r.getSlot());
			}
		}
	}

	private void grant(long userId, LocalDate today, short slot) {
		UserDailyMission row = missionMapper.findByUserAndDate(userId, today).stream()
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
		missionMapper.markRewardGranted(userId, today, slot);
	}
}
