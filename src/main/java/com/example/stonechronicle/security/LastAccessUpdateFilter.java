package com.example.stonechronicle.security;

import com.example.stonechronicle.repository.AppUserMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * ログイン中ユーザーの最終アクセス時刻を更新する（DB更新は間引き）。
 */
@Component
@RequiredArgsConstructor
public class LastAccessUpdateFilter extends OncePerRequestFilter {

	static final String SESSION_LAST_ACCESS_DB_MS = "LAST_ACCESS_DB_UPDATE_MS";

	private final AppUserMapper appUserMapper;

	@Value("${app.inactive-user.last-access-db-interval-minutes:15}")
	private int dbIntervalMinutes;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		try {
			var auth = SecurityContextHolder.getContext().getAuthentication();
			if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof AccountUserDetails d) {
				Long uid = d.getUser().getId();
				if (uid != null && shouldPersistToDb(request.getSession(false))) {
					appUserMapper.updateLastAccessAt(uid, LocalDateTime.now());
				}
			}
		} catch (Exception ignored) {
			// アクセス記録の失敗でリクエスト全体を落とさない
		}
		filterChain.doFilter(request, response);
	}

	private boolean shouldPersistToDb(HttpSession session) {
		if (session == null) {
			return true;
		}
		long now = System.currentTimeMillis();
		long intervalMs = Math.max(1, dbIntervalMinutes) * 60_000L;
		Object prev = session.getAttribute(SESSION_LAST_ACCESS_DB_MS);
		if (prev instanceof Long last && now - last < intervalMs) {
			return false;
		}
		session.setAttribute(SESSION_LAST_ACCESS_DB_MS, now);
		return true;
	}
}
