package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.AppUser;
import com.example.stonechronicle.repository.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationService {

	private final AppUserMapper appUserMapper;
	private final PasswordEncoder passwordEncoder;

	@Transactional
	public void register(String username, String rawPassword) {
		if (username == null || username.isBlank() || rawPassword.length() < 4) {
			throw new IllegalArgumentException("ユーザーIDとパスワード（4文字以上）を入力してください");
		}
		if (appUserMapper.findByUsername(username.trim()) != null) {
			throw new IllegalArgumentException("そのユーザーIDは既に使われています");
		}
		AppUser u = new AppUser();
		u.setUsername(username.trim());
		u.setPasswordHash(passwordEncoder.encode(rawPassword));
		u.setCoins(GameConstants.STARTING_COINS);
		u.setLastMissionDate(null);
		appUserMapper.insert(u);
	}
}
