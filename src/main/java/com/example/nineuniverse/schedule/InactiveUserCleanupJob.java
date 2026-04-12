package com.example.nineuniverse.schedule;

import com.example.nineuniverse.repository.AppUserMapper;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 最終アクセスから一定期間経過したユーザーを削除する（関連データは FK の ON DELETE CASCADE で削除）。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InactiveUserCleanupJob {

	private final AppUserMapper appUserMapper;

	@Value("${app.inactive-user.retention-days:7}")
	private int retentionDays;

	@Scheduled(cron = "${app.inactive-user.cleanup-cron:0 0 4 * * *}")
	@Transactional
	public void removeInactiveUsers() {
		int days = Math.max(1, retentionDays);
		LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
		int removed = appUserMapper.deleteUsersWithLastAccessBefore(cutoff);
		if (removed > 0) {
			log.info("Inactive user cleanup: removed {} account(s) (last_access_at before {})", removed, cutoff);
		}
	}
}
