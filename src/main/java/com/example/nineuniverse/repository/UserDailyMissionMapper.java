package com.example.nineuniverse.repository;

import com.example.nineuniverse.domain.UserDailyMission;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface UserDailyMissionMapper {
	List<UserDailyMission> findByUserAndDate(@Param("userId") long userId, @Param("missionDate") LocalDate missionDate);

	int deleteByUserAndDate(@Param("userId") long userId, @Param("missionDate") LocalDate missionDate);

	int insert(UserDailyMission row);

	int updateProgress(@Param("userId") long userId, @Param("missionDate") LocalDate missionDate,
			@Param("slot") short slot, @Param("progress") int progress);

	int markRewardGranted(@Param("userId") long userId, @Param("missionDate") LocalDate missionDate,
			@Param("slot") short slot);
}
