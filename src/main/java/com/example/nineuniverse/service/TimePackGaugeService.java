package com.example.nineuniverse.service;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.domain.AppUser;
import com.example.nineuniverse.repository.AppUserMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TimePackGaugeService {

	private final AppUserMapper appUserMapper;
	private final PackService packService;

	public TimePackGaugeSnapshot snapshotForUser(long userId) {
		AppUser u = appUserMapper.findById(userId);
		Instant start = u != null && u.getTimePackCycleStart() != null
				? u.getTimePackCycleStart()
				: Instant.now();
		return computeSnapshot(start, Instant.now());
	}

	public static TimePackGaugeSnapshot computeSnapshot(Instant cycleStart, Instant now) {
		long elapsed = Duration.between(cycleStart, now).toMillis();
		if (elapsed < 0) {
			elapsed = 0;
		}
		long dur = GameConstants.TIME_PACK_CYCLE_DURATION_MS;
		double ratio = Math.min(1.0, (double) elapsed / dur);
		int packs = 0;
		if (ratio >= 1.0) {
			packs = 2;
		} else if (ratio >= 0.5) {
			packs = 1;
		}
		return new TimePackGaugeSnapshot(ratio, packs, cycleStart.toEpochMilli(), dur);
	}

	/**
	 * ゲージに応じて無料スタンダードを開封し、ゲージをリセットする。返り値は開封結果のカード ID（1〜2パック分）。
	 */
	@Transactional
	public List<Short> claimFreePacksFromGauge(long userId) {
		AppUser u = appUserMapper.findById(userId);
		if (u == null) {
			throw new IllegalStateException("ユーザーが見つかりません");
		}
		Instant start = u.getTimePackCycleStart() != null ? u.getTimePackCycleStart() : Instant.now();
		var snap = computeSnapshot(start, Instant.now());
		if (snap.availablePacks() == 0) {
			throw new IllegalStateException("ゲージが半分に達していません。しばらく待ってから再度お試しください。");
		}
		List<Short> merged = new ArrayList<>();
		for (int i = 0; i < snap.availablePacks(); i++) {
			var pulled = packService.openStandardPackWithoutGemCost(userId);
			for (var c : pulled) {
				if (c.getId() != null) {
					merged.add(c.getId());
				}
			}
		}
		appUserMapper.updateTimePackCycleStart(userId, Instant.now());
		return merged;
	}

	public record TimePackGaugeSnapshot(
			double fillRatio,
			int availablePacks,
			long cycleStartEpochMilli,
			long durationMs
	) {
		public int fillPercent() {
			return (int) Math.round(Math.min(1.0, Math.max(0.0, fillRatio)) * 100.0);
		}
	}
}
