package com.example.stonechronicle.repository;

import com.example.stonechronicle.domain.UserWeeklyMission;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface UserWeeklyMissionMapper {
	List<UserWeeklyMission> findByUserAndWeekStart(@Param("userId") long userId, @Param("weekStart") LocalDate weekStart);

	int insert(UserWeeklyMission row);

	int updateProgress(@Param("userId") long userId, @Param("weekStart") LocalDate weekStart,
			@Param("slot") short slot, @Param("progress") int progress);

	int markRewardGranted(@Param("userId") long userId, @Param("weekStart") LocalDate weekStart,
			@Param("slot") short slot);
}
