package com.example.nineuniverse.service;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.repository.UserAnnouncementClaimMapper;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnouncementRewardService {

	private final UserAnnouncementClaimMapper userAnnouncementClaimMapper;
	private final AppUserMapper appUserMapper;

	public boolean hasClaimedPerfLight(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_PERF_LIGHT_KEY);
	}

	public boolean hasClaimedTimePackAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_TIME_PACK_KEY);
	}

	/** 受け取り可能期間内（開始日〜終了日を含む）か。 */
	public boolean isWithinPerfLightWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PERF_LIGHT_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_PERF_LIGHT_LAST_DAY);
	}

	public boolean isWithinPerfLightWindow() {
		return isWithinPerfLightWindow(LocalDate.now(ZoneId.systemDefault()));
	}

	/** 時間パックお知らせの受け取り可能期間（開始日〜終了日を含む）。 */
	public boolean isWithinTimePackAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_TIME_PACK_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_TIME_PACK_LAST_DAY);
	}

	public enum ClaimOutcome {
		SUCCESS,
		ALREADY_CLAIMED,
		NOT_YET_STARTED,
		EXPIRED
	}

	@Transactional
	public ClaimOutcome claimPerfLightBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PERF_LIGHT_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_PERF_LIGHT_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_PERF_LIGHT_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_PERF_LIGHT_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimTimePackAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_TIME_PACK_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_TIME_PACK_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_TIME_PACK_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_TIME_PACK_GEMS);
		return ClaimOutcome.SUCCESS;
	}
}
