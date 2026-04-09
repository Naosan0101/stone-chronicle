package com.example.stonechronicle.repository;

import com.example.stonechronicle.domain.AppUser;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;

public interface AppUserMapper {
	AppUser findByUsername(@Param("username") String username);

	AppUser findById(@Param("id") long id);

	@Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
	int insert(AppUser user);

	int updateCoins(@Param("id") long id, @Param("coins") int coins);

	/**
	 * {@code welcome_home_bonus_granted = false} のときだけ {@code amount} を加算し true にする。競合時は 0 行。
	 */
	int grantWelcomeHomeBonusIfPending(@Param("id") long id, @Param("amount") int amount);

	int updateLastMissionDate(@Param("id") long id, @Param("lastMissionDate") LocalDate lastMissionDate);

	int updateLastAccessAt(@Param("id") long id, @Param("at") LocalDateTime at);

	int deleteUsersWithLastAccessBefore(@Param("before") LocalDateTime before);
}
