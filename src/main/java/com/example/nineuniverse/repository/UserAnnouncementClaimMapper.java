package com.example.nineuniverse.repository;

import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserAnnouncementClaimMapper {

	/**
	 * 未受け取りなら 1 行挿入。既にあれば 0（PostgreSQL ON CONFLICT DO NOTHING）。
	 */
	int insertIfAbsent(@Param("userId") long userId, @Param("announcementKey") String announcementKey);

	boolean exists(@Param("userId") long userId, @Param("announcementKey") String announcementKey);

	/** ユーザーが受け取った announcement_key 一覧（重複なし想定）。 */
	List<String> findClaimedKeys(@Param("userId") long userId);
}
