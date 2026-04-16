package com.example.nineuniverse.service;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.repository.UserAnnouncementClaimMapper;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnouncementRewardService {

	private final UserAnnouncementClaimMapper userAnnouncementClaimMapper;
	private final AppUserMapper appUserMapper;

	/**
	 * ホーム画面などで「複数のお知らせの受け取り済み判定」をまとめて行う用途。
	 * （個別 exists の多重発行を避ける）
	 */
	public Set<String> findClaimedKeys(long userId) {
		return new HashSet<>(userAnnouncementClaimMapper.findClaimedKeys(userId));
	}

	public boolean hasClaimedPerfLight(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_PERF_LIGHT_KEY);
	}

	public boolean hasClaimedTimePackAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_TIME_PACK_KEY);
	}

	public boolean hasClaimedBalanceUiMission(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_KEY);
	}

	public boolean hasClaimedPackRatesAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_PACK_RATES_KEY);
	}

	public boolean hasClaimedPackResultDrawAgainAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_KEY);
	}

	public boolean hasClaimedCaptainTextAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_KEY);
	}

	public boolean hasClaimedMissionFixAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_MISSION_FIX_KEY);
	}

	public boolean hasClaimedCardTextFixAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_KEY);
	}

	public boolean hasClaimedSamuraiFixAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_SAMURAI_FIX_KEY);
	}

	public boolean hasClaimedPackMissionBonusFixAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_KEY);
	}

	public boolean hasClaimed30UsersAnnouncement(long userId) {
		return userAnnouncementClaimMapper.exists(userId, GameConstants.ANNOUNCEMENT_30_USERS_KEY);
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

	public boolean isWithinBalanceUiMissionWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_LAST_DAY);
	}

	public boolean isWithinPackRatesAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_RATES_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_PACK_RATES_LAST_DAY);
	}

	public boolean isWithinPackResultDrawAgainAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_LAST_DAY);
	}

	public boolean isWithinCaptainTextAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_LAST_DAY);
	}

	public boolean isWithinMissionFixAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_MISSION_FIX_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_MISSION_FIX_LAST_DAY);
	}

	public boolean isWithinCardTextFixAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_LAST_DAY);
	}

	public boolean isWithinSamuraiFixAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_SAMURAI_FIX_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_SAMURAI_FIX_LAST_DAY);
	}

	public boolean isWithinPackMissionBonusFixAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_LAST_DAY);
	}

	public boolean isWithin30UsersAnnouncementWindow(LocalDate today) {
		if (today.isBefore(GameConstants.ANNOUNCEMENT_30_USERS_START)) {
			return false;
		}
		return !today.isAfter(GameConstants.ANNOUNCEMENT_30_USERS_LAST_DAY);
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

	@Transactional
	public ClaimOutcome claimBalanceUiMissionBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_BALANCE_UI_MISSION_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimPackRatesAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_RATES_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_PACK_RATES_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_PACK_RATES_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_PACK_RATES_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimPackResultDrawAgainAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimCaptainTextAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_CAPTAIN_TEXT_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimMissionFixAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_MISSION_FIX_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_MISSION_FIX_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_MISSION_FIX_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_MISSION_FIX_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimCardTextFixAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_CARD_TEXT_FIX_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimSamuraiFixAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_SAMURAI_FIX_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_SAMURAI_FIX_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_SAMURAI_FIX_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_SAMURAI_FIX_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claimPackMissionBonusFixAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(
				userId, GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_GEMS);
		return ClaimOutcome.SUCCESS;
	}

	@Transactional
	public ClaimOutcome claim30UsersAnnouncementBonus(long userId) {
		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		if (today.isBefore(GameConstants.ANNOUNCEMENT_30_USERS_START)) {
			return ClaimOutcome.NOT_YET_STARTED;
		}
		if (today.isAfter(GameConstants.ANNOUNCEMENT_30_USERS_LAST_DAY)) {
			return ClaimOutcome.EXPIRED;
		}
		int inserted = userAnnouncementClaimMapper.insertIfAbsent(userId, GameConstants.ANNOUNCEMENT_30_USERS_KEY);
		if (inserted == 0) {
			return ClaimOutcome.ALREADY_CLAIMED;
		}
		appUserMapper.addCoinsDelta(userId, GameConstants.ANNOUNCEMENT_30_USERS_GEMS);
		return ClaimOutcome.SUCCESS;
	}
}
