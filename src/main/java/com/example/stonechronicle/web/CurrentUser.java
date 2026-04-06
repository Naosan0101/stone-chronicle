package com.example.stonechronicle.web;

import com.example.stonechronicle.domain.AppUser;
import com.example.stonechronicle.security.AccountUserDetails;
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
