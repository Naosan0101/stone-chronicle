package com.example.nineuniverse.web;

import com.example.nineuniverse.domain.AppUser;
import com.example.nineuniverse.security.AccountUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

	private CurrentUser() {
	}

	public static AppUser require() {
		Authentication a = SecurityContextHolder.getContext().getAuthentication();
		if (a == null || !(a.getPrincipal() instanceof AccountUserDetails d)) {
			throw new IllegalStateException("未ログインです");
		}
		return d.getUser();
	}
}
