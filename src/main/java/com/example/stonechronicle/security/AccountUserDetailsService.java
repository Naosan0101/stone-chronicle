package com.example.stonechronicle.security;

import com.example.stonechronicle.repository.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountUserDetailsService implements UserDetailsService {

	private final AppUserMapper appUserMapper;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var user = appUserMapper.findByUsername(username);
		if (user == null) {
			throw new UsernameNotFoundException(username);
		}
		return new AccountUserDetails(user);
	}
}
